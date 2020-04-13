import {Configuration, ForkExecutor, Results} from '@btilford/md-check';
import {expect} from 'chai';
import {TsCompiler} from '../lib';


describe('Compiling and executing Typescript blocks', () => {
  describe('Parsing ts-example-1', () => {
    let result: Results;
    beforeEach(async () => {
      result = await new Configuration({
        include: {
          patterns: 'e2e/fixtures/ts-example-1.md',
        },
        compilers: [
          TsCompiler.supply(),
        ],
        executors: [
          [ForkExecutor.supply(/node$/, 'node')],
        ],
      }).run();
    });

    it('returned results', () => {
      expect(result).not.to.be.undefined;
    });
    it('processed 1 file', () => {
      expect(result.files).to.have.length(1);
    });
  });

});
