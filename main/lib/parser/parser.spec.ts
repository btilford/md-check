import {ProjectDetails} from '../context';
import {Md} from '../md';
import {Parser, ParseResult} from './parser';
import {expect} from 'chai';
import {stripMargin} from '../text';
import {bootstrap, CONSOLE_APM} from '@btilford/ts-base';


describe('Parser Specs', function () {
  const suite = this;
  let project: ProjectDetails;
  let parser: Parser;
  before(() => {
    bootstrap({
      appName: suite.title,
      apm: CONSOLE_APM,
    });
  });
  beforeEach(() => {
    project = new ProjectDetails({
      name: suite.title || 'suite',
    });
    parser = new Parser(new Md());
  });

  describe('With defaults', () => {
    const section = this;

    let actual: ParseResult;
    beforeEach(async () => {
      const markdown = stripMargin(`---
      |title: ${suite.title}
      |env:
      | - NODE_ENV: production
      |---
      |
      |# Heading 1
      |
      |\`\`\`javascript
      |
      |console.log('${section.title}');
      
      \`\`\`
      `);

      actual = await parser.parse({
        file: section.title,
        markdown,
        project,
      });
    });

    it('parsed the header', () => {
      expect(actual.parsed.header).not.to.be.undefined;
    });
    it('parsed the header title', () => {
      expect(actual.parsed.header.title).to.eq(suite.title);
    });
    it('returned some tokens', () => {
      expect(actual.parsed.tokens).to.have.length.gt(0);
    });

  });
});
