import {Configuration} from '../configure';
import {FileContext} from '../context';
import {writeOutput} from '../files';
import {Md} from '../md';
import {ConfigurationSupplier} from '../options';
import {ParseResult} from '../parser';
import {stripMargin} from '../text';

import {Providers, Log} from '@btilford/ts-base';


export type RenderOptions = Configuration & {};

export type RenderContext = ParseResult & {
  md: Md;
}
export type RenderResult = FileContext & {
  file: string;
}


export class FileRenderer {

  protected readonly log: Log;


  constructor(readonly options: RenderOptions) {
    this.log = Providers.provide(Log).extend(this.constructor.name);
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
    this.log.debug('Rendering file %s', ctx.file);
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
    this.log.info('Rendered file to %s', file);
    return {
      ...ctx,
      file,
    };
  }
}



