# WebSocket Protocol Specification

CollabWrite utilizes **Socket.io** over WebSocket (with fallback to HTTP long-polling) for bi-directional, real-time collaboration.

**Connection Endpoint:** `ws://localhost:3001/socket.io/?token=<JWT_ACCESS_TOKEN>`

---

## 1. Client-to-Server Events

### 1.1 `document:join`
Sent immediately when a client opens a document view.
```json
{
  "documentId": 1,
  "clientVersion": 42
}
```

### 1.2 `operation:send`
Dispatched when the user makes a local keystroke or edit.
```json
{
  "documentId": 1,
  "operation": {
    "operationId": "client_uuid_9876",
    "type": "insert",
    "position": 45,
    "content": "concurrent text",
    "attributes": { "bold": true }
  },
  "clientVersion": 42
}
```

### 1.3 `cursor:move`
Dispatched on selection or cursor position change.
```json
{
  "documentId": 1,
  "position": 58,
  "selectionLength": 0
}
```

### 1.4 `lock:request`
Requests a pessimistic read/write lock on a section.
```json
{
  "documentId": 1,
  "sectionId": 3,
  "lockType": "write"
}
```

### 1.5 `lock:release`
Releases an acquired lock token.
```json
{
  "documentId": 1,
  "lockToken": "tok_sec_12345"
}
```

---

## 2. Server-to-Client Events

### 2.1 `document:sync`
Sent on initial join or major resynchronization.
```json
{
  "documentId": 1,
  "content": "Current full document text...",
  "serverVersion": 42,
  "activeUsers": [
    { "userId": 1, "username": "alice", "cursorPosition": 12, "color": "#FF5733" },
    { "userId": 2, "username": "bob", "cursorPosition": 58, "color": "#33C1FF" }
  ]
}
```

### 2.2 `operation:ack`
Acknowledges successful application of client's in-flight operation.
```json
{
  "operationId": "client_uuid_9876",
  "serverVersion": 43
}
```

### 2.3 `operation:receive`
Broadcast to other collaborators containing the transformed operation.
```json
{
  "operation": {
    "type": "insert",
    "position": 60,
    "content": "concurrent text",
    "userId": 2
  },
  "serverVersion": 43
}
```

### 2.4 `cursor:update`
Broadcast when any co-author moves their cursor or highlights text.
```json
{
  "userId": 2,
  "username": "bob",
  "position": 65,
  "selectionLength": 10,
  "color": "#33C1FF"
}
```

### 2.5 `lock:acquired` / `lock:denied`
Result of a lock acquisition request.
```json
// lock:acquired
{
  "sectionId": 3,
  "lockToken": "tok_sec_12345",
  "expiresAt": "2025-01-15T10:00:30Z"
}

// lock:denied
{
  "sectionId": 3,
  "reason": "deadlock_detected" // or "held_by_other_user"
}
```

### 2.6 `presence:joined` / `presence:left`
Broadcast when users connect or disconnect.
```json
// presence:joined
{
  "userId": 3,
  "username": "charlie",
  "avatarUrl": "https://...",
  "color": "#28B463"
}

// presence:left
{
  "userId": 3
}
```
