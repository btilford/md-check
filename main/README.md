![Rush CI](https://github.com/btilford/md-check/workflows/Rush%20CI/badge.svg?branch=master)

# md-check
*Compile and execute your markdown documentation.*

**Why?** 

1. Your docs have drifted out of sync with your codebase.
2. Your docs are incomplete or wrong and won't compile.
3. Your users will thank you.

**What?**

Essentially this is like and borrows a lot from storybook and MDX. But isn't 
focused on UI components.

1. Extract fences from your markdown.
2. Compile individual blocks if necessary.
3. Execute each block and optionally capture output.

This verifies that

1. Your code at the very least is valid.
2. Your code is complete including imports because each block compiles and executes by 
itself. _No more crawling the web for what was actually imported for that random snippet
that was missing pieces._
3. You code executes without an error. You could even execute tests in you code block. Part
of the inspiration for this was Mocha's [doc](https://mochajs.org/#doc) and 
[markdown](https://mochajs.org/#markdown) reporters. 
 

## Install

```console 
# Run node and other commands
npm install --save-dev @btilford/md-check

# To compile typescript code blocks
npm install --save-dev @btilford/md-check-compile-typescript
```

## Getting Started

The documentation [here](https://btilford.github.io/md-check//examples.html) was generated
from the markdown in [examples/src](examples/src) by the [md-check.js](examples/md-check.js) script . 

**Configure md-check**

```javascript
const {mdCheck, NodeVmExecutor} = require('@btilford/md-check');

const run = mdCheck({
    include: {
        patterns: [
            'docs/**/*.{md,mdx}'
        ]
    },
    executors: [
        [NodeVmExecutor.supply()]
    ]
});
// Calling run() will trigger execution.
```

## Development

If you don't have [rush](https://rushjs.io/) installed you'll need to get that.

```console
npm install -g @microsoft/rush
```

Clone and initialize 

```console
git clone git@github.com:btilford/md-check.git
rush install
```

Building

```console
rush build
```
