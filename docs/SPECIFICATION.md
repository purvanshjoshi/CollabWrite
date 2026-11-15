# CollabWrite - Master Specification Index

**Version:** 2.0.0
**Subject:** Real-time collaborative document editor built on a custom
OS/DBMS educational engine

---

## How this documentation is organised

The authoritative specification lives in **five governing documents at the
repository root**. They were approved as Phase 0 of the project and
everything else must conform to them (`rules.md` section 7).

| Document | Role |
|----------|------|
| [`../prd.md`](../prd.md) | Requirements, academic objectives, success criteria, evaluation plan, traceability matrix |
| [`../architecture.md`](../architecture.md) | Four-layer architecture, module responsibilities, data flow, failure behaviour |
| [`../design.md`](../design.md) | Data structures, algorithms and per-module design decisions |
| [`../phases.md`](../phases.md) | Phase 0-12 delivery plan and dependency order |
| [`../rules.md`](../rules.md) | Development rules governing how academic concepts must be implemented |

This file is an **index**, not a summary. An earlier version restated the
other documents in full, which meant that fixing a design decision required
editing it in two places, and the copies drifted. Pointing at a single
source of truth per topic is the correction.

---

## Implementation documentation

### Start here

| Document | Covers |
|----------|--------|
| [`engine/README.md`](engine/README.md) | **The six-step explanation** (`rules.md` section 3) for all eleven engine modules: concept, data structures, algorithm, implementation, test, result |
| [`architecture/system-architecture.md`](architecture/system-architecture.md) | How the four layers map to code, the life of an edit, document layout, the locking policy for edits |
| [`architecture/os-dbms-concepts.md`](architecture/os-dbms-concepts.md) | Traceability matrix: concept to code to test to demo |

### Algorithms

| Document | Covers |
|----------|--------|
| [`algorithms/deadlock-detection.md`](algorithms/deadlock-detection.md) | Two-phase locking, lock table, wait-for graph, Tarjan's SCC, victim selection |
| [`algorithms/recovery-and-wal.md`](algorithms/recovery-and-wal.md) | Write-ahead logging, STEAL/FORCE, three-pass REDO/UNDO recovery, torn writes |
| [`algorithms/bplus-tree-indexing.md`](algorithms/bplus-tree-indexing.md) | B+-Tree structure, occupancy bounds, split/borrow/merge, persistence, measured speed-up |
| [`algorithms/conflict-resolution.md`](algorithms/conflict-resolution.md) | Optimistic version checks, disjoint-edit merging, and why OT is out of scope |

### Interfaces and data

| Document | Covers |
|----------|--------|
| [`api/rest-api.md`](api/rest-api.md) | Every HTTP endpoint, error codes, retry semantics |
| [`api/websocket-protocol.md`](api/websocket-protocol.md) | Socket.IO events, ordering guarantees, client reconciliation |
| [`architecture/database-schema.md`](architecture/database-schema.md) | The PostgreSQL boundary, the four support tables, the three engine files |

### Process and operations

| Document | Covers |
|----------|--------|
| [`testing/testing-strategy.md`](testing/testing-strategy.md) | Test layers, property testing, coverage, and known gaps |
| [`workflows/user-workflows.md`](workflows/user-workflows.md) | End-to-end walkthroughs from registration to crash recovery |
| [`deployment/docker-and-k8s.md`](deployment/docker-and-k8s.md) | Why the backend is single-instance, Docker, Kubernetes, Render and Vercel, backups |
| [`monitoring/monitoring-and-maintenance.md`](monitoring/monitoring-and-maintenance.md) | The six evaluation metrics, health checks, tuning, troubleshooting |
| [`security/security-architecture.md`](security/security-architecture.md) | Authentication, RBAC, input handling, and what is deliberately not implemented |

---

## What the system is, in one page

A web-based collaborative editor whose concurrency, persistence, indexing
and recovery are implemented from first principles rather than delegated to
a database.

```
React editor  ->  Express + Socket.IO  ->  Academic Engine  ->  file storage
                                              |
                        Scheduler -> Worker Pool -> Transaction Manager
                          -> Lock Manager + Deadlock Detector
                          -> Conflict Resolver
                          -> Buffer Pool -> Storage Manager
                          -> Recovery Manager (WAL)
                        Index Manager        Message Queue -> Collaboration
```

PostgreSQL stores users, document metadata, permissions and audit logs.
It stores no document content, no versions, no locks and no index; CI fails
the build if any of those reappear in the schema.

### The eleven modules

| Module | Concept | Phase |
|--------|---------|-------|
| Storage Manager | Page I/O, file organisation, checksums | 3 |
| Buffer Pool | Memory management, LRU, pin counts | 4 |
| Transaction Manager | ACID, STEAL/FORCE buffer policy | 5 |
| Lock Manager | Two-phase locking, S/X modes, fair queueing | 6 |
| Deadlock Detector | Wait-for graph, Tarjan's SCC, victim selection | 6 |
| Request Scheduler | FIFO and round-robin, waiting-time metrics | 7 |
| Worker Pool | Bounded concurrency, explicit worker state | 7 |
| Message Queue | Producer-consumer, FIFO per document | 8 |
| Collaboration Manager | Sessions, presence, broadcast | 8 |
| Conflict Resolver | Optimistic version checks, disjoint merge | 9 |
| Index Manager | B+-Tree inverted index | 10 |
| Recovery Manager | WAL, REDO/UNDO, crash recovery | 11 |

---

## Verifying the claims

Every academic claim has a demo that asserts its own outcome and exits
non-zero on failure. They run in CI as well as in front of an examiner.

```bash
npm test          # 190 tests, 14 suites
npm run demo      # all seven evaluation demos
```

| Demo | Proves | `prd.md` section 10 |
|------|--------|---------------------|
| `demo:concurrency` | Three editors, no lost updates, contiguous versions | item 1 |
| `demo:deadlock` | Cycle detected, victim aborted, survivor proceeds | item 2 |
| `demo:transactions` | Atomicity, consistency, isolation, durability | item 3 |
| `demo:recovery` | Committed work survives a crash, uncommitted does not | item 4 |
| `demo:index` | B+-Tree 200-800x faster than a full scan, same answers | item 5 |
| `demo:scheduling` | FIFO versus round-robin waiting times | item 6 |
| `demo:buffer` | LRU hit ratio, thrashing, pin invariant | Phase 4 |

---

## Scope, stated honestly

**In scope** (`prd.md` section 8): the eleven engine modules, a thin Express
API, real-time push over Socket.IO, and PostgreSQL for authentication and
metadata only.

**Out of scope**, and therefore absent rather than half-built:

| Not built | Why |
|-----------|-----|
| Operational Transformation | `design.md` section 10: 2PL plus version checks is correct; OT adds convenience, not correctness |
| Comments, suggestions, live cursors | `prd.md` section 8 |
| Distributed consensus, multi-node sharding | `prd.md` section 8; the backend is single-instance by design |
| WAL truncation after a checkpoint | `design.md` section 12 lists it as a future improvement |
| Rich-text formatting | The editor is plain text, which also removes a whole class of XSS |

Known gaps in testing and security are listed in
[`testing/testing-strategy.md`](testing/testing-strategy.md) section 8 and
[`security/security-architecture.md`](security/security-architecture.md)
section 6 rather than left to be discovered.
