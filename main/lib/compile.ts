import {FileContext} from './context';
import {FenceContext} from './fence';
import {writeTemp} from './files';


export type CompilerOptions = {
  [name: string]: any;
};

export type CompileContext = FenceContext & {}

export type CompileResult = FileContext & {
  errors?: Error[];
};


export abstract class Compiler {

  constructor(readonly options: CompilerOptions) {
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


  accepts(fence?: string): boolean {
    return fence ? this.options.matchFence.test(fence) : false;
  }


  async compile(context: CompileContext): Promise<CompileResult> {
    const file = await writeTemp(context.project, context.file, context.fence.code);

    return {
      ...context,
      file,
    }
  }

}
