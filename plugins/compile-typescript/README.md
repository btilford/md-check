---
title: Typescript Examples
description: Compile and execute typescript code blocks.
fences:
    - title: Basic
    - title: Configuration
---

### Installation

```console
npm install --save-dev @btilford/md-check-compile-typescript
```

### Setup the Typescript compiler

```typescript node
import {TsCompiler} from '@btilford/md-check-compile-typescript';

TsCompiler.supply(); // default configs, uses ${process.cwd()}/tsconfig.json
TsCompiler.supply('tsconfig.json'); // Provide a path to you tsconfig
TsCompiler.supply({/* compiler options */}); // Provide a configuration object
```

### As a Node.js script

```typescript node
import {ConsoleLog} from '@btilford/ts-base';

const log: Log = ConsoleLog.create('example');
log.info('Hello');
```

