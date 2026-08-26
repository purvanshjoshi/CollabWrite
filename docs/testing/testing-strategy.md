# Testing & Verification Strategy

CollabWrite enforces a multi-layered verification strategy combining deterministic unit tests, property-based algebraic invariant testing, and multi-user concurrency stress simulations.

---

## 1. Testing Pyramid

```
        / \
       /   \        Chaos & Crash Recovery Tests
      /     \       - Abrupt SIGKILL during active edit stream
     /       \      - Reconnection catch-up & WAL REDO replay
    /---------\
   /           \    Concurrency Stress & Deadlock Fuzzing
  /             \   - 50 virtual clients emitting simultaneous ops
 /               \  - Circular lock request permutations
/-----------------\
/                   \  OT Property Tests (TP1 & TP2 Invariants)
/                     \ - Random permutation fuzzing over character grids
/-----------------------\
/                         \  Deterministic Unit & API Integration Tests
/                           \ - REST status codes, JWT validation, SQL triggers
+---------------------------+
```

---

## 2. OT Property-Based & Fuzz Testing

Operational Transformation implementations must satisfy TP1 regardless of operation generation order.

```javascript
// Test Harness: tests/property/ot_invariants.test.js
describe('OT TP1 Invariant Property Test', () => {
  test('Convergence under random operation permutations', () => {
    const baseText = "The quick brown fox jumps over the lazy dog";
    
    // Generate 1000 random operation pairs (O1, O2)
    for (let i = 0; i < 1000; i++) {
      const op1 = generateRandomOp(baseText, 1);
      const op2 = generateRandomOp(baseText, 2);

      const [op1Prime, op2Prime] = OTEngine.transform(op1, op2);

      const state1 = apply(apply(baseText, op1), op2Prime);
      const state2 = apply(apply(baseText, op2), op1Prime);

      // TP1 Assertion: Both paths MUST produce identical strings
      expect(state1).toEqual(state2);
    }
  });
});
```

---

## 3. Concurrency & Deadlock Stress Test

```javascript
// Test Harness: tests/stress/deadlock_simulation.test.js
describe('Lock Manager Deadlock Cycle Detection', () => {
  test('Prevents circular wait under high contention', async () => {
    const detector = new DeadlockDetector();
    
    // Simulate circular graph: User 1 -> 2 -> 3 -> 1
    detector.addEdge(1, 2);
    detector.addEdge(2, 3);
    
    expect(detector.detectCycle(1)).toBe(false);
    
    // Adding closing edge must trigger cycle detection
    detector.addEdge(3, 1);
    expect(detector.detectCycle(3)).toBe(true);
  });
});
```

---

## 4. Crash Recovery (WAL Verification)

1. Connect 10 simulated clients continuously sending insert operations.
2. Abruptly kill the Node.js server with `process.exit(137)`.
3. Restart server and trigger `services/RecoveryManager.js`.
4. Assert: Final recovered document text in `documents` matches the serial execution of all entries in `change_logs`.
