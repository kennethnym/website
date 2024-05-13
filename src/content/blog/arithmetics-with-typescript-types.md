---
title: arithmetics with typescript types
description: how to implement addition, subtraction, and multiplication with only typescript types
pubDate: May 13 2024
---

typescript has a powerful type system. it is so powerful, in fact, that [it is turing-complete](https://github.com/microsoft/TypeScript/issues/14833). inspired by this, i decided, instead of studying for the exam tomorrow, i wanted to try to implement basic number arithmetics, i.e. addition, subtraction, and multiplication, using only typescript type syntax instead.

## how will this work?

the idea is to implement addition, subtraction, and multiplication as three distinct types. Each type will take in two generic parameters as the inputs, and the inferred type will be the output of the operation. let's list out how each operation looks like in typescript types:

- addition: `Add<A, B>`
- subtraction: `Sub<A, B>`
- multiplication: `Multiply<A, B>`

where `A` and `B` are two arbitrary numbers represented in the typescript type system. to keep things simple, `A` and `B` shall be whole numbers for now. to perform an operation and obtains its result, we create a new type that is the result of running inference on the operation type:

```ts
type Result = Add<A, B>
```

where `Result` stores the result of `A + B` as a type.

## representing numbers

the first problem we run into is representing numbers as types. to this end, you may be tempted to use number literals directly, like so:

```ts
type _1 = 1
type _2 = 2
// etc
```

the problem with this is two-fold. arithmetic operators, such as `+` or `*`, are not allowed in typescript types, so it is not very helpful. plus, each number literal is its own distinct type. this can be easily verified using the `extend` keyword:

```ts
// OneExtendsTwo is false
type OneExtendsTwo = 1 extends 2 ? true : false
// TwoExtendsOne is also false
type TwoExtendsOne = 2 extends 1 ? true : false
```

here, we verified that neither `1` or `2` are supertypes of the other, which implies that `1` and `2` are two distinct, non-overlapping types. this property means that it is impossible to express the _relations_ between numbers using number literals, and we will see why this is important later on.

### peano numbers

one way of expressing natural numbers without using number literals is utilizing [Peano numbers](https://wiki.haskell.org/Peano_numbers). This allows us to express natural numbers using a zero value `Zero` and a successor function `Succ`. For example, 1 can be written as `Succ(Zero)`, and 2 can be written as `Succ(1)` which is just `Succ(Succ(Zero))`.

now, all we need to do is to express peano numbers in typescript. we can define the zero value and the successor function as two distinct types:

```ts
type _0 = { zero: true }
```

the successor function takes the previous number as its input. this can be done using a generic parameter:

```ts
type Succ<N> = { prev: N, zero: false }
```

here, we are defining the successor of `N` in terms of `N`, using the fact that the predecessor of the successor of `N` is `N` itself. to group the numbers into a parent type, let's define a new type `Num` that represents any natural number:

```ts
type Num = { prev?: Num, zero: boolean }
```

using `Num`, we can limit the input of `Succ` to only accept `Num`:

```ts
type Succ<N extends Num> = { prev: N, zero: false }
```

let's also define a predecessor function that returns the predecessor of a `Num`, which will be proven useful later:

```ts
type Pred<N extends Num> = N["prev"] extends Num ? N["prev"] : _0
```

we first check if the `prev` property exists. if it does, we can return it. otherwise, we know it is the zero type because `prev` is undefined for zero.

using `_0` and `Succ<N>`, we can now define any natural number in the type system:

```ts
type Num = { prev?: Num, zero: boolean }
type Succ<N extends Num> = { prev: N, zero: false }
type Pred<N extends Num> =
  N["prev"] extends Num ? N["prev"] : _0

type _0 = { zero: true }
type _1 = Succ<_0>
type _2 = Succ<_1>
type _3 = Succ<_2>
type _4 = Succ<_3>
type _5 = Succ<_4>
type _6 = Succ<_5>
type _7 = Succ<_6>
type _8 = Succ<_7>
type _9 = Succ<_8>
type _10 = Succ<_9>
```

## implementing addition

we can split the addition operation `Add<A, B>` into two cases: if `A` is `_0`, `Add<A, B>` is simply `B`; otherwise, using the fact that the successor of the predecessor of `A` is `A` itself, we can express `A + B` in terms of the predecessor of `A`. by recursively reducing `A` to the zero case, we can express the result of `A + B` as `B` succeeded `A` times. For example, `2 + 2` is `2` succeded `2` times. To visualize the process better, let's write down the process step by step. To the right of each step is the equivalent operation expressed in normal numbers and math operators that we are used to.

```
                          Example (1)
---------------------------------------------------------------
  2 + 2
= Succ(Pred(2) + 2)                 ((2 - 1) + 2) + 1
= Succ(1 + 2)                       (1 + 2) + 1
= Succ(Succ(Pred(1) + 2))           (((1 - 1) + 2) + 1) + 1
= Succ(Succ(0 + 2)) <---- base case ((0 + 2) + 1) + 1
= Succ(Succ(2))                     2 + 1 + 1
```

if we apply the 2 successions on 2, we get 4. we have successfully calculated 2 + 2!

let's first implement the base case in typescript:

```ts
type Add<A extends Num, B extends Num> =
  A extends _0 ? B : ...
```

here, we are returning `B` if `A` is `_0`. very straightforward. now, onto the second case. using `Pred<N>`, we can recursively reduce `A` to the base case:

```ts
type Add<A extends Num, B extends Num> = 
  A extends _0
    ? B                     // base case
    : Succ<Add<Pred<A>, B>> // inductive case
```

action speaks louder than word, so let's put example (1) to the test:

```
  Add<_2, _2>
= Succ< Add<Pred<_2>, _2> >
= Succ< Add<_1, _2> >
= Succ< Succ< Add<Pred<_1>, _2> > >
= Succ< Succ< Add<_0, _2> > >   <------ base case
= Succ<Succ<_2>>
```

to use `Add<A, B>` and obtain its result, we can assign it to a new type:

```ts
type Result = Add<_2, _2>
type Result2 = Add<_1, _3>
```

## implementing subtraction

we can tackle subtraction in a similar vein as addition. the base case for subtraction is when `B` is `_0`, in which case `Sub<A, B>` will evaluate to `A`. in the other case, we can recursively reduce `B` to the base case (i.e. until `B` is `_0`) and apply `Pred` for each recursion. here is an example:

```
                          Example (2)
---------------------------------------------------------------
  2 - 2
= Pred(2 - Pred(2))                  (2 - (2 - 1)) - 1
= Pred(2 - 1)                        (2 - 1) - 1
= Pred(Pred(2 - Pred(1)))            ((2 - (1 - 1)) - 1) - 1
= Pred(Pred(2 - 0))  <---- base case ((2 - 0) - 1) - 1
= Pred(Pred(2))                      2 - 1 - 1
```

let's write this out in typescript types:

```ts
type Sub<A extends num, B extends Num> =
  B extends _0
    ? A                     // base case
    : Pred<Sub<A, Pred<B>>> // inductive case
```

applying example (2), we get:

```
  Sub<_2, _2>
= Pred< Sub<_2, Pred<_2> >
= Pred< Sub<_2, _1> >
= Pred< Pred< Sub<_2, Pred<_1>> > >
= Pred< Pred< Sub<_2, 0 > > >
= Pred<Pred<_2>>
```

when we apply Pred 2 times on 2, we get 0!

## implementing multiplication

just like subtraction, the base case for multiplication is when `B` is `_0`, in which case `Multiply<A, B>` evaluates to `_0`. for the inductive case, we can apply the same recursive trick to `B`, considering the fact that `A` multiplied by `B` is just `A` added `B` times.

```
  2 * 2
= 2 + (2 * Pred(2))                  2 + (2 * (2 - 1))
= 2 + (2 * 1)                        2 + (2 * 1)
= 2 + (2 + (2 * Pred(1)))            2 + (2 + (2 * (1 - 1)))
= 2 + (2 + (2 * 0))                  2 + (2 + (2 * 0))
= 2 + (2 + 0)  <---------- base case 2 + (2 + 0)
= 2 + 2
```

using example (1), we know for a fact that 2 + 2 is 4, so we have also successfully calculated 2 * 2!

writing this in typescript, we get:

```ts
type Multiply<A extends Num, B extends Num> =
  B extends _0
    ? _0                           // base case
    : Add<A, Multiply<A, Pred<B>>> // inductive case
```

## fibonacci sequence

using all the primitives we have built, we can now express the fibonacci sequence with only typescript types.
recall that

```
fib(n) = fib(n - 1) + fib(n - 2)
```

where `n` is the position in the fibonacci sequence. to express this in typescript types, we can write down the first two numbers explicitly, and let recursion do the rest:

```ts
type Fib<N extends Num> =
  N extends _0     // N = 0?
    ? N            // yes, return 0
    : N extends _1 // N = 1?
      ? N          // yes, return 1
      // inductive case
      : Add<Fib<Pred<N>>, Fib<Sub<N, _2>>>
```

## limitations

unfortunately, this does not work with large numbers. the limit seems to be around 50, which is when typescript starts to complain about excessively deep type instantiations. if anyone knows how to disable the limit, or if there is a way to workaround the recursion limit, do let me know!

## links

- [link to typescript playground](https://www.typescriptlang.org/play/?#code/C4TwDgpgBAcgrgWygXigbymAThAbgfgC5ZEAaKALwiwHtiAjGmgGwgEMA7KAXwChRIUAMpwAxqIA8MKBAAewCBwAmAZxIIAfCnSYcuYjHJVaxAGZtmK6HwHQACjiVSZ8xavVbUMANoAibHi+ALouCspq8Ej4sH4BuMFQxAD6AAy8-ODQqdoYxnRQwFhw1hmCSQCM2iLiEqkapVkATFVikhX1tlBJAMwtNUmNHZldACx9bd1DZQCs47UjU1kAbHNJ04tdAOyrSxtJAByrm3sAnKv7e+Upqyf1DVAAgkpOD6FuEWRQAEJv4R7arzkYXc2WiP2I1UkTycDggLw05C+Gg2InoEkBrj+kURv3ckU831xalBj0SUFhTlR6PIFIkSOR9wAsnBmMAAJZgZggdFE9Q4oHvf6oH4Cv4k7LEaHUqDM1kcrnS2n0u6dACiAEceaK8Z8RZidZoAbyfmDea9ooVimTzJZoGYLFZ7gAZCBa-UfBD891C4RwNEPRFabXE67RG1WMmWiDpToAMTZaOkwaFvCgsF5qVTaag0RgWbTBgz5Xz2dzJYLj2eEnjaNpMGR5BrEiphi6gwZQA)
- [link to github](https://github.com/kennethnym/ts-types-arithmetics)

