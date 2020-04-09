import Token from 'markdown-it/lib/token';
import {CompileResult} from './compile';
import {ParseContext, ParseResult} from './parser';
import {makeId} from './text';


export type FenceContext = ParseContext & {
  readonly fence: {
    readonly name: string;
    readonly code: string;
    readonly token: Token;
    readonly index: number;
    readonly id: string;
  };
}


export function fences(ctx: ParseResult): FenceContext[] {
  const result: FenceContext[] = [];
  const tokens = ctx.parsed.tokens;
  const len = tokens.length;

  for (let tdx = 0; tdx < len; tdx++) {
    const token = tokens[tdx];
    if (token.type === 'fence' && token.tag === 'code') {
      const fence: FenceContext = {
        ...ctx,
        fence: {
          name: token.info,
          code: token.content,
          index: tdx,
          token,
          id: makeId('code', ctx.file, tdx.toString(10)),
        },
      };
      result.push(fence);
    }
  }
  console.debug('Found %d fences in %s', result.length, ctx.file);
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
  const copy = [...ctx.parsed.tokens];
  const inserts = ctx.inserts.filter(item => item.insert && item.insert.length > 0);

  let offset = 0;
  const insertLen = inserts.reduce(
    (num, next) => num + (next.insert
                          ? next.insert.length
                          : 0),
    0,
  );
  const expectNewLen = copy.length + insertLen;

  inserts.forEach(item => {
    const fence = item.fence;
    const at = (offset + fence.index + 1);
    const len = item.insert?.length || 0;
    const oldLen = copy.length;
    if (item.insert && len > 0) {
      copy.splice(at, 0, ...item.insert);
      offset = (at + len + 1);
      console.log(
        '%s #%d: inserting %d at %d -> new offset %d : old len=%d new len=%d',
        item.file,
        item.fence.index,
        len,
        at,
        oldLen,
        copy.length,
      );
    }

  });
  console.debug('Inserted %d tokens for %s', copy.length - ctx.parsed.tokens.length, ctx.file);
  console.assert(
    expectNewLen === copy.length,
    `Expected to have inserted ${insertLen} off by ${expectNewLen - copy.length}!`,
  );

  return copy;
}
