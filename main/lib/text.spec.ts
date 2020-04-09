import {stripMargin} from './text';
import {expect} from 'chai';


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
});
