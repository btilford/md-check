import {StringWriter} from '@btilford/ts-base';
import {NodeVM, NodeVMOptions as VM2Options, VMScript} from 'vm2';
import {NOT_IN_CI} from '../apm-filter';
import {ConfigurationOptions} from '../configure';
import {FenceContext} from '../fence';
import {readTemp} from '../files';
import {ConfigurationSupplier} from '../options';
import {ExecutionContext, ExecutionResult, Executor, ExecutorOptions} from './executor';
import path from 'path';
import fs from 'fs';
import {CountInvocations, TimedAsync} from '@btilford/ts-base';

export class NodeVmError extends Error {

  constructor(message: string, readonly cause: Error, readonly code?: string) {
    super(message);
  }
}


export type NodeVmOptions = ExecutorOptions & {
  vm2Options?: VM2Options;
}
export const DEFAULT_VM2_OPTIONS: VM2Options = {
  console: 'redirect',
  require: {
    builtin: ['*'],
    external: {
      modules: ['*'],
      transitive: true,
    },
    // import: ['@btilford/ts-base'],
  },
};

type VmHook = {
  stdout: StringWriter;
  stderr: StringWriter;
  listeners: { event: string; listener: (...args: any[]) => void }[];
};


function listen(vm: NodeVM): VmHook {
  const output: VmHook = {
    stdout: new StringWriter(),
    stderr: new StringWriter(),
    listeners: [],
  };

  const _console = new console.Console(output.stdout, output.stderr);

  Object.keys(_console).forEach(name => {
    const event = `console.${name}`;
    const listener = (...args) => _console[name](...args);
    vm.on(event, listener);
    output.listeners.push({ event, listener });
  });
  return output;
}


export class NodeVmExecutor extends Executor {

  protected readonly vm: NodeVM;


  constructor(options: NodeVmOptions) {
    super(options);
    const vmOpts = {
      ...DEFAULT_VM2_OPTIONS,
      ...options.vm2Options || {},
    };


    this.vm = new NodeVM(vmOpts);
  }


  static supply(vm2Options: VM2Options = DEFAULT_VM2_OPTIONS): ConfigurationSupplier<NodeVmExecutor> {
    return function makeNodVmExecutor(config: ConfigurationOptions) {
      return new NodeVmExecutor({ ...config, ...vm2Options });
    }
  }


  accept(fence: FenceContext): boolean {
    const tokens = fence.fence.name.split(/\s/);
    const accepted = /node[-mv]?$/.test(tokens[tokens.length - 1]);
    this.log.debug('Accepted %s %s', accepted, fence.fence.id);
    return accepted;
  }

  @CountInvocations()
  @TimedAsync({ filter: NOT_IN_CI })
  async execute(ctx: ExecutionContext): Promise<ExecutionResult> {
    const alias = `${ctx.file}_${ctx.fence.index}.js`;
    this.log.debug('Preparing to execute %s', alias);
    const options: NodeVmOptions = this.options;
    const vm2Options = { ...(options.vm2Option || {}) };
    if (vm2Options.require !== false) {
      const _require = {
        ...(typeof vm2Options.require === 'object' ? vm2Options.require : {}),
        resolve: moduleName => {
          const resolved = path.join(
            options.project.tempDir,
            ctx.file.replace(path.basename(ctx.file), ''),
            moduleName,
          );
          this.log.debug('Resolved %s to %s', moduleName, resolved);
          const exists = fs.existsSync(resolved);
          if (!exists) {
            this.log.warn('Unable to resolve %s! File %s doesn\'t exist!', moduleName, resolved);
          }
          return resolved;
        },
      }
      vm2Options.require = _require;
    }

    const result: ExecutionResult = {
      ...ctx,
      execution: {
        alias,
      },
    };
    const errors: NodeVmError [] = [];
    let code: string | undefined;
    try {
      let script: VMScript;
      const stdout = new StringWriter();
      const stderr = new StringWriter();
      const _console = new console.Console(stdout, stderr);
      const sandbox = {
        ...(vm2Options.sandbox || {}),
        console: _console,
      };
      if (ctx.compiled) {
        this.log.info('Reading compiled source from %s', ctx.compiled.file);
        code = await readTemp(options.project, ctx.compiled.file);
      }
      else {
        this.log.info('Using raw code from fence %s', ctx.fence.id);
        code = ctx.fence.code;
      }
      script = new VMScript(code, alias, {
        ...vm2Options,
        sandbox,
      });
      try {
        script = script.compile();
      }
      catch (compileError) {
        const msg = `Failed compiling ${alias} for file ${ctx.file}! ${compileError.message}`;
        const err = new NodeVmError(msg, compileError, ctx.fence.code);
        this.log.warn(msg, compileError);
        if (this.options.failOnerror) {
          throw err;
        }
        else {
          errors.push(err);
        }
      }
      const vmHook = listen(this.vm);
      const execution = this.vm.run(script);
      this.log.info('Finished execution for %s', alias);
      vmHook.listeners.forEach(hook => this.vm.off(hook.event, hook.listener));
      result.execution.returnValue = execution;
      result.execution.stdout = vmHook.stdout.output;
      result.execution.stderr = vmHook.stderr.output;
    }
    catch (error) {
      const msg = `Failed executing ${alias} for file ${ctx.file}! ${error.message}`;
      const err = new NodeVmError(msg, error, ctx.fence.code);
      if (this.options.failOnerror) {
        throw err;
      }
      else {
        this.log.warn(msg, error);
        errors.push(err);
      }
    }

    if (errors.length > 0) {
      result.execution.errors = errors;
    }
    return result;
  }
}

