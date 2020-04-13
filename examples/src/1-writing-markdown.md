---
title: Writing Markdown.
description: How to write the markdown for md-check to work.
fences:
    - title: Configuring metadata
      description: Set metadata for nicer output
      env:
        - NODE_ENV: docs
---


### Making code blocks executable

Executors get passed the fence and can either accept it or skip it.
The node vm executor will split the fence's name and check if the last
item in the array is **node** or **node-vm**.


    ```javascript node
    console.log('This would be executed by the node vm executor');
    ```
    
    
    ```javascript node-vm
    console.log('This would be executed by the node vm executor');
    ```
    
    
    ```javascript js
    console.warn('This would NOT be executed by the node vm executor');
    ```


### File metadata

Metadata is YAML parsed out of the header block of the file. The currently support
entries are.

```yaml
title: Title for the file # Used to generate header and link text
description: Added to link.title 
env: # Provide env parameters for the file
    - NODE_ENV: test
fences:
    - title: Title for code block 0 # Used on links to specific code blocks
      description: Added to link.title
      env: # Provide env parameters specific for this block
        - NODE_ENV: production
```  
