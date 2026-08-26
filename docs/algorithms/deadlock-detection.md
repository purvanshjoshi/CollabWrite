# Deadlock Detection & Concurrency Control

## 1. Concurrency Model: Two-Phase Locking (2PL)

CollabWrite uses **Two-Phase Locking (2PL)** for critical section modifications, such as multi-paragraph locks, document-level permission restructuring, and administrative deletion.

```
       [Lock Acquisition Phase]              [Lock Release Phase]
            (Growing Phase)                    (Shrinking Phase)
   
  Lock Count ^
             |        /---------\
             |       /           \
             |      /             \
             |     /               \
             +----------------------------> Time
```

1. **Growing Phase:** A transaction may acquire locks on sections or documents, but cannot release any.
2. **Shrinking Phase:** Once the transaction releases its first lock, it cannot acquire any new locks.

---

## 2. Wait-For Graph & Cycle Detection

### 2.1 Graph Representation
- **Vertices ($V$):** Active transactions / user sessions requesting locks.
- **Edges ($E$):** Directed edge $U_A \to U_B$ exists if User A is waiting for a lock held exclusively by User B.

### 2.2 Deadlock Scenario
```
Timeline:
  t0: User A acquires WriteLock(Section 1)
  t1: User B acquires WriteLock(Section 2)
  t2: User A requests WriteLock(Section 2) -> BLOCKED (Edge: A -> B)
  t3: User B requests WriteLock(Section 1) -> BLOCKED (Edge: B -> A)
  
Resulting Graph:
  (User A) <=======> (User B)  [CYCLE DETECTED: A -> B -> A]
```

### 2.3 Tarjan's / DFS Cycle Detection Implementation

```javascript
class DeadlockDetector {
  constructor() {
    this.waitForGraph = new Map(); // userId -> Set<userId>
  }

  addEdge(waitingUser, holdingUser) {
    if (!this.waitForGraph.has(waitingUser)) {
      this.waitForGraph.set(waitingUser, new Set());
    }
    this.waitForGraph.get(waitingUser).add(holdingUser);
  }

  removeEdge(waitingUser, holdingUser) {
    if (this.waitForGraph.has(waitingUser)) {
      this.waitForGraph.get(waitingUser).delete(holdingUser);
    }
  }

  /**
   * Checks if adding an edge creates a directed cycle.
   * @param {number} startUser
   * @returns {boolean} True if cycle detected (deadlock)
   */
  detectCycle(startUser) {
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (node) => {
      visited.add(node);
      recursionStack.add(node);

      const neighbors = this.waitForGraph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true; // Cycle discovered
        }
      }

      recursionStack.delete(node);
      return false;
    };

    return dfs(startUser);
  }
}
```

---

## 3. Deadlock Resolution Strategies

When a deadlock is detected, the Lock Manager executes one of three resolution policies:

1. **Youngest Transaction Abort (Default):** The transaction that initiated the most recent lock request is selected as the victim, rolled back, and notified via WebSocket (`lock:denied`).
2. **Priority-Based Resolution:** Admin or owner transactions have higher priority; lower-priority transactions are preempted.
3. **Lock Expiration / Leases:** Every lock has an immutable expiration (`expires_at = CURRENT_TIMESTAMP + 30s`). Even if a process dies abruptly, background workers release expired locks automatically.
