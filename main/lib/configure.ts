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


export class Configuration implements Options {


  constructor(options: Options) {
    this.failOnerror = options.failOnerror || true;
    this.include = options.include;
    this.outputStyle = options.outputStyle || 'single-file';
    this.project = options.project || projectAtCwd();

    this.markdownIt = options.markdownIt;
    this.md = new Md(this.markdownIt);
    this.compilers = options.compilers || [];

    this.defaultExecutionRenderer = options.defaultExecutionRenderer || new StdOutRenderer({
      ...this,
    });
    this.executors = (options.executors || []).map(config => {
      return config.length === 2 ? config as ExecutorConfig : [config[0], this.defaultExecutionRenderer];
    });

    this.fileRenderer = options.fileRenderer || new FileRenderer({
      ...this,
    });

  }


  readonly md: Md;
  readonly default

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
