import {Filter, Env, Providers} from '@btilford/ts-base';


export const NOT_IN_CI: Filter = {
  include(): boolean {
    return Providers.provide(Env).getProp('CI') !== 'true';
  }
};
