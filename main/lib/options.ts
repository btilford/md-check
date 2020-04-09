import {GlobbyOptions} from '../../common/temp/pnpm-store/2/registry.npmjs.org/globby/11.0.0/package/index';
import {Compiler} from './compile';
import MarkdownIt from 'markdown-it';
import {ExecutionRenderer} from './exec/ExecutionRenderer';
import {Executor} from './exec/executor';
import {FileRenderer} from './renderer';


export type Project = {
  readonly name: string;
  readonly version?: string;
  readonly cwd?: string;
  readonly tempDir?: string;
  readonly outputDir?: string;
}

export type MarkdownItPlugin = {
  plugin: (md: MarkdownIt, ...params: unknown[]) => void;
  params: unknown[];
};

export type MarkdownItOptions = {
  options?: MarkdownIt.Options;
  use?: MarkdownItPlugin[] | false;
};

export type Options = {
  readonly project: Project;
  readonly markdownIt?: MarkdownItOptions;
  readonly compilers: Compiler[];
  readonly fileRenderer: FileRenderer;
  readonly executors: [Executor, ExecutionRenderer][];
  readonly failOnerror?: boolean;
  readonly outputStyle?: 'single-file' | 'per-file';
  readonly include: {
    readonly patterns: string | string[];
    readonly globby?: GlobbyOptions;
  };
}
