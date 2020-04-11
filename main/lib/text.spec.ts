import {stripMargin, stripMarkdownHeader, UTF8} from './text';
import {expect} from 'chai';
import {promises as fs} from 'fs';
import path from 'path';


describe('text specs', () => {
  describe('stripMargin', () => {
    it('should remove margins', () => {
      const original = `
      |Line one
      |Line 2
      `;
      const actual = stripMargin(original);
      expect(actual).not.to.match(/\|/gm);
    })
  });

  describe('stripMarkdownHeader', () => {
    it('should remove the yaml header', async () => {
      const markdown = await fs.readFile(
        path.join(__dirname, '../test/fixtures/markdown-header.md'),
        { encoding: UTF8 },
      );

      const result = stripMarkdownHeader(
        typeof markdown === 'string'
        ? markdown :
        (markdown as Buffer).toString(UTF8)
      );

      expect(result).not.to.match(/---/g);
      expect(result).not.to.match(/title:/g);
      expect(result).not.to.match(/description:/g);
    });
  });
});
