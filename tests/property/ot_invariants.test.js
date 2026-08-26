const OTEngine = require('../../src/services/OTEngine');

describe('OT Invariant Property-Based Tests (TP1)', () => {
  function generateRandomOp(baseText, userId) {
    const isInsert = Math.random() > 0.5 || baseText.length === 0;
    if (isInsert) {
      const pos = Math.floor(Math.random() * (baseText.length + 1));
      const chars = 'abcdefghijklmnopqrstuvwxyz ';
      const content = chars.charAt(Math.floor(Math.random() * chars.length));
      return { type: 'insert', position: pos, content, userId };
    } else {
      const pos = Math.floor(Math.random() * baseText.length);
      const maxLen = baseText.length - pos;
      const len = Math.max(1, Math.floor(Math.random() * Math.min(3, maxLen)));
      return { type: 'delete', position: pos, length: len, userId };
    }
  }

  test('TP1 convergence across 100 randomized operation pairs', () => {
    let base = 'The quick brown fox jumps over the lazy dog';

    for (let i = 0; i < 100; i++) {
      const op1 = generateRandomOp(base, 1);
      const op2 = generateRandomOp(base, 2);

      const [op1Prime, op2Prime] = OTEngine.transform(op1, op2);

      const path1 = OTEngine.apply(OTEngine.apply(base, op1), op2Prime);
      const path2 = OTEngine.apply(OTEngine.apply(base, op2), op1Prime);

      expect(path1).toBe(path2);
    }
  });
});
