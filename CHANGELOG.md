# Changelog

All notable changes to the **CollabWrite** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-10-17

### Added
- **ui**: display locks granted and clarify deadlock victims vs total rollbacks ([8783d9e])
- **ui**: add live ACID principles telemetry matrix in Parth inspector tab ([672b08c])
- **inspector**: add live deadlock cycle simulation button and history table for Parth ([f14a016])
- **ui**: add live OS and DBMS engine inspector modal with telemetry for all members ([4852a37])
- **auth**: pre-seed default users in InMemoryStore and fix password123 hash ([72a4996])
- **client**: add document sharing by username and UI share panel ([ba83132])
- **engine**: implement the Academic Engine per prd/architecture/design/phases/rules ([30691dc])

### Fixed
- **ui**: display accurate message queue delivered count ([1aa721b])
- **nodemon**: prevent continuous server restarts and fix false restart banner ([773c5fd])
- **ui**: simplify Durability card to show log records scanned without redone/undone ([f948305])
- **server**: handle lingering sockets and retry listen to prevent EADDRINUSE ([5556b1e])
- **ui**: update tip text to state 8-frame buffer pool capacity ([24ceb71])
- **ui**: show tasks done and live state on worker cards ([3c50770])
- **ui**: add restart warning and clean telemetry parsing in InspectorModal ([f6b81e1])
- **presence**: isolate presence per document, handle document leaving, and clarify active document indicator ([69df762])
- **vite**: suppress transient ECONNABORTED socket proxy errors on reload/restart ([e7501d5])
- **auth**: persist in-memory store to data/auth_store.json and retain session in localStorage ([cd0562e])
- **client**: rename api.js to clientApi.js and restrict /api/ proxy rule ([91815b8])
- **client**: alias socket.io-client to avoid optimizeDeps dot filename mismatch ([1378f5e])
- **client**: bind vite to 0.0.0.0 and fix root script path in index.html ([3bb85a2])
- **security**: address CodeQL findings on the new engine and API code ([13de75e])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([df3c98c])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([6a89a02])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([657fcbb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([76a356f])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([65344e3])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([7025c17])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([41c3ab7])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([92f99f4])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([02f1730])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([5c41094])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([c63cb91])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([62608f9])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([21adb9b])
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])

## [Unreleased] - 2026-10-16

### Added
- **ui**: display locks granted and clarify deadlock victims vs total rollbacks ([8783d9e])
- **ui**: add live ACID principles telemetry matrix in Parth inspector tab ([672b08c])
- **inspector**: add live deadlock cycle simulation button and history table for Parth ([f14a016])
- **ui**: add live OS and DBMS engine inspector modal with telemetry for all members ([4852a37])
- **auth**: pre-seed default users in InMemoryStore and fix password123 hash ([72a4996])
- **client**: add document sharing by username and UI share panel ([ba83132])
- **engine**: implement the Academic Engine per prd/architecture/design/phases/rules ([30691dc])

### Fixed
- **nodemon**: prevent continuous server restarts and fix false restart banner ([773c5fd])
- **ui**: simplify Durability card to show log records scanned without redone/undone ([f948305])
- **server**: handle lingering sockets and retry listen to prevent EADDRINUSE ([5556b1e])
- **ui**: update tip text to state 8-frame buffer pool capacity ([24ceb71])
- **ui**: show tasks done and live state on worker cards ([3c50770])
- **ui**: add restart warning and clean telemetry parsing in InspectorModal ([f6b81e1])
- **presence**: isolate presence per document, handle document leaving, and clarify active document indicator ([69df762])
- **vite**: suppress transient ECONNABORTED socket proxy errors on reload/restart ([e7501d5])
- **auth**: persist in-memory store to data/auth_store.json and retain session in localStorage ([cd0562e])
- **client**: rename api.js to clientApi.js and restrict /api/ proxy rule ([91815b8])
- **client**: alias socket.io-client to avoid optimizeDeps dot filename mismatch ([1378f5e])
- **client**: bind vite to 0.0.0.0 and fix root script path in index.html ([3bb85a2])
- **security**: address CodeQL findings on the new engine and API code ([13de75e])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([6a89a02])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([657fcbb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([76a356f])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([65344e3])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([7025c17])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([41c3ab7])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([92f99f4])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([02f1730])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([5c41094])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([c63cb91])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([62608f9])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([21adb9b])
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])

