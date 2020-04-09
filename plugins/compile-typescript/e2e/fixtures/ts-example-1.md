---
title: Example 1 Title
description: Some description
---


### Log something to console.

```typescript node

class Something {
    log(msg:string, ...args:unknown[]): void {
        console.log(msg, ...args);
    }
}

const log:Something = new Something();
log.log('typescript ok');

```

