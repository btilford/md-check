import {ConfigurationOptions} from './configure';
import {FileContext} from './context';
import {FenceContext} from './fence';
import {writeTemp} from './files';
import {ConfigurationSupplier} from './options';


export type CompilerOptions = ConfigurationOptions & {
  [name: string]: any;
};

export type CompileContext = FenceContext & {}

export type CompileResult = FileContext & {
  errors?: Error[];
};


export abstract class Compiler {

  constructor(protected readonly options: CompilerOptions) {
  }


  abstract accepts(fence?: string): boolean;


  abstract compile(context: CompileContext): Promise<CompileResult>;

}


export type WriteSourceCompilerOptions = CompilerOptions & {
  matchFence: RegExp;
}


export class WriteSourceCompiler extends Compiler {

  constructor(options: WriteSourceCompilerOptions) {
    super(options);
  }


  static supply(matchFence: RegExp): ConfigurationSupplier<Compiler> {
    return function makeWriteSourceCompiler(config: ConfigurationOptions) {
      return new WriteSourceCompiler({
        ...config,
        matchFence,
      });
    }
  }


  accepts(fence?: string): boolean {
    return fence ? this.options.matchFence.test(fence) : false;
  }


  async compile(context: CompileContext): Promise<CompileResult> {
    const file = await writeTemp(context.project, context.file, context.fence.code);
    console.debug('Code %s written to to %s', context.fence.id, file);
    return {
      ...context,
      file,
    }
  }

}
