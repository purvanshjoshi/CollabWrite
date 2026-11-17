# CollabWrite

A real-time collaborative document editor whose concurrency control,
persistence, indexing and crash recovery are implemented from first
principles rather than delegated to a database.

Multiple people edit one document at once. Behind the editor, a request
scheduler queues their edits, a worker pool runs them, two-phase locking
serialises them, a write-ahead log makes them durable, a buffer pool caches
the pages involved, and a B+-Tree indexes the result. Those mechanisms are
the project; the editor is how you watch them work.

```
Tests   190 passing, 14 suites
Engine coverage   93% statements, 78% branches
Demos   7, each asserting its own outcome in CI
```

---

## Why it is built this way

PostgreSQL could provide every one of those guarantees in a few lines of
SQL. That is exactly what `rules.md` forbids: calling `BEGIN` is not
implementing a transaction manager, and a `SELECT ... FOR UPDATE` is not a
lock manager. So the engine owns them, and PostgreSQL is confined to user
accounts, document metadata, permissions and audit logs.

The boundary is enforced, not merely documented: CI queries
`information_schema` after applying the schema and fails the build if a
`document_versions`, `change_logs` or `document_locks` table — or a
`content` column on `documents` — reappears.

---

## Quick start

```bash
git clone https://github.com/purvanshjoshi/CollabWrite.git
cd CollabWrite
npm install
cp .env.example .env     # set JWT_SECRET to a long random value
```

**Without a database** — the in-memory support store is enough to run
everything:

```bash
STORE_DRIVER=memory npm run dev     # API and WebSocket on :3001
npm run client:dev                  # editor on :3000
```

**With PostgreSQL:**

```bash
npm run db:init && npm run db:seed
npm run dev
```

**With Docker:**

```bash
npm run docker:up        # frontend :3000, backend :3001, postgres :5432
```

### See it work

```bash
npm test                 # the whole suite
npm run demo             # all seven evaluation demos
npm run demo:deadlock    # or just one
```

---

## The engine

| Module | OS/DBMS concept | Source |
|--------|-----------------|--------|
| Storage Manager | Page I/O, file organisation, CRC-32 | [`src/engine/storage/`](src/engine/storage/) |
| Buffer Pool | Memory management, LRU, pin counts | [`src/engine/buffer/`](src/engine/buffer/) |
| Transaction Manager | ACID, STEAL/FORCE buffer policy | [`src/engine/transaction/`](src/engine/transaction/) |
| Lock Manager | Two-phase locking, S/X modes, fair queueing | [`src/engine/lock/LockManager.js`](src/engine/lock/LockManager.js) |
| Deadlock Detector | Wait-for graph, Tarjan's SCC | [`src/engine/lock/DeadlockDetector.js`](src/engine/lock/DeadlockDetector.js) |
| Request Scheduler | FIFO and round-robin scheduling | [`src/engine/scheduler/Scheduler.js`](src/engine/scheduler/Scheduler.js) |
| Worker Pool | Threads, bounded concurrency | [`src/engine/scheduler/WorkerPool.js`](src/engine/scheduler/WorkerPool.js) |
| Message Queue | Producer-consumer, FIFO per document | [`src/engine/messaging/`](src/engine/messaging/) |
| Conflict Resolver | Optimistic concurrency control | [`src/engine/conflict/`](src/engine/conflict/) |
| Index Manager | B+-Tree inverted index | [`src/engine/index/`](src/engine/index/) |
| Recovery Manager | Write-ahead logging, REDO/UNDO | [`src/engine/recovery/`](src/engine/recovery/) |

Each is explained in the six-step format — concept, data structures,
algorithm, implementation, test, result — in
**[`docs/engine/README.md`](docs/engine/README.md)**.

### The path of one edit

```
POST /api/documents/7/edit
  -> auth + role check          (an unauthorised edit never takes a lock)
  -> Scheduler queue            (waiting time recorded)
  -> Worker                     (concurrency bounded by the pool)
  -> TransactionManager.begin   (WAL BEGIN)
  -> LockManager                (X locks, ascending page order)
  -> ConflictResolver           (baseVersion vs current -> 409 on a mismatch)
  -> BufferPool                 (hit, or read through the Storage Manager)
  -> WAL.logUpdate              (before- and after-image, BEFORE the page changes)
  -> commit                     (COMMIT fsync'd, pages flushed, locks released)
  -> IndexManager, MessageQueue (after the commit; an abort must not broadcast)
  -> Socket.IO                  (every client on the document)
```

---

## Measured results

From `npm run demo`, not from estimates.

**Index versus full scan**, 150 documents:

