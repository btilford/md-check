export const UTF8 = 'utf8';

export const MARGIN = /\n\s+\|/mg;


export function stripMargin(src: string): string {
  return src.replace(MARGIN, '\n');
}


export const MARKDOWN_HEADER = /^---\n([\s+-?\s]*\w+:?.+\n|\s*\n)+---\n.*/mg;


export function stripMarkdownHeader(src: string): string {
  return src.replace(MARKDOWN_HEADER, '');

}


export function makeId(...parts: string[]): string {
  return parts.join('_')
              .replace(/((?!:)\W)/g, '-')
              .replace(/--+/g, '-')
              .replace(/^-|-$/g, '');
}


export function stripLeadingAndTrailingSlashes(str: string): string {
  return str.replace(/^\/|\/$/g, '');
}
