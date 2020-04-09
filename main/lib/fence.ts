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
  let offset = 0;
  ctx.inserts.filter(item => item.insert).forEach(item => {
    const fence = item.fence;
    const at = (offset + 1 + fence.index);
    const len = item.insert?.length || 0;
    if (item.insert && len > 0) {
      copy.splice(at, 0, ...item.insert);
      offset = (at + len + 1);
    }

  });
  return copy;
}
