import escapeHTML from 'escape-html';
import {Options} from '../options';
import {stripMargin} from '../text';
import {ExecutionResult} from './executor';


export type ExecutionRendererOptions = Options & {}

export type ExecutionRenderContext = ExecutionResult & {}


export abstract class ExecutionRenderer {
  constructor(readonly options: ExecutionRendererOptions) {}


  abstract render(execution: ExecutionRenderContext): string | undefined;

}


function renderLine(line) {
  // @formatter:off
  return `<span class="hljs-meta">&gt;&nbsp;</span><span class="hljs-bash shell"><span class="hljs-string stderr">${escapeHTML(line)}</span></span>`;
  // @formatter:on
}


export class StdOutRenderer extends ExecutionRenderer {

  html(out: string, type: 'stderr' | 'stdout'): string {
    const lines = out.split('\n')
                     .map(renderLine)
                     .join('\n');

    return stripMargin(`
          |   <em>${type}&nbsp;&gt;</em><br>
          |   <pre><code class="execution__code-block language-shell">${lines}</code></pre>
    `);
  }


  render(ctx: ExecutionRenderContext): string | undefined {
    let html: string | undefined;
    const out = [
      (ctx.stdout ? this.html(ctx.stdout, 'stdout') : false),
      (ctx.stderr ? this.html(ctx.stderr, 'stderr') : false),
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
