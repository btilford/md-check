import MarkdownIt from 'markdown-it';
import {Compiler} from './compile';
import {ExecutionRenderer, Executor} from './exec';
import {FileRenderer} from './renderer';
import globby from 'globby';


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
  project?: Project;
  markdownIt?: MarkdownItOptions;
  compilers?: Compiler[];
  fileRenderer?: FileRenderer;
  executors?: [Executor, ExecutionRenderer?][];
  defaultExecutionRenderer?: ExecutionRenderer;
  failOnerror?: boolean;
  outputStyle?: 'single-file' | 'per-file';
  include: {
    patterns: string | string[];
    globby?: globby.GlobbyOptions;
  };
}

