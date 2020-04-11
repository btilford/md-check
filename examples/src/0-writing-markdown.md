---
title: Writing Markdown.
description: How to write the markdown for md-check to work.
fences:
    - title: Executing Code Blocks
      description: Trigger execution of fences
    - title: Configuring metadata
      description: Set metadata for nicer output
---


### Making code blocks executable

Executors get passed the fence and can either accept it or skip it.
The node vm executor will split the fence's name and check if the last
item in the array is **node** or **node-vm**.


<pre class="md-check__code-block language-markdown" fence="true">
<code>
<span class="hljs-tag">```</span><span class="hljs-keyword">javascript node</span>
console.log('This would be executed by the node vm executor');
<span class="hljs-tag">```</span>
</code>
<code>
<span class="hljs-tag">```</span><span class="hljs-keyword">javascript node-vm</span>
console.log('This would be executed by the node vm executor');
<span class="hljs-tag">```</span>
</code>
<code>
<span class="hljs-tag">```</span><span class="hljs-keyword">javascript js</span>
console.warn('This would NOT be executed by the node vm executor');
<span class="hljs-tag">```</span>
</code>
</pre>


### File metadata

Metadata is YAML parsed out of the header block of the file. The currently support
entries are.

```yaml
title: Title for the file # Used to generate header and link text
description: Added to link.title 
fences:
    - title: Title for code block 0 # Used on links to specific code blocks
      description: Added to link.title
```  
