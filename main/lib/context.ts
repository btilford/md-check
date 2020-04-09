import path from 'path';
import {Project} from './options';
import {stripLeadingAndTrailingSlashes} from './text';


export class ProjectDetails implements Project {

  readonly matchCwd: RegExp;
  readonly matchOutputDir: RegExp;

  readonly temp: string;
  readonly output: string;
  readonly tempDir: string;
  readonly outputDir: string;
  readonly cwd: string;


  constructor(private readonly project: Project) {
    this.cwd = this.project.cwd || process.cwd();

    this.output = this.project.outputDir || 'dist';
    this.temp = this.project.tempDir || '.md-check';

    this.tempDir = this.absolutePath(this.temp);
    this.outputDir = this.absolutePath(this.output);
    this.matchCwd = RegExp(this.cwd, 'g');
    this.matchOutputDir = RegExp(this.output, 'g');
  }


  get name(): string {
    return this.project.name;
  }


  get version(): string | undefined {
    return this.project.version;
  }


  absolutePath(file: string): string {
    return path.join(this.cwd, file)
  }


  relativePath(file: string): string {
    const relative = file.replace(this.matchCwd, '');
    return stripLeadingAndTrailingSlashes(relative);
  }


  outputRelativePath(file: string): string {
    const relative = file.replace(this.matchOutputDir, '');
    return stripLeadingAndTrailingSlashes(relative);
  }


  tempPath(file: string): string {
    return path.join(this.tempDir, file);
  }


  outputPath(file: string): string {
    return path.join(this.outputDir, file);
  }

}


export type Context = {
  readonly project: ProjectDetails;
  [name: string]: any;
}

export type FileContext = Context & {
  file: string;
}