## [Unreleased] - 2026-10-16

### Added
- **ui**: display locks granted and clarify deadlock victims vs total rollbacks ([8783d9e])
- **ui**: add live ACID principles telemetry matrix in Parth inspector tab ([672b08c])
- **inspector**: add live deadlock cycle simulation button and history table for Parth ([f14a016])
- **ui**: add live OS and DBMS engine inspector modal with telemetry for all members ([4852a37])
- **auth**: pre-seed default users in InMemoryStore and fix password123 hash ([72a4996])
- **client**: add document sharing by username and UI share panel ([ba83132])
- **engine**: implement the Academic Engine per prd/architecture/design/phases/rules ([30691dc])
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])

### Fixed
- **ui**: simplify Durability card to show log records scanned without redone/undone ([f948305])
- **server**: handle lingering sockets and retry listen to prevent EADDRINUSE ([5556b1e])
- **ui**: update tip text to state 8-frame buffer pool capacity ([24ceb71])
- **ui**: show tasks done and live state on worker cards ([3c50770])
- **ui**: add restart warning and clean telemetry parsing in InspectorModal ([f6b81e1])
- **presence**: isolate presence per document, handle document leaving, and clarify active document indicator ([69df762])
- **vite**: suppress transient ECONNABORTED socket proxy errors on reload/restart ([e7501d5])
- **auth**: persist in-memory store to data/auth_store.json and retain session in localStorage ([cd0562e])
- **client**: rename api.js to clientApi.js and restrict /api/ proxy rule ([91815b8])
- **client**: alias socket.io-client to avoid optimizeDeps dot filename mismatch ([1378f5e])
- **client**: bind vite to 0.0.0.0 and fix root script path in index.html ([3bb85a2])
- **security**: address CodeQL findings on the new engine and API code ([13de75e])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([657fcbb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([76a356f])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([65344e3])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([7025c17])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([41c3ab7])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([92f99f4])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([02f1730])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([5c41094])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([c63cb91])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([62608f9])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([21adb9b])
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])

## [Unreleased] - 2026-10-16

### Added
- **ui**: display locks granted and clarify deadlock victims vs total rollbacks ([8783d9e])
- **ui**: add live ACID principles telemetry matrix in Parth inspector tab ([672b08c])
- **inspector**: add live deadlock cycle simulation button and history table for Parth ([f14a016])
- **ui**: add live OS and DBMS engine inspector modal with telemetry for all members ([4852a37])
- **auth**: pre-seed default users in InMemoryStore and fix password123 hash ([72a4996])
- **client**: add document sharing by username and UI share panel ([ba83132])
- **engine**: implement the Academic Engine per prd/architecture/design/phases/rules ([30691dc])
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])

### Fixed
- **server**: handle lingering sockets and retry listen to prevent EADDRINUSE ([5556b1e])
- **ui**: update tip text to state 8-frame buffer pool capacity ([24ceb71])
- **ui**: show tasks done and live state on worker cards ([3c50770])
- **ui**: add restart warning and clean telemetry parsing in InspectorModal ([f6b81e1])
- **presence**: isolate presence per document, handle document leaving, and clarify active document indicator ([69df762])
- **vite**: suppress transient ECONNABORTED socket proxy errors on reload/restart ([e7501d5])
- **auth**: persist in-memory store to data/auth_store.json and retain session in localStorage ([cd0562e])
- **client**: rename api.js to clientApi.js and restrict /api/ proxy rule ([91815b8])
- **client**: alias socket.io-client to avoid optimizeDeps dot filename mismatch ([1378f5e])
- **client**: bind vite to 0.0.0.0 and fix root script path in index.html ([3bb85a2])
- **security**: address CodeQL findings on the new engine and API code ([13de75e])
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([76a356f])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([65344e3])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([7025c17])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([41c3ab7])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([92f99f4])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([02f1730])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([5c41094])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([c63cb91])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([62608f9])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([21adb9b])
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-10-16

