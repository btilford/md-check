import {ConsoleLog, CountInvocations, Log, Providers, TimedAsync} from '@btilford/ts-base';
import frontmatter from 'frontmatter';
import Token from 'markdown-it/lib/token';
import {FileContext} from '../context';
import {Md} from '../md';
import {makeId, stripMarkdownHeader} from '../text';


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
    this.log = Providers.provide(Log, () => ConsoleLog.create({ name: this.constructor.name }))
                        .extend(this.constructor.name);
  }


  @CountInvocations()
  @TimedAsync()
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
