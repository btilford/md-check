import frontmatter from 'frontmatter';
import Token from 'markdown-it/lib/token';
import {FileContext} from './context';
import {Md} from './md';
import {makeId, stripMarkdownHeader} from './text';


export type ParseContext = FileContext & {
  readonly markdown: string;
}


export type ParseResult = ParseContext & {
  readonly parsed: {
    readonly tokens: Token[];
    readonly header: Record<string, string>;
    readonly id: string;
    [name: string]: any;
  };
}


export class Parser {
  constructor(readonly md: Md) {

  }


  async parse(ctx: ParseContext): Promise<ParseResult> {

    const header = frontmatter(ctx.markdown);
    const markdown = header ? stripMarkdownHeader(ctx.markdown) : ctx.markdown;
    const tokens = this.md.parse(markdown, {});
    const fenceToken = tokens.find(token => token.type === 'fence' && token.tag === 'code');
    const fence = fenceToken?.info;

    return {
      ...ctx,
      parsed: {
        fence,
        tokens,
        header: header?.data || {},
        id: makeId('file', ctx.file),
      },
    }
  }

}
