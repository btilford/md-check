document.querySelectorAll('pre .usage__code-block, pre.usage__code-block').forEach(node => {
  const parent = node.parentElement;
  if (!parent.parentElement.classList.contains('example__output')) {
    console.debug('Adding copy for %o to %o', node, parent);
    const button = document.createElement('button');
    button.textContent = 'copy';

    button.classList.add('code-block__btn', 'code-block__btn--copy');

    button.onclick = () => {
      navigator.permissions.query({ name: 'clipboard-write' }).then(result => {
        if (result.state == 'granted' || result.state == 'prompt') {
          const code = node.innerText;
          navigator.clipboard.writeText(code).then(() => {
            console.log('copied');
          }).catch(err => {
            console.error('Unable to copy', err);
          })
        }
      });
    };

    parent.insertAdjacentElement('beforebegin', button);
  }

});
