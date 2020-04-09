import anchor from 'markdown-it-anchor';
import Token from 'markdown-it/lib/token';
import {MarkdownItPlugin, Options} from './options';

import hlt from 'highlight.js';
import MarkdownIt from 'markdown-it';


const defaultMarkownItOptions: MarkdownIt.Options = {
  html: true,
  linkify: true,
  typographer: true,
  langPrefix: 'md-check__code-block language-',
  highlight: (str, lang) => {
    let result;
    if (lang && hlt.getLanguage(lang)) {
      try {
        result = hlt.highlight(lang, str);
      }
      catch (error) {
        console.error('Error highlighting');
      }
    }
    else {
      result = hlt.highlightAuto(str);
    }
    return result ? result.value : '';
  },
};
const defaultPlugins: MarkdownItPlugin[] = [
  { plugin: anchor, params: [{ permalink: true }] },
];


export class Md {
  readonly md: MarkdownIt;
  readonly mdOptions: MarkdownIt.Options;


  constructor(readonly options?: Options) {
    const mdOpts: MarkdownIt.Options = options?.markdownIt?.options || defaultMarkownItOptions;
    this.mdOptions = mdOpts;

    let md = new MarkdownIt(mdOpts);
    if (options?.markdownIt?.use !== false) {
      md = (options?.markdownIt?.use || defaultPlugins)
        .reduce((_md, plugin) => _md.use(plugin.plugin, ...plugin.params), md);
    }
    this.md = md;
  }


  parse(src: string, env?: unknown): Token[] {
    return this.md.parse(src, env);
  }


  render(tokens: Token[], env?: unknown): string {
    return this.md.renderer.render(tokens, this.mdOptions, env);
  }

}
