import {CompileResult, Configuration, ConfigurationOptions, UTF8} from '@btilford/md-check';
import {expect} from 'chai';
import fs from 'fs';
import Token from 'markdown-it/lib/token';
import {TsCompiler} from '../lib';


describe('Compiling Typescript blocks', function () {
  const suite = this.title;

  let result: CompileResult;
  let config: ConfigurationOptions;
  let compiler: TsCompiler;
  const source = 'test/fixtures/example-1.ts';
  beforeEach(async () => {

    config = new Configuration({
      include: {
        patterns: [],
      },
    });
    const original = config.project.absolutePath(source);
    // fs.mkdirSync(temp.replace(path.basename(temp), ''), { recursive: true });
    const code = fs.readFileSync(original, { encoding: UTF8 });

    compiler = TsCompiler.supply()(config);
    result = await compiler.compile({
      ...config,
      file: source,
      fence: {
        id: suite,
        name: 'typescript',
        token: new Token('', '', 0),
        index: 0,
        code,
        config: { title: suite },
      },
      project: config.project,
      markdown: '',
    });
  });

  it('returned results', () => {
    expect(result).not.to.be.undefined;
  });
  it('it compiled', () => {
    expect(result.compiled).not.to.be.undefined;
  });
  it('returns the path for a new js file', () => {
    expect(result.compiled.file).to.match(/example-1.*\.js$/g);
  });
  it('wrote the js file', async () => {
    const tempFile = config.project.absolutePath(result.compiled.file);
    const exists = fs.existsSync(tempFile)
    expect(exists).to.eq(true, `File ${tempFile} should exist!`);
  });
  it('the file can be imported', async () => {
    const contents = await import(config.project.absolutePath(result.compiled.file.replace(/\.js$/, '')));
    expect(contents).not.to.be.undefined;
  });
  it('the file exports the correct items', async () => {
    const contents = await import(config.project.absolutePath(result.compiled.file.replace(/\.js$/, '')));
    expect(contents.default.constructor.name).to.eq(contents.Something.name);
  });

});
