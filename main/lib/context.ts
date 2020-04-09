import path from 'path';
import {Project} from './options';


export class ProjectDetails implements Project {

  constructor(private readonly project: Project) {
  }


  get name(): string {
    return this.project.name;
  }


  get version(): string | undefined {
    return this.project.version;
  }


  get cwd(): string {
    return this.project.cwd || process.cwd();
  }


  absolutePath(file: string): string {
    return path.join(this.cwd, file)
  }


  get tempDir(): string {
    return this.absolutePath(this.project.tempDir || '.md-check');
  }


  get outputDir(): string {
    return this.absolutePath(this.project.outputDir || 'dist');
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
