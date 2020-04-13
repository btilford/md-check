import escapeHTML from 'escape-html';
import {NOT_IN_CI} from '../apm-filter';
import {Configuration, ConfigurationOptions} from '../configure';
import {ConfigurationSupplier} from '../options';
import {stripMargin} from '../text';
import {ExecutionResult} from './executor';

import {Timed, CountInvocations, Providers, Log} from '@btilford/ts-base';


export type OutputStream = 'stderr' | 'stdout';

export type ExecutionRendererOptions = ConfigurationOptions & {}

export type ExecutionRenderContext = ExecutionResult & {}


export abstract class ExecutionRenderer {
  protected readonly log: Log;


  constructor(readonly options: ExecutionRendererOptions) {
    this.log = Providers.provide(Log).extend(this.constructor.name);
  }


  abstract render(execution: ExecutionRenderContext): string | undefined;

}


export class NoOpExecutionRenderer extends ExecutionRenderer {
  static supply(): ConfigurationSupplier<NoOpExecutionRenderer> {
    return function (config: ConfigurationOptions) {
      return new NoOpExecutionRenderer(config);
    }
  }


  @Timed({ filter: NOT_IN_CI })
  @CountInvocations()
  render(execution: ExecutionRenderContext): string | undefined {
    this.log.debug('Skipping render of %s results', execution.file);
    return undefined;
  }

}


function renderLine(line, stream: OutputStream) {
  // @formatter:off
  return `<span class="hljs-meta">&gt;&nbsp;</span><span class="hljs-bash shell"><span class="hljs-string ${stream}">${escapeHTML(line)}</span></span>`;
  // @formatter:on
}


export class StdOutRenderer extends ExecutionRenderer {

  static supply(): ConfigurationSupplier<ExecutionRenderer> {
    return function makeExecutionRenderer(config: Configuration) {
      return new StdOutRenderer(config);
    }
  }


  html(out: string, type: OutputStream): string {
    const lines = out.split('\n')
                     .map(line => renderLine(line, type))
                     .join('\n');

    return stripMargin(`
          |   <em>${type}&nbsp;&gt;</em><br>
          |   <pre><code class="execution__code-block language-shell">${lines}</code></pre>
    `);
  }


  render(ctx: ExecutionRenderContext): string | undefined {
    this.log.debug('Rendering execution results for %s', ctx.fence.id);
    let html: string | undefined;
    const out = [
      (ctx.execution.stdout ? this.html(ctx.execution.stdout.trim(), 'stdout') : false),
      (ctx.execution.stderr ? this.html(ctx.execution.stderr.trim(), 'stderr') : false),
    ].filter(it => it).join('\n');


    if (out) {
      html = stripMargin(`
        |<div id="exec_${ctx.file}_${ctx.fence.index}_out" class="execution__output">
        |   ${out}
        |</div>
      `);
    }
    return html;
  }

}
