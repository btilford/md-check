import {Configuration, ConfigurationOptions} from '../configure';
import {FenceContext} from '../fence';
import {NodeVmExecutor} from './node-vm-executor';
import Token from 'markdown-it/lib/token';
import {expect} from 'chai';


describe('Node VM2 Executor Specs', function () {
  const suite = this.title;
  let config: ConfigurationOptions;
  let exec: NodeVmExecutor;

  beforeEach(() => {
    config = new Configuration({
      project: {
        name: suite,
      },
      include: { patterns: [] },
    });
    exec = new NodeVmExecutor({
      ...config,
    });
  });

  it('executes a simple script', async function () {
    const fence: FenceContext = {
      ...config,
      file: `${suite}/${this.test?.title}.md`,
      markdown: '',
      fence: {
        name: '',
        index: 0,
        token: new Token('', '', 0),
        code: `console.log('Hello from %s %s', '${suite}', '${this.test?.title}');`,
        id: '',
        config: {
          title: this.test?.title || '',
        },
      },
    };
    const result = await exec.execute(fence);
    expect(result).not.to.be.undefined;
    expect(result.execution.stdout).to.match(/Hello\sfrom\s\w+/g);
  });

  it('executes a script that requires a node_module', async function () {
    const fence: FenceContext = {
      ...config,
      file: `${suite}/${this.test?.title}.md`,
      markdown: '',
      fence: {
        name: '',
        index: 0,
        token: new Token('', '', 0),
        code: `
        const {expect} = require('chai');
        try {
          expect(true).to.eq(false);
        }
        catch(err) {
          console.error(err);
        }
        `,
        id: '',
        config: {
          title: this.test?.title || '',
        },
      },
    };
    const result = await exec.execute(fence);
    expect(result).not.to.be.undefined;
    expect(result.execution.stderr).to.match(/AssertionError:/g);
  });
});
