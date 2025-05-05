---
title: autocomplete considered harmful
description: my experience of no autocompletion in editors
pubDate: May 5 2025
---

# autocomplete considered harmful

it is taken for granted that an editor provides autocompletion, even at a basic level. with a few exceptions, modern editors have autocompletion configured and enabled out of the box. because it is a default experience for editors, few has ever questioned whether it is an ideal coding environment for a developer. i used to take autocompletion for granted, and never even considered the possibility of turning it off. that changed 2 weeks ago, and having written code without it for an extended period, i think it provides a more pleasant coding experience, and i think more developers should give it a try.

## micro-stutters

autocompletion popup causes micro-stutters. when you try to complete on every keystroke, you have to stop and check that the entry selected is what you want, and then either select it, or find the entry that you want. when it is turned off, code can flow naturally from my mind to the computer without interruption. that "stop-and-check" may be minor, but it compounds when it occurs on every keystroke. removing that mental barrier has turned out to be crucial in helping me maintain my flow, making my coding experience far more enjoyable as a result.

## better code consolidation

having to type out all your code manually also helped me dramatically in consolidating the codebase in my head. instead of relying on autocompletion to index my codebase, i have to do that myself, especially for things that i access regularly so that i can type their names out correctly. this index has proven to provide a more solid mental model of my codebase, thus improving my understanding of it. this index also makes navigating around the codebase a lot more fluid, which, again, helps maintain my flow.

## a good middle ground

instead of turning autocompletion in my editors altogether, i chose to have the popup visible on demand (ctrl + space in my case.) this way, if there is a "cache miss" when accessing my mental index of the codebase, i can still lookup what is available, and update my index accordingly.

## let me know your experience!

i would love to hear from my fellow software developers about their experience of turning off autocompletion in their code editor of choice. feel free to dm me on [x dot com](https://x.com/kennethnym) or [email me](mailto:kennethnym@hey.com) about your thoughts on this!