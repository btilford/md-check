import escapeHTML from 'escape-html';
import {Configuration} from '../configure';
import {ConfigurationSupplier} from '../options';
import {stripMargin} from '../text';
import {ExecutionResult} from './executor';


export type OutputStream = 'stderr' | 'stdout';

export type ExecutionRendererOptions = Configuration & {}

export type ExecutionRenderContext = ExecutionResult & {}


export abstract class ExecutionRenderer {
  constructor(readonly options: ExecutionRendererOptions) {}


  abstract render(execution: ExecutionRenderContext): string | undefined;

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
