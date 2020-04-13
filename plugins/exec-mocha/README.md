---
title: Run Mocha
description: Execute code blocks containing mocha tests
fences:
    - title: Example Test
    - title: Install
    - title: Configure
      description: Configuring the mocha executor
---


### Configure the MochaExecutor

**Installation**

```console
npm install --save-dev @btilford/md-check
npm install --save-dev @btilford/md-check-exec-mocha
```

**Configuration**

```javascript node
const {MochaExecutor} = require('@btilford/md-check-exec-mocha');

MochaExecutor.supply(); // use the defaults
MochaExecutor.supply(
    {ui: 'bdd'}, // Pass in Mocha.MochaOptions object (a custom reporter will be used unless you provide one)
    false // Don't fail on test failure. (default is true)
);

```


### Running Mocha Tests

```typescript mocha
import {expect} from 'chai';

describe('My test', function() {
    it('Runs this test', function() {
        expect(true).to.eq(true);
        console.log('In test');
    });
});
```
