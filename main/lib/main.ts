import globby from 'globby';
import Token from 'markdown-it/lib/token';
import {Compiler, CompileResult} from './compiler';
import {Configuration} from './configure';
import {Context, FileContext, ProjectDetails} from './context';
import {ExecutionContext, ExecutionResult, ExecutorConfig} from './exec';
import {FenceContext, FenceResult, fences, insertFences} from './fence';
import {apppendOutput, readSource, writeOutput} from './files';
import {Md} from './md';
import {Options} from './options';
import {Parser, ParseResult} from './parser';
import {FileRenderer, RenderResult} from './renderer';
import {stripMargin} from './text';
import {Log, Providers} from '@btilford/ts-base';


let _log: Log;


function log(name?: string): Log {
  if (!_log) {
    _log = Providers.provide(Log).extend('main');
  }
  return name ? _log.extend(name) : _log;
}


export type Result = FileContext & {
  parsed?: ParseResult;
  compiled?: CompileResult[];
  executed?: ExecutionResult[];
  rendered?: RenderResult;
  fences?: FenceContext[];
};

export type Results = {
  files: Result[];
};


let md: Md;
let parser: Parser;
let executors: ExecutorConfig[];
let renderer: FileRenderer;
let compilers: Compiler[];
let project: ProjectDetails;
let config: Configuration;


async function processFence(ctx: FenceContext): Promise<FenceResult> {
  const logger = log('processFence()');

  const compiler = compilers.find(c => c.accepts(ctx.fence.name));
  let insert: Token[] | undefined;
  const compiled: CompileResult[] = [];

  let executionContext: ExecutionContext = { ...ctx };
  if (compiler) {
    logger.debug('Compiling %s', ctx.fence.id);
    const compiledFile = await compiler.compile({ ...ctx });
    compiled.push(compiledFile);
    executionContext = { ...compiledFile };
  }

  const exec = executors.find(([exec]) => exec.accept(executionContext));
  if (exec) {
    const [executor, renderer] = exec;
    logger.debug('Executing %s', ctx.fence.id);
    const execution = await executor.execute(executionContext);

    const rendered = renderer.render({
      ...execution,
      file: ctx.file,
    });
    if (rendered) {
      insert = md.parse(rendered);
    }
  }

  return {
    ...ctx,
    insert,
    compiled,
  };

}


async function processFile(file: string, ctx: Context): Promise<Result> {
  const logger = log('processFile()');
  const result: Result = {
    ...ctx,
    file,
  };

  logger.debug('Processing file %s', file);
  const markdown = await readSource(ctx.project, file);

  logger.debug('Parsing file %s', file);
  const parsed = await parser.parse({
    ...ctx,
    file,
    markdown,
  });
  result.parsed = parsed;

  const inserts = await Promise.all(fences(parsed).map(processFence));
  result.fences = inserts;
  result.compiled = inserts.map(i => i.compiled).filter(c => c) as unknown as CompileResult[];

  const copy = insertFences({
    ...parsed,
    inserts,
  });


  logger.debug('Rendering %s', file);
  result.rendered = await renderer.render({
    ...parsed,
    file,
    md,
    tokens: copy,
  });


  return result;
}


type Link = {
  text: string;
  title?: string;
  href: string;

  // description: string;

}
type Nav = {
  file: string;
  link: Link;
  children?: Nav[];

}


