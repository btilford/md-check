import {promises as fs} from 'fs';
import {ProjectDetails} from './context';
import {UTF8} from './text';


export async function readSource(project: ProjectDetails, file: string): Promise<string> {
  return fs.readFile(project.absolutePath(file), { encoding: UTF8 });
}


export async function readOutput(project: ProjectDetails, file: string): Promise<string> {
  return fs.readFile(project.outputPath(file), { encoding: UTF8 });
}


export async function writeTemp(project: ProjectDetails, file: string, src: string): Promise<string> {
  const result = project.tempPath(file);
  await fs.writeFile(result, src, { encoding: UTF8 });
  return result;
}


export async function writeOutput(project: ProjectDetails, file: string, src: string): Promise<string> {
  const result = project.outputPath(file);
  await fs.writeFile(result, src, { encoding: UTF8 });
  return result;
}


export async function apppendOutput(project: ProjectDetails, from: string, to: string): Promise<string> {
  const _to = project.outputPath(to);
  const src = readSource(project, from);

  await fs.appendFile(_to, src, { encoding: UTF8 });

  return _to;
}
