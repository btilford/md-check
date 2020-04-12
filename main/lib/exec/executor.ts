import {Log, Providers} from '@btilford/ts-base';
import {Compiled} from '../compiler';
import {ConfigurationOptions} from '../configure';
import {FenceContext} from '../fence';


export class ExecutionError extends Error {

  constructor(message: string, readonly cause?: Error) {
    super(message);
  }
}


export type Output = {
  stdout?: string;
  stderr?: string;
}


export type ExecutorOptions = ConfigurationOptions & {
  [name: string]: any;
};

export type ExecutionContext = FenceContext & {
  compiled?: Compiled;
};

export type Execution = Output & {
  readonly alias: string;
  // readonly tokens?: Token[];
  errors?: Error[];
  returnValue?: any;
  [k: string]: any;
};
export type ExecutionResult = ExecutionContext & {
  readonly execution: Execution;
}


export abstract class Executor {
  protected readonly log: Log;


  constructor(readonly options: ExecutorOptions) {
    this.log = Providers.provide(Log).extend(this.constructor.name);
  }


  abstract accept(fence: FenceContext): boolean;


  abstract execute(ctx: ExecutionContext): Promise<ExecutionResult>;

}


export type ForkOptions = ExecutorOptions & {
  readonly matchFence: RegExp;
  readonly args?: string[];
  readonly cmd: string;
  readonly env: Record<string, string>;
}



