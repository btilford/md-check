import {expect} from 'chai';
import {main, Results, WriteSourceCompiler} from '../lib';
import {ForkExecutor} from '../lib/exec';


describe('Parse a single file E2E Test', () => {
  describe('Parsing example-1', () => {
    let result: Results;
    beforeEach(async () => {
      result = await main({
        include: {
          patterns: 'e2e/fixtures/example-1.md',
        },
        compilers: [
          WriteSourceCompiler.supply(/^javascript/),
        ],
        executors: [
          [ForkExecutor.supply(/node$/, 'node')/*, StdOutRenderer.supply()*/],
        ],
      });
    });

    it('returned results', () => {
      expect(result).not.to.be.undefined;
    });
    it('processed 1 file', () => {
      expect(result.files).to.have.length(1);
    });
  });
});
