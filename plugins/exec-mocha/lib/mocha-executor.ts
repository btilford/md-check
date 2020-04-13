import {
  ConfigurationOptions,
  ConfigurationSupplier,
  Execution,
  ExecutionContext,
  ExecutionError,
  ExecutionResult,
  Executor,
  ExecutorOptions,
  FenceContext,
  NOT_IN_CI,
} from '@btilford/md-check';
import {StringWriter, TimedAsync, CountInvocations} from '@btilford/ts-base';
import Mocha from 'mocha';


export type MochaExecutorOptions = ExecutorOptions & {
  mocha: Mocha.MochaOptions;
  failOnTestFailure: boolean;
}

export const DEFAULT_MOCHA_OPTIONS: Mocha.MochaOptions = {
  ui: 'bdd',

};

export type Test = Mocha.ITest & {
  stdout?: string;
  stderr?: string;
  err?: Error;
  [k: string]: any;
};

export type Suite = {
  readonly title: string;
  readonly tests: Test[];
  [k: string]: any;
};


export class MochaExecutor extends Executor {


  constructor(options: MochaExecutorOptions) {
    super(options);
  }


  static supply(
    mochaOptions: Mocha.MochaOptions = DEFAULT_MOCHA_OPTIONS,
    failOnTestFailure = true,
  ): ConfigurationSupplier<MochaExecutor> {
    return function makeMochaExecutor(config: ConfigurationOptions) {
      return new MochaExecutor({
        ...config,
        failOnTestFailure,
        mocha: mochaOptions,
      });
    };
  }


  accept(fence: FenceContext): boolean {
    const parts = fence.fence.name.split(/\s/);
    return /mocha$/.test(parts[parts.length - 1]);
  }

  @CountInvocations()
  @TimedAsync({ filter: NOT_IN_CI })
  execute(ctx: ExecutionContext): Promise<import('@btilford/md-check').ExecutionResult> {
    return new Promise<ExecutionResult>((resolve, reject) => {
      const alias = `${ctx.file}_${ctx.fence.index}.js`;
      this.log.debug('Preparing to execute %s', alias);
      const options = this.options as MochaExecutorOptions;
      const execution: Execution = {
        alias,
      };
      let suite: Suite;

      const elog = this.log;


      class MochaReporter extends Mocha.reporters.Base {


        constructor(runner: Mocha.Runner, options: Mocha.MochaOptions) {
          super(runner, options);
          const log = elog.extend('MochaReporter');

          let stdout: StringWriter;
          let stderr: StringWriter;
          const realConsole = console;
          let fakeConsole: Console;
          let currentTest: Test;

          const reporter = this;

          runner.on('suite', (_suite: Mocha.Suite) => {
            if (_suite.root) {
              suite = {
                title: _suite.fullTitle(),
                tests: [],
              };
              log.info('Beginning suite %s for %s', suite.title, alias);
            }
          });

          runner.on('test', (test: Mocha.Test) => {
            log.info('Beginning test %s for %s', test.fullTitle(), alias);
            stdout = new StringWriter();
            stderr = new StringWriter();
            fakeConsole = new console.Console(stdout, stderr)
            // eslint-disable-next-line no-global-assign
            console = fakeConsole;
            currentTest = test;
          });
          runner.on('test end', (test: Mocha.Test) => {
            // eslint-disable-next-line no-global-assign
            console = realConsole;
            currentTest.stderr = stderr.output;
            currentTest.stdout = stdout.output;
            currentTest.speed = test.speed;
            currentTest.err = test.err;
            suite.tests.push(currentTest);
            log.info('Completed test %s for %s', suite.title, alias);
          });

          runner.on('end', function end() {
            log.info('Completed suite %s for %s', suite.title, alias);
            suite.stats = reporter.stats;
            execution.suite = suite;
          });
        }
      }


      try {
        const mochaOpts = { ...options.mocha };
        if (!mochaOpts.reporter) {
          mochaOpts.reporter = MochaReporter;
        }
        const mocha = new Mocha(mochaOpts);
        const file = ctx.compiled?.file;
        if (!file) {
          throw new Error(`Mocha runner requires that the file ${ctx.file} be compiled!`);
        }
        mocha.addFile(file);
        mocha.run(failures => {
          execution.failures = failures;
          execution.stdout = suite.tests.map(t => t.stdout).join('\n');
          execution.stderr = suite.tests.map(t => t.stderr).join('\n');
          const msg = `${alias} had ${failures} tests failures`;
          if (failures > 0 && options.failOnTestFailure) {
            elog.warn('Fail %s', msg);

            for (const test of suite.tests) {
              if (test.pending) {
                elog.warn('Test %s is pending for %s', test.title, alias);
              }
              else if (test.state === 'failed') {
                elog.error('Test %s failed for %s', test.title, alias, test.err);
              }
              else {
                elog.info('Test %s passed for %s', test.title, alias);
              }
            }
            const fail = new ExecutionError(msg);
            execution.errors = [fail];
            reject({ ...ctx, execution });
          }
          else {
            elog.info('Success %s', msg);
            resolve({ ...ctx, execution });
          }
        });

      }
      catch (error) {
        const msg = `Failed running mocha tests in ${alias}`;
        const execError = new ExecutionError(msg, error);
        elog.warn(msg, error);
        if (options.failOnerror) {
          reject(execError);
        }
        else {
          execution.errors = [execError];
          resolve({ ...ctx, execution });
        }
      }
    });

  }


}
