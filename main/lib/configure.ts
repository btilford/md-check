import fs from 'fs';
import path from 'path';
import {Compiler} from './compile';
import {ExecutionRenderer, ExecutorConfig, StdOutRenderer} from './exec';
import {Md} from './md';
import {MarkdownItOptions, Options, Project} from './options';
import {FileRenderer} from './renderer';
import {UTF8} from './text';
import globby from 'globby';


function projectAtCwd(): Project {
  const cwd = process.cwd();
  const pkgJsonPath = path.join(cwd, 'package.json');
  const pkgJson = fs.readFileSync(pkgJsonPath, { encoding: UTF8 });
  const { name, version } = JSON.parse(pkgJson);
  return {
    name,
    version,
    cwd,
    tempDir: '.md-check',
    outputDir: 'dist',
  };
}


export class Configuration {


  constructor(options: Options) {
    this.failOnerror = options.failOnerror || true;
    this.include = options.include;
    this.outputStyle = options.outputStyle || 'single-file';
    this.project = options.project || projectAtCwd();

    this.markdownIt = options.markdownIt;
    this.md = new Md(this.markdownIt);
    this.compilers = options.compilers ? options.compilers.map(fn => fn(this)) : [];

    this.defaultExecutionRenderer = options.defaultExecutionRenderer
                                    ? options.defaultExecutionRenderer(this)
                                    : StdOutRenderer.supply()(this);
    if (options.executors) {
      this.executors = options.executors.map(config => {
        let result: ExecutorConfig;
        if (config.length === 2) {
          const [exec, rend] = config;
          result = [exec(this), rend ? rend(this) : this.defaultExecutionRenderer];
        }
        else {
          result = [config[0](this), this.defaultExecutionRenderer];
        }
        return result;
      });
    }
    else {
      this.executors = []
    }
    this.fileRenderer = options.fileRenderer
                        ? options.fileRenderer(this)
                        : FileRenderer.supply()(this);

  }


  readonly md: Md;

  readonly compilers: Compiler[];
  readonly executors: ExecutorConfig[];
  readonly defaultExecutionRenderer: ExecutionRenderer;
  readonly fileRenderer: FileRenderer;

  readonly failOnerror: boolean;
  readonly include: { patterns: string | string[]; globby?: globby.GlobbyOptions };
  readonly markdownIt?: MarkdownItOptions;
  readonly outputStyle: "single-file" | "per-file";
  readonly project: Project;


}
