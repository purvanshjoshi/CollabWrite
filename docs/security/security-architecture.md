# Security Architecture & Threat Model

## 1. Authentication & Session Security

CollabWrite adopts a dual-token JWT architecture:
- **Access Token:** Short-lived (15 minutes), signed via HS256 / RS256 with user ID, email, and global admin claim. Sent in `Authorization: Bearer <token>` header or WebSocket handshake query.
- **Refresh Token:** Long-lived (7 days), stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie to prevent cross-site scripting (XSS) extraction.
- **Password Hashing:** Passwords are never stored in plaintext; salted with 12 rounds of `bcrypt`.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Capability | Viewer | Editor | Owner | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Read Document Content** | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| **Send OT Edit Operations** | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| **Move Cursor / Send Presence** | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| **Create / Reply to Comments** | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| **Resolve Comments** | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| **Acquire Section Write Lock** | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| **Manage Document Permissions** | :x: | :x: | :white_check_mark: | :white_check_mark: |
| **Revert Document to Snapshot** | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| **Soft Delete Document** | :x: | :x: | :white_check_mark: | :white_check_mark: |
| **Access System Audit Logs** | :x: | :x: | :x: | :white_check_mark: |

---

## 3. Threat Mitigation & Defense-in-Depth

### 3.1 Cross-Site Scripting (XSS)
- Rich text HTML strings are sanitized using `DOMPurify` before DOM injection.
- Modern React JSX escaping handles standard content rendering.
- Content Security Policy (CSP) headers restrict inline script execution.

### 3.2 SQL Injection (SQLi)
- All PostgreSQL interactions utilize parameterized queries through query builders (Knex / pg prepared statements). No string interpolation in queries.

### 3.3 Denial of Service & Rate Limiting
- **REST Endpoints:** Rate-limited using express-rate-limit (max 100 requests / minute per IP).
- **WebSocket Throttling:** Leaky bucket limiter limits operation ingestion to a maximum of 50 operations/sec per client to prevent socket flooding.

### 3.4 Audit Logging
All security-critical actions (`login`, `document_create`, `document_delete`, `permission_grant`, `permission_revoke`) are recorded to the tamper-evident `audit_logs` table with client IP, timestamp, and metadata payload.