### Added
- **ui**: display locks granted and clarify deadlock victims vs total rollbacks ([8783d9e])
- **ui**: add live ACID principles telemetry matrix in Parth inspector tab ([672b08c])
- **inspector**: add live deadlock cycle simulation button and history table for Parth ([f14a016])
- **ui**: add live OS and DBMS engine inspector modal with telemetry for all members ([4852a37])
- **auth**: pre-seed default users in InMemoryStore and fix password123 hash ([72a4996])
- **client**: add document sharing by username and UI share panel ([ba83132])
- **engine**: implement the Academic Engine per prd/architecture/design/phases/rules ([30691dc])
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ui**: update tip text to state 8-frame buffer pool capacity ([24ceb71])
- **ui**: show tasks done and live state on worker cards ([3c50770])
- **ui**: add restart warning and clean telemetry parsing in InspectorModal ([f6b81e1])
- **presence**: isolate presence per document, handle document leaving, and clarify active document indicator ([69df762])
- **vite**: suppress transient ECONNABORTED socket proxy errors on reload/restart ([e7501d5])
- **auth**: persist in-memory store to data/auth_store.json and retain session in localStorage ([cd0562e])
- **client**: rename api.js to clientApi.js and restrict /api/ proxy rule ([91815b8])
- **client**: alias socket.io-client to avoid optimizeDeps dot filename mismatch ([1378f5e])
- **client**: bind vite to 0.0.0.0 and fix root script path in index.html ([3bb85a2])
- **security**: address CodeQL findings on the new engine and API code ([13de75e])
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([65344e3])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([7025c17])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([41c3ab7])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([92f99f4])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([02f1730])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([5c41094])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([c63cb91])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([62608f9])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([21adb9b])
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-10-16

### Added
- **ui**: add live ACID principles telemetry matrix in Parth inspector tab ([672b08c])
- **inspector**: add live deadlock cycle simulation button and history table for Parth ([f14a016])
- **ui**: add live OS and DBMS engine inspector modal with telemetry for all members ([4852a37])
- **auth**: pre-seed default users in InMemoryStore and fix password123 hash ([72a4996])
- **client**: add document sharing by username and UI share panel ([ba83132])
- **engine**: implement the Academic Engine per prd/architecture/design/phases/rules ([30691dc])
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ui**: update tip text to state 8-frame buffer pool capacity ([24ceb71])
- **ui**: show tasks done and live state on worker cards ([3c50770])
- **ui**: add restart warning and clean telemetry parsing in InspectorModal ([f6b81e1])
- **presence**: isolate presence per document, handle document leaving, and clarify active document indicator ([69df762])
- **vite**: suppress transient ECONNABORTED socket proxy errors on reload/restart ([e7501d5])
- **auth**: persist in-memory store to data/auth_store.json and retain session in localStorage ([cd0562e])
- **client**: rename api.js to clientApi.js and restrict /api/ proxy rule ([91815b8])
- **client**: alias socket.io-client to avoid optimizeDeps dot filename mismatch ([1378f5e])
- **client**: bind vite to 0.0.0.0 and fix root script path in index.html ([3bb85a2])
- **security**: address CodeQL findings on the new engine and API code ([13de75e])
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([7025c17])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([41c3ab7])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([92f99f4])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([02f1730])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([5c41094])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([c63cb91])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([62608f9])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([21adb9b])
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-10-16

