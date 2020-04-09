export * from './main';
export * from './options';
export * from './context';
export * from './compile';
export * from './parser';
export * from './renderer';
export * from './exec';
export * from './text';
export * from './files';
export * from './configure';


import {main} from './main';
import {Options} from './options';


export function mdCheck(options: Options) {
  return () => main(options);
}
export default mdCheck;
