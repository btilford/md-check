import frontmatter from 'frontmatter';
import Token from 'markdown-it/lib/token';
import {FileContext} from '../context';
import {Md} from '../md';
import {makeId, stripMarkdownHeader} from '../text';

import {Log, Providers} from '@btilford/ts-base';


export type ParseContext = FileContext & {
  readonly markdown: string;
}


export type ParseResult = ParseContext & {
  readonly parsed: {
    readonly tokens: Token[];
    readonly header: Record<string, any>;
    readonly id: string;
    [name: string]: any;
  };
}


export class Parser {
  protected readonly log: Log;


  constructor(readonly md: Md) {
    this.log = Providers.provide(Log).extend(this.constructor.name);
  }


  async parse(ctx: ParseContext): Promise<ParseResult> {
    this.log.debug('Parsing file %s', ctx.file);
    const header = frontmatter(ctx.markdown);
    const markdown = stripMarkdownHeader(ctx.markdown);

    const tokens = this.md.parse(markdown, {});

    this.log.debug('Parsed %d tokens from file %s', tokens.length, ctx.file);
    return {
      ...ctx,
      parsed: {
        tokens,
        header: header?.data || {},
        id: makeId('file', ctx.file),
      },
    }
  }

}
