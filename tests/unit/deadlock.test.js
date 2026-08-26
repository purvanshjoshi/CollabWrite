const DeadlockDetector = require('../../src/services/DeadlockDetector');
const LockManager = require('../../src/services/LockManager');

describe('Deadlock Detection & Lock Manager Tests', () => {
  describe('DeadlockDetector', () => {
    let detector;

    beforeEach(() => {
      detector = new DeadlockDetector();
    });

    test('no cycle detected for linear wait chain', () => {
      detector.addEdge(1, 2);
      detector.addEdge(2, 3);
      expect(detector.detectCycle(1)).toBe(false);
      expect(detector.hasAnyDeadlock()).toBe(false);
    });

    test('detects direct 2-node circular wait', () => {
      detector.addEdge(1, 2);
      detector.addEdge(2, 1);
      expect(detector.detectCycle(1)).toBe(true);
      expect(detector.detectCycle(2)).toBe(true);
      expect(detector.hasAnyDeadlock()).toBe(true);
    });

    test('detects 3-node circular wait', () => {
      detector.addEdge(1, 2);
      detector.addEdge(2, 3);
      detector.addEdge(3, 1);
      expect(detector.detectCycle(1)).toBe(true);
      expect(detector.hasAnyDeadlock()).toBe(true);
    });

    test('removing edge breaks deadlock', () => {
      detector.addEdge(1, 2);
      detector.addEdge(2, 1);
      detector.removeEdge(2, 1);
      expect(detector.detectCycle(1)).toBe(false);
      expect(detector.hasAnyDeadlock()).toBe(false);
    });
  });

  describe('LockManager', () => {
    let lockManager;

    beforeEach(() => {
      lockManager = new LockManager({ lockTimeoutMs: 1000 });
    });

    test('acquires and releases section lock', () => {
      const res = lockManager.acquireLock(1, 'sec_1', 10);
      expect(res.success).toBe(true);
      expect(res.lockToken).toBeDefined();

      const released = lockManager.releaseLock(1, 'sec_1', res.lockToken);
      expect(released).toBe(true);
    });

    test('blocks second user when section is locked', () => {
      lockManager.acquireLock(1, 'sec_1', 10);
      const res = lockManager.acquireLock(1, 'sec_1', 20);
      expect(res.success).toBe(false);
      expect(res.reason).toBe('locked_by_other_user');
    });
  });
});
