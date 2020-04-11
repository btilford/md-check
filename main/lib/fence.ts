import Token from 'markdown-it/lib/token';
import {CompileResult} from './compiler';
import {ParseContext, ParseResult} from './parser';
import {makeId} from './text';
import {Log, Providers} from '@btilford/ts-base';


let _log: Log;


function log(): Log {
  if (!_log) {
    _log = Providers.provide(Log).extend('Fence');
  }
  return _log;
}


export type FenceContext = ParseContext & {
  readonly fence: {
    readonly name: string;
    readonly code: string;
    readonly token: Token;
    readonly index: number;
    readonly id: string;
    readonly config: {
      title: string;
      description?: string;
      [k: string]: any;
    };
  };
}


export function fences(ctx: ParseResult): FenceContext[] {
  log().debug('Processing fences for %s', ctx.file);
  const result: FenceContext[] = [];
  const tokens = ctx.parsed.tokens;
  const len = tokens.length;

  const fenceConfig = ctx.parsed.header.fences;


  for (let tdx = 0; tdx < len; tdx++) {
    const token = tokens[tdx];
    if (token.type === 'fence' && token.tag === 'code') {
      let config = {
        title: `${token.info} #${result.length + 1}`,
        description: `Code block #${result.length}`,
      };
      if (fenceConfig && result.length <= fenceConfig.length) {
        config = {
          ...config,
          ...fenceConfig[result.length],
        };
      }

      const fence: FenceContext = {
        ...ctx,
        fence: {
          name: token.info,
          code: token.content,
          index: tdx,
          token,
          id: makeId('code', ctx.file, tdx.toString(10)),
          config,
        },
      };
      result.push(fence);
    }
  }
  log().debug('Found %d fences in %s', result.length, ctx.file);
  return result;
}


export type FenceResult = FenceContext & {
  readonly insert?: Token[];
  readonly compiled?: CompileResult[];
}
export type InsertFences = ParseResult & {
  readonly inserts: FenceResult[];
}


export function insertFences(ctx: InsertFences): Token[] {
  log().debug('Inserting fences for %s', ctx.file);
  const copy = [...ctx.parsed.tokens];
  const inserts = ctx.inserts.filter(item => item.insert && item.insert.length > 0);


  inserts.forEach(item => {
    const fence = item.fence;
    const len = item.insert?.length || 0;


    const mark = copy.indexOf(fence.token);
    const codeBlock = copy[mark];
    codeBlock.attrSet('id', fence.id);
    const at = (mark + 1);

    if (item.insert && len > 0) {
      copy.splice(at, 0, ...item.insert);
      log().info(
        '%s #%d: inserting %d at %d',
        item.file,
        fence.index,
        len,
        at,
      );
    }

  });
  log().debug('Inserted %d tokens for %s', copy.length - ctx.parsed.tokens.length, ctx.file);

  return copy;
}
