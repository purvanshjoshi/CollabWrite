# Monitoring, Telemetry & Maintenance

## 1. Observability & Key Performance Indicators (KPIs)

To maintain real-time performance and system health across high-concurrency document rooms, CollabWrite tracks the following primary metrics:

| Metric | Target / SLA | Alert Threshold | Description |
| :--- | :--- | :--- | :--- |
| **Edit Propagation Latency** | $< 50\text{ ms}$ | $> 150\text{ ms}$ (P95) | Time from client keystroke dispatch to collaborator render |
| **OT Transformation Duration** | $< 1\text{ ms}$ | $> 5\text{ ms}$ | Time spent inside `OTEngine.transform()` per operation |
| **Deadlock Detections / Min** | $0$ | $> 5\text{ / min}$ | Frequency of circular wait aborts triggered by DFS cycle scanner |
| **Active WebSocket Connections** | Nominal | $> 5000\text{ / node}$ | Connection count per Node.js process |
| **PostgreSQL Connection Pool Usage** | $< 70\%$ | $> 85\%$ | Ratio of active to maximum available database client connections |
| **WAL Lag / Unapplied Ops** | $0$ | $> 100\text{ ops}$ | Change log entries written to WAL but pending snapshot consolidation |

---

## 2. Healthcheck & Metrics Endpoints

- **`GET /api/v1/health`**: Simple liveness probe returning HTTP 200 OK if the HTTP server is responsive.
- **`GET /api/v1/health/ready`**: Readiness probe validating database connectivity, Redis ping, and lock manager state.
- **`GET /metrics`**: Prometheus-formatted telemetry scraped on port 9090.

---

## 3. Database Maintenance & Snapshot Runbook

### 3.1 Periodic Snapshot Generation
To keep `change_logs` query latency in the sub-millisecond range, a background cron consolidation job runs every 100 operations or every 1 hour:

```sql
-- Creates snapshot of current state and purges obsolete logs older than 30 days
INSERT INTO document_versions (document_id, version_number, content, created_by, version_message)
SELECT id, version, content, COALESCE(last_modified_by, owner_id), 'Automated snapshot'
FROM documents
WHERE version % 100 = 0
ON CONFLICT (document_id, version_number) DO NOTHING;
```

### 3.2 Database Backup & Disaster Recovery

```bash
# Production Daily Full Backup
pg_dump -U collabuser -h localhost -F c -b -v -f "/var/backups/collabwrite_$(date +%Y%m%d_%H%M%S).dump" collabwrite

# Restoration Runbook
pg_restore -U collabuser -h localhost -d collabwrite -v "/var/backups/collabwrite_20250115_000000.dump"
```
