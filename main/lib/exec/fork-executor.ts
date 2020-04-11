import {exec} from 'child_process';

import {ConfigurationOptions} from '../configure';
import {FenceContext} from '../fence';
import {ConfigurationSupplier} from '../options';
import {checkRestrictions} from '../restrictions';
import {UTF8} from '../text';
import {ExecutionContext, ExecutionResult, Executor, ForkOptions} from './executor';


export class ForkExecutor extends Executor {

  constructor(options: ForkOptions) {
    super(options);
  }


  execute(ctx: ExecutionContext): Promise<ExecutionResult> {
    const options: ForkOptions = this.options as ForkOptions;

    return new Promise<ExecutionResult>((resolve, reject) => {
      const args = options.args || [];
      if (!ctx.compiled?.file) {
        throw new Error(`File not written for ${ctx.fence.id}!`);
      }
      const cmd = [options.cmd, ctx.compiled?.file, ...args].join(' ');
      const alias = `${ctx.file}_${ctx.fence.index}.${ctx.fence.name.split(/\s/)[0]}`;
      checkRestrictions(cmd, ctx, this.options);
      const execOpts = {
        env: ctx.fence.config.env,
        ...(ctx.fence.config.cmd || {}),
      }

      this.log.debug('Preparing to execute %s', alias);
      exec(cmd, execOpts, (err, _stdout, _stderr) => {
        let skip = false;
        const stdout = typeof _stdout === 'string' ? _stdout : (_stdout as Buffer).toString(UTF8);
        const stderr = typeof _stderr === 'string' ? _stderr : (_stderr as Buffer).toString(UTF8);
        let result: ExecutionResult = {
          ...ctx,
          execution: { alias, stderr, stdout },
        };
        if (err) {
          this.log.warn('Error while executing %s', alias, err);
          if (options.failOnerror) {
            skip = true;
            reject(err);
          }
          else {
            result = {
              ...ctx,
              execution: {
                alias,
                errors: [err],
                stderr,
                stdout,
              },
            };
          }
        }
        if (!skip) {
          this.log.debug('Executed %s', alias);
          resolve(result);
        }
      });
    });
  }


  accept(fence: FenceContext): boolean {
    const tokens = fence.fence.name.split(/\s/);
    const opts = this.options as ForkOptions;
    const accepted = opts.matchFence.test(tokens[tokens.length - 1]);
    this.log.debug('Fence %s matched %s [%s]', fence.fence.id, opts.matchFence, accepted);
    return accepted;
  }


  static supply(matchFence: RegExp, cmd: string, ...args: string[]): ConfigurationSupplier<Executor> {
    return function makeForkExecutor(config: ConfigurationOptions) {
      const opt: ForkOptions = {
        ...config,
        matchFence,
        cmd,
        args,
      };
      return new ForkExecutor(opt);
    }
  }

}
