import {Configuration} from '../configure';
import {FileContext} from '../context';
import {writeOutput} from '../files';
import {Md} from '../md';
import {ConfigurationSupplier} from '../options';
import {ParseResult} from '../parser';
import {stripMargin} from '../text';


export type RenderOptions = Configuration & {};

export type RenderContext = ParseResult & {
  md: Md;
}
export type RenderResult = FileContext & {
  file: string;
}


export class FileRenderer {

  constructor(readonly options: RenderOptions) {
  }


  static supply(): ConfigurationSupplier<FileRenderer> {
    return function makeFileRenderer(config: Configuration) {
      return new FileRenderer(config);
    }
  }


  header(ctx: RenderContext): string {
    let result = '';
    const header = ctx.parsed.header;
    if (header && header.title) {
      result = stripMargin(`
      |<a href="#${ctx.parsed.id}" 
      |     class="file__permalink"
      |     ${header.description ? `title="${header.description}"` : ''}
      |     rel="instructions">
      |   <h2 class="file__heading">${header.title}</h2>
      |</a>`);
    }
    return result;
  }


  async render(ctx: RenderContext): Promise<RenderResult> {
    const content = ctx.md.render(ctx.tokens);
    const html = stripMargin(`
      |<section id="${ctx.parsed.id}" class="md-check__file">
      |   ${this.header(ctx)}
      |   <div class="file__content">
      |     ${content}
      |   </div>
      |</section>
    `);

    const file = await writeOutput(ctx.project, `${ctx.file}.html`, html);
    return {
      ...ctx,
      file,
    };
  }
}



