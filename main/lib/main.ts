import globby from 'globby';
import Token from 'markdown-it/lib/token';
import {Compiler, CompileResult} from './compile';
import {Configuration} from './configure';
import {Context, FileContext, ProjectDetails} from './context';
import {ExecutionResult, ExecutorConfig, ForkExecutor} from './exec';
import {FenceContext, FenceResult, fences, insertFences} from './fence';
import {apppendOutput, readSource, writeOutput} from './files';
import {Md} from './md';
import {Options} from './options';
import {Parser, ParseResult} from './parser';
import {FileRenderer, RenderResult} from './renderer';
import {stripMargin, UTF8} from './text';


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

  const compiler = compilers.find(c => c.accepts(ctx.fence.name));
  let insert: Token[] | undefined;
  let compiled: CompileResult[] = [];

  if (compiler) {
    console.debug('Compiling %s', ctx.fence.id);
    const compiledFile = await compiler.compile({ ...ctx });
    compiled.push(compiledFile);

    const exec = executors.find(([exec]) => exec.accept(ctx.fence.name));
    if (exec) {
      const [executor, renderer] = exec;
      console.debug('Executing %s', compiledFile.file);
      const execution = await executor.execute({ ...ctx, file: compiledFile.file });

      const rendered = renderer.render({
        ...execution,
      });
      if (rendered) {
        insert = md.parse(rendered);
      }
    }
  }


  return {
    ...ctx,
    insert,
    compiled,
  };

}


async function processFile(file: string, ctx: Context): Promise<Result> {
  const result: Result = {
    ...ctx,
    file,
  };

  console.debug('Processing file %s', file);
  const markdown = await readSource(ctx.project, file);

  console.debug('Parsing file %s', file);
  const parsed = await parser.parse({
    ...ctx,
    file,
    markdown,
  });
  result.parsed = parsed;

  const inserts = await Promise.all(fences(parsed).map(processFence));
  result.compiled = inserts.map(i => i.compiled).filter(c => c) as unknown as CompileResult[];

  const copy = insertFences({
    ...parsed,
    inserts,
  });


  console.debug('Rendering %s', file);
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
  return results.map(file => {
    const render = file.rendered;
    const parsed = file.parsed?.parsed;

    const href = config.outputStyle === 'per-file' ? render?.file : `#${parsed?.id}`;
    const baseLink = config.outputStyle === 'per-file' ? render?.file : '';
    const fences = file.fences?.sort((left, right) => left.fence.index - right.fence.index);

    return {
      file: file.file,
      link: {
        href,
        text: parsed?.header.title || file.file,
        title: parsed?.header.description,
      },
      children: fences?.map(fence => {
        return {
          file: `${fence.file}_${fence.fence.index}`,
          href: `${baseLink}#${fence.fence.id}`,
          text: `Example ${fence.fence.index}`,
          title: fence.fence.name,
        };
      }),
    };
  }) as Nav[];
}


function renderNav(nav: Nav[]): string {
  return nav.reduce((out, item: Nav) => {
    let result: string;
    if (item.children) {
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

  }, '');
}


async function singleFile(index: string, results: Result[]): Promise<RenderResult[]> {
  return await Promise.all(results.filter(r => r.rendered?.file).map(async result => {
    const file = result.rendered?.file as string;
    console.debug('Appending %s to %s', file, index);
    const written = await apppendOutput(project, file, index);
    console.log('Appended %s to %s', written, index);
    return result;
  }));
}


export async function processIndex(results: Results): Promise<Results> {
  const files: Result[] = results.files.filter(file => file.rendered);

  files.sort((left, right) => left.file.localeCompare(right.file));
  const navTree = processNav(files);
  console.dir(navTree, { colors: true });
  const nav = renderNav(navTree);
  const index = 'index.html';

  console.debug('Writing index at %s', index);
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
  project = new ProjectDetails(config.project);
  executors = config.executors || [new ForkExecutor({ ...config, cmd: 'node', matchFence: /node$/ })];
  renderer = config.fileRenderer || new FileRenderer({ ...config });

  md = config.md;
  parser = new Parser(md);

  const files = globby.stream(options.include.patterns, config.include.globby);
  const results: Results = {
    files: [],
  };
  const ctx: Context = {
    project,
  };
  for await (const file of files) {
    try {
      const result = await processFile(typeof file === 'string' ? file : file.toString(UTF8), ctx);
      results.files.push(result);
    }
    catch (error) {
      if (config.failOnerror) {
        throw error;
      }
      else {
        console.warn('Failed processing file %s', file);
      }
    }
  }

  return await processIndex(results);
}

