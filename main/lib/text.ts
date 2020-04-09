export const UTF8 = 'utf8';

export const MARGIN = /\n\s+\|/mg;


export function stripMargin(src: string): string {
  return src.replace(MARGIN, '\n');
}

export const MARKDOWN_HEADER = /^---\n(\w+:.+\n|\s*\n)+---\n.*/mg;


export function stripMarkdownHeader(src: string): string {
  return src.replace(MARKDOWN_HEADER, '');

}
