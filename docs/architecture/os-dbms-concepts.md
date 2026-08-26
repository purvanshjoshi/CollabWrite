# Operating Systems & DBMS Concepts in CollabWrite

CollabWrite was engineered not only as a real-time collaborative tool but also as a practical reference implementation uniting core **Operating Systems (OS)** principles and **Database Management Systems (DBMS)** paradigms.

---

## 1. Operating Systems Concepts

| OS Concept | CollabWrite Implementation | Concrete Code / Component |
| :--- | :--- | :--- |
| **Mutual Exclusion (Mutex)** | Serializing concurrent operations per document | `async-lock` in `services/OTEngine.js` |
| **Counting Semaphores** | Limiting active concurrent DB transactions | Connection pool manager (`pg-pool`) |
| **Deadlock Detection** | Wait-For Graph cycle detection using DFS | `services/DeadlockDetector.js` |
| **Deadlock Prevention** | Strict resource ordering for multi-section locks | `services/LockManager.js` |
| **Two-Phase Locking (2PL)** | Strict growing and shrinking phases during multi-lock edits | `services/LockManager.js` |
| **Thread Pool & Async I/O** | Non-blocking event loop offloading DB queries & crypto | Node.js Libuv worker pool |
| **Inter-Process Communication** | WebSocket event streaming and Redis Pub/Sub channels | Socket.io server & Redis adapter |
| **Process Scheduling** | Priority queue for VIP / urgent document synchronizations | Internal task priority scheduler |
| **Write-Ahead Logging (WAL)** | Disk-persisted atomic change log before in-memory state update | `change_logs` table & crash recovery worker |

---

### 1.1 Mutual Exclusion (Mutex)
In collaborative editing, if two worker threads simultaneously read, transform, and write the current document state without synchronization, a **race condition** occurs.

```javascript
// Implementation in services/OTEngine.js
const AsyncLock = require('async-lock');
const lock = new AsyncLock();

async function processOperation(documentId, incomingOp) {
  // Critical section locked on documentId
  return await lock.acquire(`doc:${documentId}`, async () => {
    const currentVersion = await getLatestVersion(documentId);
    const transformedOp = transformAgainstPending(incomingOp, currentVersion);
    await persistOperation(documentId, transformedOp);
    return transformedOp;
  });
}
```

### 1.2 Deadlock Detection (Wait-For Graph)
When users request locks on multiple paragraphs simultaneously, circular waits can occur (User A holds Lock 1, wants Lock 2; User B holds Lock 2, wants Lock 1).

```
   [User A] --(holds)--> [Lock 1] <--(waits for)-- [User B]
      |                                              |
 (waits for)                                      (holds)
      v                                              v
   [Lock 2] <-----------------------------------------
```

CollabWrite builds a dynamic **Wait-For Graph** $G = (V, E)$ where nodes represent active users and directed edges indicate a user waiting for another user to release a lock.

```javascript
// DFS Cycle Detection in services/DeadlockDetector.js
function hasCycle(node, graph, visited, recStack) {
  visited.add(node);
  recStack.add(node);

  for (const neighbor of graph[node] || []) {
    if (!visited.has(neighbor)) {
      if (hasCycle(neighbor, graph, visited, recStack)) return true;
    } else if (recStack.has(neighbor)) {
      return true; // Cycle detected: Deadlock condition
    }
  }

  recStack.delete(node);
  return false;
}
```

---

## 2. Database Management Systems Concepts

| DBMS Concept | CollabWrite Implementation | Concrete Code / Component |
| :--- | :--- | :--- |
| **Atomicity** | Transactional commit of document update + version increment + WAL | `knex.transaction()` / `BEGIN ... COMMIT` |
| **Consistency** | Foreign keys, email format regex, valid enum checks | PostgreSQL DDL in `database/init.sql` |
| **Isolation** | `SERIALIZABLE` and `READ COMMITTED` isolation levels | Explicit transaction isolation configuration |
| **Durability** | PostgreSQL WAL write + periodic snapshotting in `document_versions` | Database write and sync policies |
| **Optimistic Concurrency Control** | Version number checking on REST updates | `WHERE id = $1 AND version = $2` |
| **Pessimistic Concurrency Control** | Exclusive row-level locking for permissions and section edits | `SELECT ... FOR UPDATE` & `document_locks` |
| **B+ Tree Indexing** | Composite indexing on `(document_id, server_version ASC)` | High-throughput range queries |
| **Triggers & Stored Procedures** | Auto-computation of word/character metrics, comment counters | PL/pgSQL triggers in `database/init.sql` |
| **Views** | Multi-table joins for user dashboards and document analytics | `user_accessible_documents`, `document_analytics` |
| **Crash Recovery (REDO Log)** | Replaying unapplied `change_logs` on system startup | `services/RecoveryManager.js` |

---

### 2.1 ACID Transactions
Every document edit must be atomically recorded alongside its version increment and WAL entry:

```sql
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- 1. Insert into Write-Ahead Log
INSERT INTO change_logs (document_id, user_id, operation_type, position, content, client_version, server_version)
VALUES (10, 5, 'insert', 12, 'Hello', 3, 4);

-- 2. Update document content & version atomically
UPDATE documents 
SET content = '... updated text ...', 
    version = 4, 
    last_modified_by = 5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 10 AND version = 3;

-- 3. Trigger auto-updates character_count and word_count

COMMIT;
```

### 2.2 Crash Recovery via WAL
If the application server or database crashes abruptly during operation, CollabWrite initiates the crash recovery routine upon startup:

```
[System Startup]
       |
       v
Check latest document version snapshot in `document_versions`
       |
       v
Query `change_logs` for all operations where `server_version > snapshot.version`
       |
       v
Sequentially replay (REDO) operations in ascending order of `server_version`
       |
       v
Verify checksum and update `documents` table to current consistent state
```