### Added
- **inspector**: add live deadlock cycle simulation button and history table for Parth ([f14a016])
- **ui**: add live OS and DBMS engine inspector modal with telemetry for all members ([4852a37])
- **auth**: pre-seed default users in InMemoryStore and fix password123 hash ([72a4996])
- **client**: add document sharing by username and UI share panel ([ba83132])
- **engine**: implement the Academic Engine per prd/architecture/design/phases/rules ([30691dc])
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ui**: update tip text to state 8-frame buffer pool capacity ([24ceb71])
- **ui**: show tasks done and live state on worker cards ([3c50770])
- **ui**: add restart warning and clean telemetry parsing in InspectorModal ([f6b81e1])
- **presence**: isolate presence per document, handle document leaving, and clarify active document indicator ([69df762])
- **vite**: suppress transient ECONNABORTED socket proxy errors on reload/restart ([e7501d5])
- **auth**: persist in-memory store to data/auth_store.json and retain session in localStorage ([cd0562e])
- **client**: rename api.js to clientApi.js and restrict /api/ proxy rule ([91815b8])
- **client**: alias socket.io-client to avoid optimizeDeps dot filename mismatch ([1378f5e])
- **client**: bind vite to 0.0.0.0 and fix root script path in index.html ([3bb85a2])
- **security**: address CodeQL findings on the new engine and API code ([13de75e])
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([41c3ab7])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([92f99f4])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([02f1730])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([5c41094])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([c63cb91])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([62608f9])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([21adb9b])
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-10-16

### Added
- **ui**: add live OS and DBMS engine inspector modal with telemetry for all members ([4852a37])
- **auth**: pre-seed default users in InMemoryStore and fix password123 hash ([72a4996])
- **client**: add document sharing by username and UI share panel ([ba83132])
- **engine**: implement the Academic Engine per prd/architecture/design/phases/rules ([30691dc])
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ui**: update tip text to state 8-frame buffer pool capacity ([24ceb71])
- **ui**: show tasks done and live state on worker cards ([3c50770])
- **ui**: add restart warning and clean telemetry parsing in InspectorModal ([f6b81e1])
- **presence**: isolate presence per document, handle document leaving, and clarify active document indicator ([69df762])
- **vite**: suppress transient ECONNABORTED socket proxy errors on reload/restart ([e7501d5])
- **auth**: persist in-memory store to data/auth_store.json and retain session in localStorage ([cd0562e])
- **client**: rename api.js to clientApi.js and restrict /api/ proxy rule ([91815b8])
- **client**: alias socket.io-client to avoid optimizeDeps dot filename mismatch ([1378f5e])
- **client**: bind vite to 0.0.0.0 and fix root script path in index.html ([3bb85a2])
- **security**: address CodeQL findings on the new engine and API code ([13de75e])
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([92f99f4])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([02f1730])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([5c41094])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([c63cb91])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([62608f9])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([21adb9b])
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-10-16

### Added
- **ui**: add live OS and DBMS engine inspector modal with telemetry for all members ([4852a37])
- **auth**: pre-seed default users in InMemoryStore and fix password123 hash ([72a4996])
- **client**: add document sharing by username and UI share panel ([ba83132])
- **engine**: implement the Academic Engine per prd/architecture/design/phases/rules ([30691dc])
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ui**: show tasks done and live state on worker cards ([3c50770])
- **ui**: add restart warning and clean telemetry parsing in InspectorModal ([f6b81e1])
- **presence**: isolate presence per document, handle document leaving, and clarify active document indicator ([69df762])
- **vite**: suppress transient ECONNABORTED socket proxy errors on reload/restart ([e7501d5])
- **auth**: persist in-memory store to data/auth_store.json and retain session in localStorage ([cd0562e])
- **client**: rename api.js to clientApi.js and restrict /api/ proxy rule ([91815b8])
- **client**: alias socket.io-client to avoid optimizeDeps dot filename mismatch ([1378f5e])
- **client**: bind vite to 0.0.0.0 and fix root script path in index.html ([3bb85a2])
- **security**: address CodeQL findings on the new engine and API code ([13de75e])
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([02f1730])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([5c41094])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([c63cb91])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([62608f9])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([21adb9b])
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-10-16

