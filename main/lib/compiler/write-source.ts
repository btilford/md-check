import {CountInvocations, TimedAsync} from '@btilford/ts-base';
import {NOT_IN_CI} from '../apm-filter';
import {ConfigurationOptions} from '../configure';
import {writeTemp} from '../files';
import {ConfigurationSupplier} from '../options';
import {checkRestrictions} from '../restrictions';
import {CompileContext, Compiler, CompileResult, WriteSourceCompilerOptions} from './compile';


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


  @CountInvocations()
  @TimedAsync({ filter: NOT_IN_CI })
  async compile(context: CompileContext): Promise<CompileResult> {
    const fileName = `${context.file.replace(/(\.\w+)$/, `_${context.fence.index}$1`)}`;
    this.log.debug('Preparing to write file %s', fileName);
    checkRestrictions(context.fence.code, context, this.options);
    const file = await writeTemp(context.project, fileName, context.fence.code);
    this.log.info('Wrote file %s', file);

    return {
      ...context,
      compiled: { file },
    }
  }

}
