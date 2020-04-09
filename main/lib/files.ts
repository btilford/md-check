import {promises as fs} from 'fs';
import {ProjectDetails} from './context';
import {UTF8} from './text';
import path from 'path';


export async function readSource(project: ProjectDetails, file: string): Promise<string> {
  return fs.readFile(project.absolutePath(file), { encoding: UTF8 });
}


export async function readOutput(project: ProjectDetails, file: string): Promise<string> {
  return fs.readFile(project.outputPath(file), { encoding: UTF8 });
}


export async function writeTemp(project: ProjectDetails, file: string, src: string): Promise<string> {
  const result = project.tempPath(file);
  await fs.mkdir(result.replace(path.basename(result), ''), { recursive: true });
  await fs.writeFile(result, src, { encoding: UTF8 });
  return result;
}


export async function writeOutput(project: ProjectDetails, file: string, src: string): Promise<string> {
  const result = project.outputPath(file);
  await fs.mkdir(result.replace(path.basename(result), ''), { recursive: true });
  await fs.writeFile(result, src, { encoding: UTF8 });
  return result;
}


export async function apppendOutput(project: ProjectDetails, from: string, to: string): Promise<string> {
  const _to = project.outputPath(to);
  await fs.mkdir(_to.replace(path.basename(_to), ''), { recursive: true });
  const src = await fs.readFile(from, { encoding: UTF8 });

  await fs.appendFile(_to, src, { encoding: UTF8 });

  return _to;
}
