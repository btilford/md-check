export * from './main';
export * from './options';
export * from './context';
export * from './compiler';
export * from './parser';
export * from './renderer';
export * from './exec';
export * from './text';
export * from './files';
export * from './configure';
export * from './restrictions';
export * from './fence';
export * from './apm-filter';

import {Configuration} from './configure';
import {Options} from './options';


export function mdCheck(options: Options) {
  return new Configuration(options);
}
export default mdCheck;
