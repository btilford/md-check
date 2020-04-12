import {Configuration, ConfigurationOptions, Execution, ExecutionContext, ExecutionResult} from '@btilford/md-check';
import {expect} from 'chai';
import Token from 'markdown-it/lib/token';
import {DEFAULT_MOCHA_OPTIONS, MochaExecutor} from './mocha-executor';


describe('MochaExecutor Specs', function () {
  const suite = this.title;
  let config: ConfigurationOptions;
  let exec: MochaExecutor;
  let baseCtx: ExecutionContext;
  before(() => {
    config = new Configuration({
      project: {
        name: suite,
      },
      include: { patterns: [] },
    });
    exec = new MochaExecutor({
      ...config,
      failOnTestFailure: true,
      mocha: DEFAULT_MOCHA_OPTIONS,
    });
    baseCtx = {
      ...config,
      file: '',
      markdown: '',
      fence: {
        index: 0,
        id: suite,
        name: suite,
        code: '',
        token: new Token('', '', 0),
        config: {
          title: suite,
        },
      },
    };
  });

  describe('happy path', function () {
    let ctx: ExecutionContext;
    let result: ExecutionResult;
    let execution: Execution;
    before(async () => {
      ctx = {
        ...baseCtx,
        compiled: {
          file: 'test/fixtures/easy.js',
        }
      };
      result = await exec.execute(ctx);
      execution = result.execution;
    });

    it('returned a result', () => {
      expect(result).not.to.be.undefined;
    });
    it('captured stdout for the entire suite', () => {
      expect(execution.stdout).to.match(/^Passed/g);
    });
    it('collected the suite', () => {
      expect(execution.suite).not.to.be.undefined;
    });
    it('collected the suite stats', () => {
      expect(execution.suite.stats).not.to.be.undefined;
    });
    it('has 1 test', () => {
      expect(execution.suite.tests).to.have.length(1);
    });

    it('captured stdout for the test individually', () => {
      expect(execution.suite.tests[0].stdout).to.match(/^Passed/g);
    });
    it('records the test as passed', () => {
      expect(execution.suite.tests[0].state).to.eq('passed');
    });
  });
});
