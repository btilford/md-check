import {exec} from 'child_process';
import {NOT_IN_CI} from '../apm-filter';

import {ConfigurationOptions} from '../configure';
import {FenceContext} from '../fence';
import {ConfigurationSupplier} from '../options';
import {checkRestrictions} from '../restrictions';
import {UTF8} from '../text';
import {ExecutionContext, ExecutionResult, Executor, ForkOptions} from './executor';
import fs from 'fs';
import {TimedAsync, CountInvocations} from '@btilford/ts-base';


export class ForkExecutor extends Executor {

  constructor(options: ForkOptions) {
    super(options);
  }


  @CountInvocations()
  @TimedAsync({ filter: NOT_IN_CI })
  execute(ctx: ExecutionContext): Promise<ExecutionResult> {
    const options: ForkOptions = this.options as ForkOptions;

    return new Promise<ExecutionResult>((resolve, reject) => {
      let args = options.args || [];
      // if (!ctx.compiled?.file) {
      //   throw new Error(`File not written for ${ctx.fence.id}!`);
      // }
      if (ctx.fence.config.args) {
        args = [...args, ...ctx.fence.config.args];
      }
      if (args.find(arg => arg.match(/SOURCE_FILE/g))) {
        this.log.info('Making file %s executable...', ctx.file);
        fs.chmodSync(options.project.relativePath(ctx.file), '0777');
      }
      if (ctx.compiled && args.find(arg => arg.match(/COMPILED_FILE/g))) {
        this.log.info('Making file %s executable...', ctx.compiled.file);
        fs.chmodSync(options.project.relativePath(ctx.compiled?.file), '0777');
      }
      const cmd = [options.cmd, ...args].join(' ');
      const alias = `${ctx.file}_${ctx.fence.index}.${ctx.fence.name.split(/\s/)[0]}`;
      checkRestrictions(cmd, ctx, this.options);
      const execOpts = {
        env: {
          ...(options.env || {}),
          ...(ctx.fence.config.env || {}),
          COMPILED_FILE: ctx.compiled?.file,
          SOURCE_FILE: ctx.file,
          SOURCE: ctx.fence.code,
        },
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


  static supply(
    matchFence: RegExp,
    cmd: string,
    env: Record<string, string> = {},
    ...args: string[]
  ): ConfigurationSupplier<Executor> {
    return function makeForkExecutor(config: ConfigurationOptions) {
      const opt: ForkOptions = {
        ...config,
        matchFence,
        cmd,
        env,
        args,
      };
      return new ForkExecutor(opt);
    }
  }

}
