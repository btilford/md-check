import {promises as fs} from 'fs';
import {ProjectDetails} from './context';
import {UTF8} from './text';
import path from 'path';
import {Log, Providers} from '@btilford/ts-base';


let _log: Log;


function log(): Log {
  if (!_log) {
    _log = Providers.provide(Log).extend('Files');
  }
  return _log;
}


export async function readSource(project: ProjectDetails, file: string): Promise<string> {
  return fs.readFile(project.absolutePath(file), { encoding: UTF8 });
}


export async function readOutput(project: ProjectDetails, file: string): Promise<string> {
  return fs.readFile(project.outputPath(file.replace(project.output, '')), { encoding: UTF8 });
}


export async function readTemp(project: ProjectDetails, file: string): Promise<string> {
  return fs.readFile(project.tempPath(file.replace(project.temp, '')), { encoding: UTF8 });
}


export async function writeTemp(project: ProjectDetails, file: string, src: string): Promise<string> {
  const result = project.tempPath(file);
  await fs.mkdir(result.replace(path.basename(result), ''), { /*mode: '666',*/ recursive: true });
  await fs.writeFile(result, src, { encoding: UTF8, mode: '0644' });
  log().debug('Wrote tempfile %s', result);
  return project.relativePath(result);
}


export async function writeOutput(project: ProjectDetails, file: string, src: string): Promise<string> {
  const result = project.outputPath(file);
  await fs.mkdir(result.replace(path.basename(result), ''), { recursive: true });
  await fs.writeFile(result, src, { encoding: UTF8 });
  log().debug('Wrote output %s', result);
  return project.relativePath(result);
}


export async function apppendOutput(
  project: ProjectDetails,
  from: string,
  to: string,
  fromFile = true,
): Promise<string> {
  const _to = path.resolve(project.outputPath(to));
  let _from = from;
  await fs.mkdir(_to.replace(path.basename(_to), ''), { recursive: true });
  let src: string;
  if (fromFile) {
    try {

      src = await fs.readFile(_from, { encoding: UTF8 });
    }
    catch (err) {
      const retry = `/${_from}`;
      log().warn('Reading from %s failed trying %s', _from, retry);
      src = await fs.readFile(retry, { encoding: UTF8 });
      _from = retry;
    }
  }
  else {
    src = from;
  }
  await fs.appendFile(_to, src, { encoding: UTF8 });
  log().debug('Appended %s to  %s', _from, _to);

  return project.relativePath(_to);
}
