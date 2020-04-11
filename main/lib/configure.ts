import {bootstrap, ConsoleLog, Log, LogConfig, Providers, templateString} from '@btilford/ts-base';
import {processEnvLoader} from '@btilford/ts-base-node';
import fs from 'fs';
import globby from 'globby';
import path from 'path';
import {Compiler} from './compiler';
import {ProjectDetails} from './context';
import {ExecutionRenderer, Executor, ExecutorConfig, StdOutRenderer} from './exec';
import {Md} from './md';
import {MarkdownItOptions, Options, OutputStyle, Project} from './options';
import {FileRenderer} from './renderer';
import {Restrictions} from './restrictions';
import {UTF8} from './text';


function projectAtCwd(): Project {
  const cwd = process.cwd();
  const pkgJsonPath = path.join(cwd, 'package.json');
  const pkgJson = fs.readFileSync(pkgJsonPath, { encoding: UTF8 });
  const { name, version } = JSON.parse(pkgJson);
  return {
    name,
    version,
  };
}


export type ConfigurationOptions = {
  readonly project: ProjectDetails;
  readonly markdownIt?: MarkdownItOptions;
  readonly compilers: Compiler[];
  readonly fileRenderer: FileRenderer;
  readonly executors: [Executor, ExecutionRenderer][];
  readonly defaultExecutionRenderer: ExecutionRenderer;
  readonly failOnerror: boolean;
  readonly outputStyle: OutputStyle;
  readonly include: {
    readonly   patterns: string | string[];
    readonly   globby?: globby.GlobbyOptions;
  };
  readonly restrictions: Restrictions;
}

const defaultGlobbyOptions: globby.GlobbyOptions = {
  gitignore: true,
  ignore: [
    'node_modules',
  ],
}


export class Configuration implements ConfigurationOptions {


  constructor(private readonly options: Options) {
    this.failOnerror = options.failOnerror || true;
    this.includePatterns = options.include.patterns;
    this.globbyOptions = options.include.globby;
    this.outputStyle = options.outputStyle || 'single-file';
    this.project = new ProjectDetails(options.project || projectAtCwd());

    this.markdownIt = options.markdownIt;
    this.md = new Md(this.markdownIt);
    this.restrictions = options.restrictions || {
      allowSudo: false,
    };
    const name = `md-check:${this.project.name}`;
    bootstrap({
      appName: 'md-check',
      envLoaders: [processEnvLoader],
      log: {
        root: ConsoleLog.create({
          name,
          config: LogConfig.create({
            messageTemplate: templateString('[${ctx.data.level.name}] ${ctx.data.fqn} > ${ctx.message}'),
          }),
        }),
      },
    });
    this.log = Providers.provide(Log).extend(Configuration.name);
    this.log.debug('Configured');
  }


  readonly log: Log;

  readonly restrictions: Restrictions;


  readonly md: Md;

  private _compilers: Compiler[] | undefined;


  get compilers(): Compiler[] {
    if (!this._compilers) {
      this._compilers = this.options.compilers
                        ? this.options.compilers.map(fn => fn(this))
                        : [];
    }
    return this._compilers;
  }


  private _executors: ExecutorConfig[] | undefined;


  get executors(): ExecutorConfig[] {
    if (!this._executors) {
      if (this.options.executors) {
        this._executors = this.options.executors.map(config => {
          let result: ExecutorConfig | undefined;
          if (config.length === 2) {
            const [exec, rend] = config;
            result = [exec(this), rend ? rend(this) : this.defaultExecutionRenderer];
          }
          else {
            const [exec] = config;
            if (exec) {
              result = [exec(this), this.defaultExecutionRenderer];
            }

          }
          return result;
        }).filter(executor => executor) as ExecutorConfig[];
      }
      else {
        this._executors = []
      }
    }
    return this._executors;

  }


  private _defaultExecutionRenderer: ExecutionRenderer | undefined;


  get defaultExecutionRenderer(): ExecutionRenderer {
    if (!this._defaultExecutionRenderer) {
      this._defaultExecutionRenderer = this.options.defaultExecutionRenderer
                                       ? this.options.defaultExecutionRenderer(this)
                                       : StdOutRenderer.supply()(this);

    }
    return this._defaultExecutionRenderer;
  }


  private _fileRenderer: FileRenderer | undefined;


  get fileRenderer(): FileRenderer {
    if (!this._fileRenderer) {
      this._fileRenderer = this.options.fileRenderer
                           ? this.options.fileRenderer(this)
                           : FileRenderer.supply()(this);
    }
    return this._fileRenderer;
  }


  readonly failOnerror: boolean;

  private readonly includePatterns: string | string[];
  private globbyOptions?: globby.GlobbyOptions;


  get include(): { patterns: string | string[]; globby?: globby.GlobbyOptions } {
    if (!this.globbyOptions) {
      this.globbyOptions = defaultGlobbyOptions;
    }
    return { patterns: this.includePatterns, globby: this.globbyOptions };
  }


  readonly markdownIt?: MarkdownItOptions;
  readonly outputStyle: 'single-file' | 'per-file';
  readonly project: ProjectDetails;


}
