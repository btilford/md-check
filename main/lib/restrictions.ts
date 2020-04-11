import {ConfigurationOptions} from './configure';
import {FileContext} from './context';
import {Providers, Log} from '@btilford/ts-base';


export type Restrictions = {
  allowSudo: boolean | 'warn';
  [k: string]: boolean | 'warn';
}


export interface RestrictionCheck {(text: string): string | undefined}


export type RestrictionChecks = Record<string, RestrictionCheck[]>;

export const RESTRICTION_CHECKS: RestrictionChecks = {
  allowSudo: [
    (text: string) => text.match(/sudo/gm) ? 'Use of sudo is not allowed' : undefined,
  ],
}


class RestrictionError extends Error {
  constructor(message: string) {
    super(message);
  }
}


export class RestrictionErrors extends Error {
  constructor(text: string, ctx: FileContext, errors: RestrictionError[]) {
    super(`Failed ${errors.length} restrictions in file ${ctx.file}!`);
  }
}


let enabledRules: RestrictionChecks;


function getRules(restrictions: Restrictions): [string, RestrictionCheck[]] {
  if (!enabledRules) {
    const rules = {};
    for (const [name, enabled] of Object.entries(restrictions)) {
      if (enabled) {
        rules[name] = RESTRICTION_CHECKS[name];
      }
    }
    enabledRules = rules;
  }
  return Object.keys(enabledRules) as [string, RestrictionCheck[]];
}


let log: Log;


export function checkRestrictions(text: string, ctx: FileContext, configuration: ConfigurationOptions): void {
  if (!log) {
    log = Providers.provide(Log).extend('checkRestrictions()');
  }
  const restrictions = configuration.restrictions;
  const rules: [string, RestrictionCheck[]] = getRules(restrictions);
  const errors: RestrictionError[] = [];
  rules.forEach(entry => {
    const name = entry[0] as string;
    const checks: RestrictionCheck[] = entry[1] as unknown as RestrictionCheck[];

    const violations = checks.map(check => {
      const msg = check(text);
      let result: string | undefined;
      if (msg) {
        const detail = `Failed restriction ${name} in file ${ctx.file}! ${msg}`;
        if (restrictions[name] === 'warn') {
          log.warn(detail);
        }
        else {
          result = detail;
        }
      }
      return result;
    }).filter(msg => msg).map((msg: string) => new RestrictionError(msg));
    errors.push(...violations);
  });
  if (errors.length > 0) {
    throw new RestrictionErrors(text, ctx, errors);
  }
}
