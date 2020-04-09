export const UTF8 = 'utf8';

export const MARGIN = /\n\s+\|/mg;


export function stripMargin(src: string): string {
  return src.replace(MARGIN, '\n');
}


export const MARKDOWN_HEADER = /^---\n(\w+:.+\n|\s*\n)+---\n.*/mg;


export function stripMarkdownHeader(src: string): string {
  return src.replace(MARKDOWN_HEADER, '');

}


export function makeId(...parts: string[]): string {
  return parts.join('_')
              .replace(/((?!:)\W)/g, '_')
              .replace(/__+/g, '_')
              .replace(/^_|_$/g, '');
}


export function stripLeadingAndTrailingSlashes(str: string): string {
  return str.replace(/^\/|\/$/g, '');
}
