# Changelog

All notable changes to the **CollabWrite** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-08-31

### Added
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-08-26

### Added
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-08-26

### Added
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [1.0.0] - 2025-01-15

### Added
- **Core Operational Transformation (OT) Engine**:
  - `Insert-Insert`, `Insert-Delete`, and `Delete-Delete` concurrent transformation functions.
  - Server-side operation queue and linear history serialization.
  - Client-side optimistic application with server acknowledgment and rollback compensation.
- **Lock Management & Deadlock Detection**:
  - Fine-grained document and section-level 2-Phase Locking (2PL).
  - Graph-based cycle detection (Tarjan / DFS cycle detection on wait-for graphs).
  - Configurable lock timeouts with automatic resource reclamation.
- **Data Persistence & Write-Ahead Logging (WAL)**:
  - Complete PostgreSQL schema with 10 tables, composite indices, and audit logging.
  - Append-only `change_logs` table serving as an application-level WAL for crash recovery and audit trails.
  - Periodic document snapshots in `document_versions` to bound recovery time.
- **Real-Time Presence & Collaboration**:
  - WebSocket event protocol (Socket.io) for sub-100ms edit propagation.
  - Live cursor tracking, multi-user selection indicators, and user heartbeat management.
  - Threaded inline document comments with resolution tracking.
- **Security & Authorization**:
  - JWT-based authentication with refresh token rotation.
  - 3-tier Role-Based Access Control (RBAC): `viewer`, `editor`, `owner`.
  - Content sanitization (XSS mitigation) and parameterized SQL queries.
- **Developer & Production Tooling**:
  - Multi-container `docker-compose.yml` environment for PostgreSQL, Redis, backend, and frontend.
  - Full-featured test suite harness for OT property testing and stress simulation.
  - Complete architectural, algorithmic, and API documentation in `docs/`.
