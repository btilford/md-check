import {
  CompileContext,
  Compiler,
  CompileResult,
  CompilerOptions,
  UTF8,
  writeTemp,
  ConfigurationSupplier,
  ConfigurationOptions,
} from '@btilford/md-check';
import fs from 'fs';
import path from 'path';
import {
  CompilerOptions as TypescriptCompilerOptions,
  ModuleKind,
  ScriptTarget,
  Diagnostic,
} from 'typescript';
import ts from 'typescript';


export type TsCompilerOptions = CompilerOptions & {
  tsConfig: string | TypescriptCompilerOptions;
}

export type TsCompileResult = CompileResult & {
  // diagnostics?: {
  //   messages?: string[]
  // },

}


export class TypescriptError extends Error {

  constructor(message: string, ...diagnostics: Diagnostic[]) {
    super(message);
  }
}


function loadTsConfig(tsConfigPath: string): TypescriptCompilerOptions {
  const jsonConfig = fs.readFileSync(tsConfigPath, { encoding: UTF8 });
  const tsConfig = JSON.parse(
    typeof jsonConfig === 'string'
    ? jsonConfig
    : (jsonConfig as Buffer).toString(UTF8),
  );

  let compilerOptions: TypescriptCompilerOptions;
  if (tsConfig.extends) {
    const parentPath = path.join(tsConfigPath, '../', `${tsConfig.extends}.json`);
    const parentCompilerOptions = loadTsConfig(parentPath);
    compilerOptions = {
      ...parentCompilerOptions,
      ...tsConfig.compilerOptions,
    };
  }
  else {
    compilerOptions = tsConfig.compilerOptions;
  }
  return compilerOptions;
}


export class TsCompiler extends Compiler {

  readonly compilerOptions: TypescriptCompilerOptions;


  static supply(tsConfig: string | TypescriptCompilerOptions = 'tsconfig.json'): ConfigurationSupplier<TsCompiler> {
    return function makeTsCompiler(config: ConfigurationOptions) {
      return new TsCompiler({
        ...config,
        tsConfig,
      });
    };
  }


  constructor(options: TsCompilerOptions) {
    super(options);
    let compilerOptions: TypescriptCompilerOptions;
    if (typeof options.tsConfig === 'string') {
      const tsConfigPath = this.options.project.absolutePath(options.tsConfig);
      compilerOptions = loadTsConfig(tsConfigPath);
    }
    else {
      compilerOptions = options.tsConfig;
    }
    this.compilerOptions = {
      ...compilerOptions,
      outDir: options.project.tempDir,
      declaration: true,
      declarationDir: options.project.tempDir,
      declarationMap: true,
      target: ScriptTarget.ES2015,
      module: ModuleKind.CommonJS,
      moduleResolution: undefined,
      paths: { [this.options.project.name]: [this.options.project.cwd] },
    }
  }


  accepts(fence: string): boolean {
    return /^typescript/.test(fence);
  }


  async compile(context: CompileContext): Promise<TsCompileResult> {
    const tmpTs = await writeTemp(this.options.project, `${context.file}_${context.fence.index}.ts`, context.fence.code);
    const fileName = path.basename(tmpTs);
    const compileDir = tmpTs.replace(fileName, '');

    const program = ts.createProgram([tmpTs], {
      ...this.compilerOptions,
      outDir: compileDir,
      declarationDir: compileDir,
    });
    const emit = program.emit();
    const errors: Error[] = [];

    // const diag = ts.getPreEmitDiagnostics(program).concat(emit.diagnostics);


    if (emit.emitSkipped) {
      // TODO errors
      const msg = `Error compiling typescript on ${tmpTs} in file ${context.file}`;

      if (this.options.failOnerror) {
        throw new TypescriptError(
          msg,
          ...emit.diagnostics.map((diag: Diagnostic) => {
            return diag;
          }),
        );
      }
      else {
        emit.diagnostics.forEach(diag => errors.push(new TypescriptError(`${msg}: ${diag.messageText}`, diag)));
      }
    }

    const result: TsCompileResult = {
      ...context,
      file: tmpTs.replace(/\.ts$/, '.js'),
    };
    if (errors.length > 0) {
      result.errors = errors;
    }
    return result;
  }

}
