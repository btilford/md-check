import {Log, Providers} from '@btilford/ts-base';
import {ConfigurationOptions} from '../configure';
import {FenceContext} from '../fence';


export type CompilerOptions = ConfigurationOptions & {
  [name: string]: any;
};

export type CompileContext = FenceContext & {}
export type Compiled = {
  errors?: Error[];
  file: string;
};
export type CompileResult = FenceContext & {
  compiled: Compiled;
};


export abstract class Compiler {

  protected log: Log;


  constructor(protected readonly options: CompilerOptions) {
    this.log = Providers.provide(Log).extend(this.constructor.name);
  }


  abstract accepts(fence?: string): boolean;

  abstract compile(context: CompileContext): Promise<CompileResult>;

}


export type WriteSourceCompilerOptions = CompilerOptions & {
  matchFence: RegExp;
}
