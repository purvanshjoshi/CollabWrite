# Complete User Workflows & Scenarios

---

## Workflow 1: User Registration & Session Initialization
```mermaid
sequenceDiagram
    actor User as New User
    participant Client as React Client
    participant API as Express Auth API
    participant DB as PostgreSQL DB

    User->>Client: Enters email, username, password
    Client->>API: POST /api/v1/auth/register
    API->>API: Hash password (bcrypt cost 12)
    API->>DB: INSERT INTO users ... RETURNING id
    DB-->>API: User ID created
    API->>API: Generate Access Token (15m) & Refresh Token (7d)
    API-->>Client: 201 Created { user, accessToken, refreshToken }
    Client->>Client: Store accessToken in memory & refreshToken in secure cookie
```

---

## Workflow 2: Simultaneous Concurrent Edits (OT Convergence)
```mermaid
sequenceDiagram
    actor Alice as Alice (User 1)
    actor Bob as Bob (User 2)
    participant ClientA as Alice's Client
    participant Server as CollabWrite OT Server
    participant ClientB as Bob's Client

    Note over Alice,Bob: Document Content: "Base Text" (Version 10)
    Alice->>ClientA: Types "A " at pos 0
    ClientA->>ClientA: Optimistic Local Render: "A Base Text"
    ClientA->>Server: emit('operation:send', { opA, clientVer: 10 })

    Bob->>ClientB: Types "B " at pos 0
    ClientB->>ClientB: Optimistic Local Render: "B Base Text"
    ClientB->>Server: emit('operation:send', { opB, clientVer: 10 })

    Note over Server: opA arrives first at Server
    Server->>Server: Apply opA directly -> State: "A Base Text" (Ver 11)
    Server-->>ClientA: emit('operation:ack', { ver: 11 })
    Server-->>ClientB: emit('operation:receive', { op: opA, ver: 11 })

    Note over Server: opB arrives (clientVer 10 < serverVer 11)
    Server->>Server: Transform opB against opA -> opB' (pos shifted to 2)
    Server->>Server: Apply opB' -> State: "A B Base Text" (Ver 12)
    Server-->>ClientB: emit('operation:ack', { ver: 12 })
    Server-->>ClientA: emit('operation:receive', { op: opB', ver: 12 })

    ClientB->>ClientB: Transform local buffer against remote opA & render
    ClientA->>ClientA: Apply remote transformed opB' & render
    Note over ClientA,ClientB: Both clients converge to identical state: "A B Base Text"
```

---

## Workflow 3: Section Lock Contention & Deadlock Prevention
```mermaid
sequenceDiagram
    actor Alice as Alice
    actor Bob as Bob
    participant LockMgr as Lock Manager
    participant Detector as Deadlock Detector (Wait-For Graph)

    Alice->>LockMgr: Request Lock on Paragraph 1
    LockMgr-->>Alice: Lock Granted (Lock Token A1)

    Bob->>LockMgr: Request Lock on Paragraph 2
    LockMgr-->>Bob: Lock Granted (Lock Token B2)

    Alice->>LockMgr: Request Lock on Paragraph 2 (held by Bob)
    LockMgr->>Detector: Add Edge (Alice -> Bob)
    Detector->>Detector: Run DFS (No cycle found)
    LockMgr-->>Alice: Wait / Queue Lock Request

    Bob->>LockMgr: Request Lock on Paragraph 1 (held by Alice)
    LockMgr->>Detector: Add Edge (Bob -> Alice)
    Detector->>Detector: Run DFS -> CYCLE DETECTED (Bob -> Alice -> Bob)
    Detector-->>LockMgr: Deadlock Alert!
    LockMgr->>Detector: Abort youngest edge (Bob -> Alice)
    LockMgr-->>Bob: emit('lock:denied', { reason: 'deadlock_detected' })
    Note over Bob: Bob's UI alerts: "Resource contention detected. Request aborted."
```

---

## Workflow 4: Network Disconnection & Re-synchronization
```mermaid
sequenceDiagram
    actor Alice as Alice
    participant Client as React Client (Local Buffer)
    participant Server as CollabWrite Server
    participant DB as PostgreSQL WAL

    Note over Client,Server: WebSocket Connection Drops (WiFi down)
    Alice->>Client: Continues typing 3 paragraphs offline
    Client->>Client: Buffer operations locally in offline queue
    
    Note over Client: Network Restored (WebSocket reconnects)
    Client->>Server: emit('document:join', { docId: 1, clientVersion: 15 })
    Server->>DB: SELECT * FROM change_logs WHERE doc_id = 1 AND server_version > 15
    DB-->>Server: Operations from Ver 16 to 22 (made by other users)
    Server-->>Client: emit('document:catchup', { ops: [16..22], currentVer: 22 })
    
    Client->>Client: Transform local buffered offline ops against remote [16..22]
    Client->>Server: emit('operation:send', { transformedOfflineOps, clientVer: 22 })
    Server-->>Client: emit('operation:ack', { newVer: 25 })
    Note over Client: Fully synchronized without data loss!
```

---

## Workflow 5: Version History Snapshot & Rollback
1. User clicks **"History"** in editor toolbar.
2. Client requests `GET /api/v1/documents/:id/versions`.
3. UI presents a timeline diff viewer with visual character additions and deletions.
4. User selects Version 5 and clicks **"Revert to this Version"**.
5. Server generates an atomic compensation operation (`replace`) reverting current content to Version 5 snapshot content.
6. Server increments version counter to $(N+1)$, commits to WAL, and broadcasts the revert delta to all connected clients.