export function processNav(results: Result[]): Nav[] {
  const logger = log('processNav()');
  return results.map(file => {
    const render = file.rendered;
    const parsed = file.parsed?.parsed;
    const filePath = file.file;

    const href = config.outputStyle === 'per-file'
                 ? `${filePath}.html`
                 : `#${parsed?.id}`;
    const baseLink = config.outputStyle === 'per-file'
                     ? render?.file
                     : '';
    logger.info('Generating nav for %s, href:%s', filePath, href)

    const fences = file.fences?.sort((left, right) => left.fence.index - right.fence.index);

    return {
      file: file.file,
      link: {
        href,
        text: parsed?.header.title || file.file,
        title: parsed?.header.description,
      },
      children: fences?.map(codeBlock => {
        logger.debug('Generating sub nav entry for %s', codeBlock.fence.id);
        const blockNav: Nav = {
          file: `${codeBlock.file}_${codeBlock.fence.index}`,
          link: {
            href: `${baseLink}#${codeBlock.fence.id}`,
            text: `${codeBlock.fence.name} ${codeBlock.fence.index}`,
            title: undefined,
          },
        };
        if (codeBlock.fence.config) {
          blockNav.link.text = codeBlock.fence.config.title;
          blockNav.link.title = codeBlock.fence.config.description;
        }
        return blockNav;
      }),
    };
  }) as Nav[];
}


function renderNav(nav: Nav[]): string {
  const logger = log('renderNav()');
  logger.debug('Rendering nav...');
  return nav.map((item: Nav) => {
    let result: string;
    if (item.children && item.children.length > 0) {
      result = stripMargin(`
      |<li class="nav__item"><a class="nav__link"
      |       href="${item.link.href}" 
      |       ${item.link.text ? `title="${item.link.title}"` : ''}>${item.link.text}</a>
      |   <div class="nav__sub">
      |     <ol class="nav__list">${renderNav(item.children)}</ol>
      |   </div> 
      |</li>
      `);
    }
    else {
      result = stripMargin(`
      |<li class="nav__item"><a class="md-check__nav-link"
      |       href="${item.link.href}" 
      |       ${item.link.text ? `title="${item.link.title}"` : ''}>${item.link.text}</a> 
      |</li>
      `);
    }
    return result;

  }).join('\n');
}


async function singleFile(index: string, results: Result[]): Promise<RenderResult[]> {
  const logger = log('singleFile()');
  logger.info('Rendering to %d results single file %s', index, results.length);
  return await Promise.all(results.filter(r => r.rendered?.file).map(async result => {
    const file = result.rendered?.file as string;
    try {
      logger.debug('Appending %s to %s', file, index);
      const written = await apppendOutput(project, file, index);
      logger.info('Appended %s to %s', written, index);
      return result;
    }
    catch (error) {
      logger.error('Error appending %s to %s!', file, index, error);
      throw error;
    }
  }));
}


export async function processIndex(results: Results): Promise<Results> {
  const logger = log('processIndex()');
  const files: Result[] = results.files.filter(file => file.rendered);

  files.sort((left, right) => left.file.localeCompare(right.file));
  const navTree = processNav(files);
  logger.debug('NavTree %j', navTree);
  const nav = renderNav(navTree);
  const index = 'index.html';

  logger.debug('Writing index at %s', project.outputPath(index));
  await writeOutput(
    project,
    index,
    stripMargin(`
    |<nav class="md-check__nav">
    | <ol class="nav__list">${nav}</ol>
    |</nav>
    `),
  );

  if (config.outputStyle === 'single-file') {
    await singleFile(index, files);
  }

  return results;
}


export async function main(options: Options): Promise<Results> {
  config = new Configuration(options);
  compilers = config.compilers;
  project = config.project;
  executors = config.executors;
  renderer = config.fileRenderer;

  md = config.md;
  parser = new Parser(md);

  const files = await globby(config.include.patterns, config.include.globby);
  const results: Results = {
    files: [],
  };
  const ctx: Context = {
    project,
  };
  log().info('Matched %d files', files.length);
  log().debug('File list: %o', files);
  for await (const file of files) {
    log().debug('Matched on file %s', file);
    try {
      // const result = await processFile(typeof file === 'string' ? file : file.toString(UTF8), ctx);
      const result = await processFile(file, ctx);
      results.files.push(result);
    }
    catch (error) {
      if (config.failOnerror) {
        throw error;
      }
      else {
        log().warn('Failed processing file %s', file);
      }
    }
  }

  return await processIndex(results);
}

