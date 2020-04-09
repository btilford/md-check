import {exec} from 'child_process';
import Token from 'markdown-it/lib/token';
import {Configuration} from '../configure';
import {FenceContext} from '../fence';


export type ExecutorOptions = Configuration & {};
export type ExecutionContext = FenceContext & {};
export type ExecutionResult = ExecutionContext & {
  readonly execution: {
    readonly stdout?: string;
    readonly stderr?: string;
    readonly errors?: Error[];
    readonly tokens?: Token[];
  };
}


export abstract class Executor {
  constructor(readonly options: ExecutorOptions) {}


  abstract accept(fence: string): boolean;


  abstract execute(ctx: ExecutionContext): Promise<ExecutionResult>;

}


export type ForkOptions = ExecutorOptions & {
  readonly matchFence: RegExp;
  readonly args?: string[];
  readonly cmd: string;
}


export class ForkExecutor extends Executor {

  constructor(options: ForkOptions) {
    super(options);
  }


  execute(ctx: ExecutionContext): Promise<ExecutionResult> {
    const options: ForkOptions = this.options as ForkOptions;

    return new Promise<ExecutionResult>((resolve, reject) => {
      const args = options.args || [];
      const cmd = [options.cmd, ctx.file, ...args].join(' ');
      exec(cmd, (err, stdout, stderr) => {
        let skip = false;
        let result: ExecutionResult = {
          ...ctx,
          execution: { stderr, stdout },
        };
        if (err) {
          if (options.failOnerror) {
            skip = true;
            reject(err);
          }
          else {
            result = {
              ...ctx,
              execution: {
                errors: [err],
                stderr,
                stdout,
              },
            };
          }
        }
        if (!skip) {

          resolve(result);
        }
      });
    });
  }


  accept(fence: string): boolean {
    const opts = this.options as ForkOptions;
    return opts.matchFence.test(fence);
  }


  static create(options: Configuration, matchFence: RegExp, cmd: string, ...args: string[]): Executor {
    const opt: ForkOptions = {
      ...options,
      matchFence,
      cmd,
      args,
    };
    return new ForkExecutor(opt);
  }

}
