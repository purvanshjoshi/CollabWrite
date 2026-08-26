const OTEngine = require('../../src/services/OTEngine');

describe('Operational Transformation (OT) Unit Tests', () => {
  describe('apply()', () => {
    test('applies insert operation correctly', () => {
      const initial = 'Hello World';
      const op = { type: 'insert', position: 5, content: ' Beautiful' };
      expect(OTEngine.apply(initial, op)).toBe('Hello Beautiful World');
    });

    test('applies delete operation correctly', () => {
      const initial = 'Hello Beautiful World';
      const op = { type: 'delete', position: 5, length: 10 };
      expect(OTEngine.apply(initial, op)).toBe('Hello World');
    });
  });

  describe('transform() Insert vs Insert', () => {
    test('op1 before op2 shifts op2 position', () => {
      const op1 = { type: 'insert', position: 0, content: 'A', userId: 1 };
      const op2 = { type: 'insert', position: 5, content: 'B', userId: 2 };

      const [op1Prime, op2Prime] = OTEngine.transform(op1, op2);
      expect(op1Prime.position).toBe(0);
      expect(op2Prime.position).toBe(6);
    });

    test('same position tie-breaks by userId deterministically', () => {
      const op1 = { type: 'insert', position: 0, content: 'A', userId: 1 };
      const op2 = { type: 'insert', position: 0, content: 'B', userId: 2 };

      const [op1Prime, op2Prime] = OTEngine.transform(op1, op2);
      expect(op1Prime.position).toBe(0);
      expect(op2Prime.position).toBe(1);

      // Verify convergence: apply(apply(S, op1), op2') === apply(apply(S, op2), op1')
      const base = 'Initial';
      const path1 = OTEngine.apply(OTEngine.apply(base, op1), op2Prime);
      const path2 = OTEngine.apply(OTEngine.apply(base, op2), op1Prime);
      expect(path1).toBe(path2);
    });
  });

  describe('transform() Insert vs Delete', () => {
    test('insert before delete shifts delete position', () => {
      const op1 = { type: 'insert', position: 2, content: 'XYZ' };
      const op2 = { type: 'delete', position: 5, length: 3 };

      const [op1Prime, op2Prime] = OTEngine.transform(op1, op2);
      expect(op1Prime.position).toBe(2);
      expect(op2Prime.position).toBe(8);
    });

    test('insert after delete shifts insert position', () => {
      const op1 = { type: 'insert', position: 10, content: 'XYZ' };
      const op2 = { type: 'delete', position: 2, length: 4 };

      const [op1Prime, op2Prime] = OTEngine.transform(op1, op2);
      expect(op1Prime.position).toBe(6);
      expect(op2Prime.position).toBe(2);
    });
  });

  describe('transform() Delete vs Delete', () => {
    test('disjoint deletes adjust later position', () => {
      const op1 = { type: 'delete', position: 0, length: 3 };
      const op2 = { type: 'delete', position: 6, length: 2 };

      const [op1Prime, op2Prime] = OTEngine.transform(op1, op2);
      expect(op1Prime.position).toBe(0);
      expect(op2Prime.position).toBe(3);
    });
  });

  describe('transformCursor()', () => {
    test('shifts cursor when remote insertion occurs before cursor', () => {
      const remoteOp = { type: 'insert', position: 2, content: 'ABC' };
      expect(OTEngine.transformCursor(5, remoteOp)).toBe(8);
    });

    test('does not shift cursor when remote insertion occurs after cursor', () => {
      const remoteOp = { type: 'insert', position: 10, content: 'ABC' };
      expect(OTEngine.transformCursor(5, remoteOp)).toBe(5);
    });
  });
});