### Added
- **ui**: add live OS and DBMS engine inspector modal with telemetry for all members ([4852a37])
- **auth**: pre-seed default users in InMemoryStore and fix password123 hash ([72a4996])
- **client**: add document sharing by username and UI share panel ([ba83132])
- **engine**: implement the Academic Engine per prd/architecture/design/phases/rules ([30691dc])
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ui**: add restart warning and clean telemetry parsing in InspectorModal ([f6b81e1])
- **presence**: isolate presence per document, handle document leaving, and clarify active document indicator ([69df762])
- **vite**: suppress transient ECONNABORTED socket proxy errors on reload/restart ([e7501d5])
- **auth**: persist in-memory store to data/auth_store.json and retain session in localStorage ([cd0562e])
- **client**: rename api.js to clientApi.js and restrict /api/ proxy rule ([91815b8])
- **client**: alias socket.io-client to avoid optimizeDeps dot filename mismatch ([1378f5e])
- **client**: bind vite to 0.0.0.0 and fix root script path in index.html ([3bb85a2])
- **security**: address CodeQL findings on the new engine and API code ([13de75e])
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([5c41094])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([c63cb91])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([62608f9])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([21adb9b])
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-10-16

### Added
- **ui**: add live OS and DBMS engine inspector modal with telemetry for all members ([4852a37])
- **auth**: pre-seed default users in InMemoryStore and fix password123 hash ([72a4996])
- **client**: add document sharing by username and UI share panel ([ba83132])
- **engine**: implement the Academic Engine per prd/architecture/design/phases/rules ([30691dc])
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **presence**: isolate presence per document, handle document leaving, and clarify active document indicator ([69df762])
- **vite**: suppress transient ECONNABORTED socket proxy errors on reload/restart ([e7501d5])
- **auth**: persist in-memory store to data/auth_store.json and retain session in localStorage ([cd0562e])
- **client**: rename api.js to clientApi.js and restrict /api/ proxy rule ([91815b8])
- **client**: alias socket.io-client to avoid optimizeDeps dot filename mismatch ([1378f5e])
- **client**: bind vite to 0.0.0.0 and fix root script path in index.html ([3bb85a2])
- **security**: address CodeQL findings on the new engine and API code ([13de75e])
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([c63cb91])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([62608f9])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([21adb9b])
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-10-16

### Added
- **auth**: pre-seed default users in InMemoryStore and fix password123 hash ([72a4996])
- **client**: add document sharing by username and UI share panel ([ba83132])
- **engine**: implement the Academic Engine per prd/architecture/design/phases/rules ([30691dc])
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **presence**: isolate presence per document, handle document leaving, and clarify active document indicator ([69df762])
- **vite**: suppress transient ECONNABORTED socket proxy errors on reload/restart ([e7501d5])
- **auth**: persist in-memory store to data/auth_store.json and retain session in localStorage ([cd0562e])
- **client**: rename api.js to clientApi.js and restrict /api/ proxy rule ([91815b8])
- **client**: alias socket.io-client to avoid optimizeDeps dot filename mismatch ([1378f5e])
- **client**: bind vite to 0.0.0.0 and fix root script path in index.html ([3bb85a2])
- **security**: address CodeQL findings on the new engine and API code ([13de75e])
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([62608f9])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([21adb9b])
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-10-16

### Added
- **engine**: implement the Academic Engine per prd/architecture/design/phases/rules ([30691dc])
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **security**: address CodeQL findings on the new engine and API code ([13de75e])
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([21adb9b])
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-10-13

### Added
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- add core academic architecture, design, and roadmap specifications ([d0ae5d2])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1bd4eb])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-08-31

### Added
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([d1aadf1])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-08-31

### Added
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([31210a0])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-08-31

### Added
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([654f812])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

## [Unreleased] - 2026-08-31

### Added
- **ci**: configure CodeQL security analysis, Dependabot updates, and automated changelog generation ([99fed93])
- **repo**: initialize CollabWrite repository with complete production documentation, database schema, and CI/CD templates ([c6c3cd3])

### Fixed
- **ci**: provide service implementations, Jest test harnesses, ESLint config, and robust CI workflow steps ([cb3e5d9])

### Documentation
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([b2d7120])
- **changelog**: auto-update CHANGELOG.md based on conventional commits [skip ci] ([3bc6d46])
- **style**: standardize professional enterprise formatting and eliminate emoji glyphs across all documentation ([7a407d1])

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
