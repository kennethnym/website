---
title: 'diving into mathjax css injection attack'
description: 'a write-up on the recent mathjax css injection vulnerability'
pubDate: 'Jun 09 2024'
heroImage: '/mathjax-screenshot.png'
image: '/mathjax-screenshot.png'
---


on june 7th, 2024, [@cloud11665](https://x.com/cloud11665) discovered that it is possible to inject arbitrary css style through math mode of README files on GitHub ([tweet here.](https://x.com/cloud11665/status/1799136093071163396)) this write-up is a summary of how to achieve the injection and how it is possible.

## how to achieve the injection

this exploitation can be traced back to [this GitHub issue](https://github.com/mathjax/MathJax/issues/3129) originally reported by [opcode86](https://github.com/opcode86). github uses [mathjax](https://www.mathjax.org/) to render math expressions presented in any github markdown content, such as README files, issue comments, and pull request comments. one of the many latex macros that mathjax supports is called `\unicode`. it allows the rendering of a unicode character. it also allows the font style of the character to be customized by letting the user pass in a custom font family, like so:

```latex
\unicode[myfont](x0000)
```

turns out, it is possible to inject any inline css within the square bracket:

```latex
\unicode[myfont; color: red; position: fixed; top: 0](x0000)
```

the css is then injected to the `style` attribute of the `<mtext>` element that displays the unicode character. many have taken this opportunity to rice up their github profile pages. u can visit my [github page](https://github.com/kennethnym/) to find out what i have done!

## diving into mathjax's source code

to find out how this is possible, i decided to dive into mathjax's source code. to no one's surprise, it is a bundle of oop spaghetti that demanded careful un-wrangling.

### the unicode macro

taking a look at the code behind `\unicode`, and u can already tell what went wrong. here is an excerpt:

```ts
UnicodeMethods.Unicode = function (parser: TexParser, name: string) {
  let HD = parser.GetBrackets(name);
  let HDsplit = null;
  let font = null;
  if (HD) {
    if (HD.replace(/ /g, '').match(/^(\d+(\.\d*)?|\.\d+),(\d+(\.\d*)?|\.\d+)$/)) {
      HDsplit = HD.replace(/ /g, '').split(/,/);
      font = parser.GetBrackets(name);
    } else {
      font = HD;
    }
  }

  // ... shenanigans ...

  let def: EnvList = {};
  let variant = parser.stack.env.font as string;

  if (font) {
    UnicodeCache[N][2] = def.fontfamily = font.replace(/'/g, '\'');
    if (variant) {
      if (variant.match(/bold/)) {
        def.fontweight = 'bold';
      }
      if (variant.match(/italic|-mathit/)) {
        def.fontstyle = 'italic';
      }
    }
  } else if (variant) { /* ... */ }

  let node = parser.create('token', 'mtext', def, numeric(n));
  NodeUtil.setProperty(node, 'unicode', true);

  // ... more shenanigans ...
}
```

let's untangle this:

- `parser.GetBrackets(name)` retrieves the string in between `[ ]`; the string is then stored in `HD`.
- `font` also stores the string in between the square brackets, depending on some conditions on `HD` which is not significant here.

judging from the variable name, we can infer that `font` is supposed to store the font family specified by the user that should be used for the unicode character. after some shenanigans, the code populates the `def` variable if `font` is non-empty. at this point, we are not sure what exactly `def` and `variant` represents because of the frankly horrible names. however, we know that:

- `def.fontfamily` is `font` with single quotes (`'`) escaped; and
- `def.fontweight` and `def.fontstyle` probably represents the font weight and the font style of the unicode character.

after populating `def`, a parser node representing an `<mtext>` is created, passing in `def`. at this point, we know

- that `def.fontfamily` can hold any arbitrary string within the square bracket, including inline css, because no sanitization work besides quote-escaping has been done; and
- that `<mtext>`, provided by [MathML](https://developer.mozilla.org/en-US/docs/Web/MathML), an xml-based language for describing math, is used to display the unicode character.

### the latex parser

let's now look at the `create` method of `TexParser` invoked by `parser.create`:

```ts
export default class TexParser {
  // ...

  constructor(private _string: string, env: EnvList, public configuration: ParseOptions) {
    const inner = env.hasOwnProperty('isInner');
    const isInner = env['isInner'] as boolean;
    delete env['isInner'];
    let ENV: EnvList;
    if (env) {
      ENV = {};
      for (const id of Object.keys(env)) {
        ENV[id] = env[id];
      }
    }
    this.configuration.pushParser(this);
    this.stack = new Stack(
      this.itemFactory,
      ENV,
      inner
        ? isInner
        : true
    );
    this.Parse();
    this.Push(this.itemFactory.create('stop'));
  }

  // ...

  /**
   * Convenience method to create nodes with the node factory of the current
   * configuration.
   * @param {string} kind The kind of node to create.
   * @param {any[]} ...rest The remaining arguments for the creation method.
   * @return {MmlNode} The newly created node.
   */
  public create(kind : string, ...rest : any[]): MmlNode {
    return this.configuration.nodeFactory.create(kind, ...rest);
  }
}
```

not very helpful, but we now know that `nodeFactory` is responsible for constructing the node representation of the unicode macro. for brevity, i have untangled all the indirections this innocent `create` is behind, bringing us to this function under `AbstractMmlNode`:

```ts
// ...why?
export abstract class AbstractMmlNode extends AbstractNode implements MmlNode {
  // ...

  constructor(factory : MmlFactory, attributes : PropertyList = {}, children : MmlNode[] = []) {
    super(factory);
    if (this.arity < 0) {
      this.childNodes = [factory.create('inferredMrow')];
      this.childNodes[0].parent = this;
    }
    this.setChildren(children);
    this.attributes = new Attributes(
      factory.getNodeClass(this.kind).defaults,
      factory.getNodeClass('math').defaults,
    );
    this.attributes.setList(attributes);
  }

  // ...
}
```

now, it is clear that `def` represents the attributes of the node created by `parser.create`, including `fontfamily`, `fontstyle`, and `fontweight`. they are then stored in `AbstractMmlNode.attributes` via `this.attributes.setList(attributes)`.

## outputting to the dom

after compiling every math expression on the page and producing the corresponding tree comprising `MmlNode`s, mathjax moves on to outputting the compiled results into the dom. This is handled by a class called `CHTML` that extends `CommonOutputJax`. `CommonOutputJax` provides most of the outputting logic, while `CHTML` provides the HTML glue that `CommonOutputJax` uses to generate the correct type of nodes.

let's look at a snippet of `CHTML` to provide some context:

```ts
export class CHTML<N, T, D> extends
CommonOutputJax<N, T, D, CHTMLWrapper<N, T, D>, CHTMLWrapperFactory<N, T, D>, CHTMLFontData, typeof CHTMLFontData> {
  /**
   * The name of this output jax
   */
  public static NAME: string = 'CHTML';

  // ...

  public factory: CHTMLWrapperFactory<N, T, D>;

  constructor(options: OptionList = null) {
    super(options, CHTMLWrapperFactory as any, TeXFont);
    this.font.adaptiveCSS(this.options.adaptiveCSS);
    this.wrapperUsage = new Usage<string>();
  }

  // ...

  /**
   * @param {MmlNode} math  The MML node whose HTML is to be produced
   * @param {N} parent      The HTML node to contain the HTML
   */
  protected processMath(math: MmlNode, parent: N) {
    this.factory.wrap(math).toCHTML(parent);
  }

  // ...
}
```

the point of interest here is `CHTMLWrapperFactory`, which produces the corresponding type of html node wrapper based on the received `MmlNode` via the `wrap` method, as showcased in the `processMath` method.

now, let's look at `CommonOutputJax`, the parent class of `CHTML`:

```ts
export abstract class CommonOutputJax<
	N, T, D,
	W extends AnyWrapper,
	F extends AnyWrapperFactory,
	FD extends FontData<any, any, any>,
	FC extends FontDataClass<any, any, any>
> extends AbstractOutputJax<N, T, D> {
  // ...

  /**
   * Save the math document
   * Create the mjx-container node
   * Create the DOM output for the root MathML math node in the container
   * Return the container node
   *
   * @override
   */
  public typeset(math: MathItem<N, T, D>, html: MathDocument<N, T, D>) {
    this.setDocument(html);
    let node = this.createNode();
    this.toDOM(math, node, html);
    return node;
  }

  /**
   * @return {N}  The container DOM node for the typeset math
   */
  protected createNode(): N {
    const jax = (this.constructor as typeof CommonOutputJax).NAME;
    return this.html('mjx-container', {'class': 'MathJax', jax: jax});
  }
 
  // ...

  /**
   * Save the math document, if any, and the math item
   * Set the document where HTML nodes will be created via the adaptor
   * Recursively set the TeX classes for the nodes
   * Set the scaling for the DOM node
   * Create the nodeMap (maps MathML nodes to corresponding wrappers)
   * Create the HTML output for the root MathML node in the container
   * Clear the nodeMape
   * Execute the post-filters
   *
   * @param {MathItem} math      The math item to convert
   * @param {N} node             The contaier to place the result into
   * @param {MathDocument} html  The document containing the math
   */
  public toDOM(math: MathItem<N, T, D>, node: N, html: MathDocument<N, T, D> = null) {
    this.setDocument(html);
    this.math = math;
    this.pxPerEm = math.metrics.ex / this.font.params.x_height;
    math.root.setTeXclass(null);
    this.setScale(node);
    this.nodeMap = new Map<MmlNode, W>();
    this.container = node;
    this.processMath(math.root, node);
    this.nodeMap = null;
    this.executeFilters(this.postFilters, math, html, node);
  }

  /**
   * This is the actual typesetting function supplied by the subclass
   *
   * @param {MmlNode} math   The intenral MathML node of the root math element to process
   * @param {N} node         The container node where the math is to be typeset
   */
  protected abstract processMath(math: MmlNode, node: N): void;
}
```

when the output pipeline is triggered, `CHTML.typeset` is called which in turn calls `CommonOutputJax.typeset`, triggering `toDOM` and then `processMath` as a result. Looking back at the implementation of `processMath` in `CHTML`, we now know that the `toCHTML` method of the node wrapper class is called.

as a reminder, `\unicode` is the point of attack which renders an `<mtext>`. The wrapper class for `<mtext>` is appropriately named `CHTMLmtext`, which extends `CHTMLWrapper` where `toCHTML` is defined:

```ts
export class CHTMLWrapper<N, T, D> extends
CommonWrapper<
  CHTML<N, T, D>,
  CHTMLWrapper<N, T, D>,
  CHTMLWrapperClass,
  CHTMLCharOptions,
  CHTMLDelimiterData,
  CHTMLFontData
> {
  /**
   * Create the HTML for the wrapped node.
   *
   * @param {N} parent  The HTML node where the output is added
   */
  public toCHTML(parent: N) {
    const chtml = this.standardCHTMLnode(parent);
    for (const child of this.childNodes) {
      child.toCHTML(chtml);
    }
  }

  /*******************************************************************/

  /**
   * Create the standard CHTML element for the given wrapped node.
   *
   * @param {N} parent  The HTML element in which the node is to be created
   * @returns {N}  The root of the HTML tree for the wrapped node's output
   */
  protected standardCHTMLnode(parent: N): N {
    this.markUsed();
    const chtml = this.createCHTMLnode(parent);
    this.handleStyles();
    // ...
    return chtml;
  }

  // ...

  protected handleStyles() {
    if (!this.styles) return;
    const styles = this.styles.cssText;
    if (styles) {
      this.adaptor.setAttribute(this.chtml, 'style', styles);
      // ...
    }
  }
}
```

through `toCHTML`, the html node is created for `<mtext>`. the `style` attribute of `<mtext>` is then set in `handleStyle`, by passing in `this.styles.cssText` which contains the style definition of the node converted to a raw css string. we are almost there!

to figure out where `this.styles` is coming from, let's look at the constructor of `CommonWrapper` which `CHTMLWrapper` extends:

```ts
// generics omitted for readability
export class CommonWrapper extends AbstractWrapper {
	// ...

  constructor(factory: CommonWrapperFactory, node: MmlNode, parent: W = null) {
    super(factory, node);
    // ...
    this.getVariant();
    // ...
  }

  // ... 

  protected getVariant() {
    if (!this.node.isToken) return;
    const attributes = this.node.attributes;
    let variant = attributes.get('mathvariant') as string;
    if (!attributes.getExplicit('mathvariant')) {
      const values = attributes.getList('fontfamily', 'fontweight', 'fontstyle') as StringMap;
      // ... 
      if (values.fontfamily) values.family = values.fontfamily;
      if (values.fontweight) values.weight = values.fontweight;
      if (values.fontstyle)  values.style  = values.fontstyle;
      // ...
      if (values.family) {
        variant = this.explicitVariant(values.family, values.weight, values.style);
      } else { /* ... */ }
    }
    this.variant = variant;
  }

  /**
   * Set the CSS for a token element having an explicit font (rather than regular mathvariant).
   *
   * @param {string} fontFamily  The font family to use
   * @param {string} fontWeight  The font weight to use
   * @param {string} fontStyle   The font style to use
   */
  protected explicitVariant(fontFamily: string, fontWeight: string, fontStyle: string) {
    let style = this.styles;
    if (!style) style = this.styles = new Styles();
    style.set('fontFamily', fontFamily);
    if (fontWeight) style.set('fontWeight', fontWeight);
    if (fontStyle)  style.set('fontStyle', fontStyle);
    return '-explicitFont';
  }

  // ...
}
```

now, we know that `this.styles` is set through a call, in `CommonWrapper`'s constructor, to `getVariant` and then `explicitVariant`. let's dissect the code line by line:

```ts
const values = attributes.getList('fontfamily', 'fontweight', 'fontstyle') as StringMap;
```

retrieves the values of the `'fontfamily'`, `'fontweight'`, and `'fontstyle'` attributes. then,

```ts
if (values.fontfamily) values.family = values.fontfamily;
if (values.fontweight) values.weight = values.fontweight;
if (values.fontstyle)  values.style  = values.fontstyle;
```

copies the retrieved values under a different attribute name (`family`, `weight`, and `style` respectively.) after that,

```ts
if (values.family) {
  variant = this.explicitVariant(values.family, values.weight, values.style);
} else { /* ... */ }
```

calls `explicitVariant` if the font family is set. finally,

```ts
// inside explicitVariant
if (!style) style = this.styles = new Styles();
style.set('fontFamily', fontFamily);
if (fontWeight) style.set('fontWeight', fontWeight);
if (fontStyle)  style.set('fontStyle', fontStyle);
```

the `Styles` object is created here which holds the font styles retrieved earlier. turns out, `this.styles` is an instance of `Styles`, which means `this.styles.cssText` is actually `Styles.cssText`:

```ts
export class Styles {
  // ...
  
  public get cssText(): string {
    const styles = [] as string[];
    for (const name of Object.keys(this.styles)) {
      const parent = this.parentName(name);
      if (!this.styles[parent]) {
        styles.push(name + ': ' + this.styles[name] + ';');
      }
    }
    return styles.join(' ');
  }

  public set(name: string, value: string | number | boolean) {
    name = this.normalizeName(name);
    this.setStyle(name, value as string);
    // ...
  }

  protected setStyle(name: string, value: string) {
    this.styles[name] = value;
    // ...
  }
}
```

the `set` method call done earlier in `explicitVariant` stores the value of font family under the `'font-family'` key - the key string `'fontFamily'` passed in earlier was converted to kebab-case by `this.normalizeName`:

```ts
// here, 'fontFamily' is converted to 'font-family' internally
// via this.normalizeName in the Styles class
style.set('fontFamily', fontFamily);
```

the internal styles object (`this.styles` in `Styles`) will now store:

```
{
  // "myfont" is an example value of the fontFamily variable passed in
  "font-family": "myfont"
}
```

we now also know that `this.styles.cssText` is calling a getter that converts the internal style object holding all the styles into a valid css string by following this algorithm:
1. for each entry in the style object, create a string in the format `${object-key}: ${object-value};`
2. push the string to an array
3. join every string in the array with a space character

since each entry in the style object represents a css style, `${object-key}` is actually any valid css style attribute, and `${object-value}` is the corresponding value for the style.

### the point of attack

**this algorithm has a fatal flaw!** to illustrate, let's consider the following code which uses `\unicode`:

```latex
\unicode[myfont; color: red; position: fixed;]{x0000}
```

let's go through the attack step by step:

1. the code that backs `\unicode` treats *anything* in between the square brackets as the name of the font family and extracts `'myfont; color: red; position: fixed;''` as the value for the font family.
2. the value is stored as an attribute of `MmlNode` under `fontfamily`.
3. `CHTML` goes through the tree of `MmlNode` and encounters this node
4. `toCHTML` is called on the node
5. `handleStyles`, and thus `this.styles.cssText` is called as a result
6. `cssText` produces `font-family: myfont; color: red; position: fixed;;` because it assumes the `font-family` value only stores valid font family names
7. the produced string is set as the value of the `style` attribute of the `<mtext>` node via `setAttribute`
8. css successfully injected!

## mitigation

it is interesting that mathjax chose to programmatically construct a css string, while the dom api already provides an easy way to style an element programmatically! for example, to set the font family of an element, u can set the `fontFamily` property directly through the `style` object of the element:

```ts
document.getElementById('my-elem').style.fontFamily = "open-sans";
```

this completely mitigates the css injection attack. if u tried to do something like:

```ts
document.getElementById('my-elem').style.fontFamily =
  "open-sans; color: red;";
```

the browser will ignore it entirely because it is not a valid value for `fontFamily`.

## conclusion

this incident is a reminder to everyone: **always sanitize user inputs** before using them in any meaningful way! [dompurify](https://github.com/cure53/DOMPurify) is a well-established sanitization library that sanitizes html, mathml and svg. in the case of sql, always use library-provided mechanism to insert variables into sql strings.

---

*big thanks to [@vmfunc](https://x.com/vmfunc) for helping me proofread this article! (technically, not grammatically, so any grammar or typo mistake is on me)*
