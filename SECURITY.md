# Security Policy

## Supported Versions

CollabWrite team releases patches and security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of CollabWrite seriously. If you discover a security vulnerability within this project, please follow these steps:

1. **Do not create a public issue.** Publicly disclosing a vulnerability can endanger the community and production deployments.
2. Email your findings directly to our security team at **security@collabwrite.dev**.
3. Include the following details in your report:
   - Type of issue (e.g., buffer overflow, SQL injection, privilege escalation, timing attack)
   - Step-by-step instructions to reproduce the vulnerability
   - Proof-of-concept (PoC) scripts or HTTP/WebSocket payload examples
   - Potential impact and affected components (e.g., Lock Manager, OT Engine, Auth Middleware)
   - Any suggested mitigations or patches

### Response Timeline

- **Acknowledgment:** Within 24 hours of receiving the report.
- **Assessment & Validation:** Within 72 hours.
- **Remediation & Patch Release:** Aimed within 7–14 days depending on severity.
- **Public Disclosure:** Coordinated after the fix has been tagged and released.

## Security Practices in CollabWrite

- **Authentication:** Standard JWT (JSON Web Tokens) with short-lived access tokens (15m) and cryptographically secure refresh tokens stored in HTTP-only cookies.
- **Authorization:** Granular Role-Based Access Control (RBAC) enforced at database and API/WebSocket handler levels (`viewer`, `editor`, `owner`).
- **Data Protection:** All passwords are automatically salted and hashed using `bcrypt` (work factor 12+).
- **Concurrency Isolation:** Row-level locking and serializable transactions prevent race conditions and dirty reads.
- **Input Sanitization:** Parameterized SQL queries via Knex/pg prevent SQL Injection; DOMPurify sanitizes rich-text HTML input to eliminate Cross-Site Scripting (XSS).
- **Rate Limiting:** Token-bucket rate limiting applied per IP and per authenticated user to prevent denial-of-service (DoS) on WebSocket and REST endpoints.
