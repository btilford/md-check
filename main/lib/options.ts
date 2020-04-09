import globby from 'globby';
import MarkdownIt from 'markdown-it';
import {Compiler} from './compile';
import {ConfigurationOptions} from './configure';
import {ExecutionRenderer, Executor} from './exec';
import {FileRenderer} from './renderer';


export type OutputStyle = 'single-file' | 'per-file';
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


export interface ConfigurationSupplier<T> {
  (config: ConfigurationOptions): T;
}


export type Options = {
  project?: Project;
  markdownIt?: MarkdownItOptions;
  compilers?: ConfigurationSupplier<Compiler>[];
  fileRenderer?: ConfigurationSupplier<FileRenderer>;
  executors?: [ConfigurationSupplier<Executor>, ConfigurationSupplier<ExecutionRenderer>?][];
  defaultExecutionRenderer?: ConfigurationSupplier<ExecutionRenderer>;
  failOnerror?: boolean;
  outputStyle?: OutputStyle;
  include: {
    patterns: string | string[];
    globby?: globby.GlobbyOptions;
  };
}