| Keyword | Indexed | Full scan | Speed-up |
|---------|---------|-----------|----------|
| `semaphoreinversion` | 0.09 ms | 25.9 ms | 281x |
| `recovery` | 0.13 ms | 27.4 ms | 209x |
| `scheduling` | 0.04 ms | 29.0 ms | 781x |

**Scheduling policies**, 16 requests bursting onto one document while six
others send one each:

| Policy | Mean wait (all) | Mean wait (non-burst documents) |
|--------|-----------------|---------------------------------|
| FIFO | 82 ms | 146 ms |
| Round-robin | 78 ms | 23 ms |

Round-robin redistributes waiting rather than reducing it — total
throughput is unchanged, because the work is.

**Buffer pool**, 4 frames: hit ratio 0.90 when the working set fits, 0.00
for a cyclic scan over 9 pages. The second number is the textbook worst case
for LRU, and the demo shows it rather than hiding it.

**Crash recovery**: commit two edits, write a third transaction, force its
dirty page to disk, kill the process. After restart the committed text is
intact, the uncommitted text is gone, and the recovery report names the
winners, the losers and the page counts.

---

## Honest limitations

| Limitation | Why |
|------------|-----|
| **No Operational Transformation.** Concurrent edits to the same document serialise; a stale edit gets a 409 and the client rebases automatically. | `design.md` section 10. 2PL plus version checks is correct; OT buys convenience, and a subtly wrong OT engine corrupts documents. |
| **Edits to one document do not run in parallel.** An edit locks every page of its document, in ascending order. | An insert near the start shifts every later chunk. The ordering makes the edit path deadlock-free by construction; the cost is intra-document concurrency. |
| **The backend is single-instance.** Two processes on one data directory would corrupt it. | The lock table, buffer pool and WAL writer are in-process. See [`docs/deployment/`](docs/deployment/docker-and-k8s.md) section 1, and
[`google-cloud-vm.md`](docs/deployment/google-cloud-vm.md) to deploy it. |
| **The WAL is never truncated**, so it grows and recovery time grows with it. | `design.md` section 12 lists checkpoint truncation as a future improvement. |
| **Pages are not reclaimed** after a document is deleted. | Reclaiming needs a free-space map, which the design does not specify. An unreferenced chain is inert. |
| **Workers are not OS threads.** | They are explicit objects with an IDLE/BUSY state machine on the event loop. Real threads cannot share the lock table and buffer pool without routing every page through IPC, which would hide the mechanisms this project exists to show. Recorded as a trade-off, not glossed over. |

Further gaps are listed in
[`docs/testing/testing-strategy.md`](docs/testing/testing-strategy.md)
section 8 and
[`docs/security/security-architecture.md`](docs/security/security-architecture.md)
section 6.

---

## Documentation

The authoritative specification is the five documents at the repository
root: [`prd.md`](prd.md), [`architecture.md`](architecture.md),
[`design.md`](design.md), [`phases.md`](phases.md), [`rules.md`](rules.md).

Implementation documentation is indexed in
[`docs/SPECIFICATION.md`](docs/SPECIFICATION.md). The most useful entry
points:

- [Engine modules, six-step explanations](docs/engine/README.md)
- [System architecture](docs/architecture/system-architecture.md)
- [OS/DBMS traceability matrix](docs/architecture/os-dbms-concepts.md)
- [REST API](docs/api/rest-api.md) and [WebSocket protocol](docs/api/websocket-protocol.md)
- [Testing strategy](docs/testing/testing-strategy.md)

---

## Project layout

```
prd.md architecture.md design.md phases.md rules.md   governing specification
src/engine/      the eleven academic modules + Engine.js composition root
src/server/      Express, Socket.IO, controllers, middleware, support stores
src/client/      React editor
database/        PostgreSQL support schema and seed data
scripts/demos/   seven evaluation demos, each asserting its own outcome
tests/           unit, integration and property tests
docs/            implementation documentation
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` / `npm run dev` | Run the API and WebSocket server |
| `npm run client:dev` / `client:build` | React editor |
| `npm test` / `test:coverage` | Full suite, with the coverage gate |
| `npm run test:locks`, `test:recovery`, … | Per-phase test subsets |
| `npm run demo` | All seven evaluation demos |
| `npm run db:init` / `db:seed` | Apply the PostgreSQL schema and seed data |
| `npm run docker:up` / `docker:down` | Full stack |
| `npm run lint` | ESLint over server, client, tests and scripts |

Configuration is documented inline in [`.env.example`](.env.example); every
engine setting maps to a decision recorded in `design.md`.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). `rules.md` applies to every
change: an academic mechanism must be explained in six steps before it is
implemented, and must not be satisfied by calling a library that already
does it.

## License

[MIT](LICENSE)
