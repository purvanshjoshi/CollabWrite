-- =============================================================================
-- CollabWrite - Production PostgreSQL Database Initialization Schema
-- Version: 1.0.0
-- =============================================================================

-- Enable standard extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. ENUM TYPES
-- =============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_type_enum') THEN
    CREATE TYPE permission_type_enum AS ENUM ('viewer', 'editor', 'owner');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operation_type_enum') THEN
    CREATE TYPE operation_type_enum AS ENUM ('insert', 'delete', 'replace', 'format');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lock_type_enum') THEN
    CREATE TYPE lock_type_enum AS ENUM ('read', 'write');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'section_type_enum') THEN
    CREATE TYPE section_type_enum AS ENUM ('paragraph', 'line', 'word', 'document');
  END IF;
END $$;

-- =============================================================================
-- 2. USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT TRUE,
  CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- =============================================================================
-- 3. DOCUMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL DEFAULT 'Untitled Document',
  content TEXT NOT NULL DEFAULT '',
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_modified_by INT REFERENCES users(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  word_count INT DEFAULT 0,
  character_count INT DEFAULT 0,
  comment_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_is_deleted ON documents(is_deleted);
CREATE INDEX IF NOT EXISTS idx_documents_owner_deleted ON documents(owner_id, is_deleted);

-- =============================================================================
-- 4. DOCUMENT PERMISSIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS document_permissions (
  id SERIAL PRIMARY KEY,
  document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_type permission_type_enum NOT NULL DEFAULT 'viewer',
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  granted_by INT NOT NULL REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT uq_document_user_permission UNIQUE(document_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_doc_permissions_document_id ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_permissions_user_id ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_permissions_lookup ON document_permissions(document_id, user_id);

-- =============================================================================
-- 5. CHANGE LOGS TABLE (WRITE-AHEAD LOG FOR OT & RECOVERY)
-- =============================================================================
CREATE TABLE IF NOT EXISTS change_logs (
  id BIGSERIAL PRIMARY KEY,
  document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  operation_id VARCHAR(255) UNIQUE,
  operation_type operation_type_enum NOT NULL,
  position INT NOT NULL,
  content TEXT,
  deleted_content TEXT,
  attributes JSONB DEFAULT '{}'::jsonb,
  client_version INT NOT NULL,
  server_version INT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_applied BOOLEAN DEFAULT TRUE,
  is_transformed BOOLEAN DEFAULT FALSE,
  conflict_resolution_info JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_change_logs_doc_version ON change_logs(document_id, server_version ASC);
CREATE INDEX IF NOT EXISTS idx_change_logs_doc_timestamp ON change_logs(document_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_change_logs_user_id ON change_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_op_id ON change_logs(operation_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_seq ON change_logs(document_id, id ASC);

-- =============================================================================
-- 6. DOCUMENT VERSIONS TABLE (PERIODIC SNAPSHOTS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS document_versions (
  id SERIAL PRIMARY KEY,
  document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  content TEXT NOT NULL,
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  version_message VARCHAR(500),
  change_summary VARCHAR(1000),
  character_diff INT DEFAULT 0,
  CONSTRAINT uq_document_version_number UNIQUE(document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_doc_versions_lookup ON document_versions(document_id, version_number);
CREATE INDEX IF NOT EXISTS idx_doc_versions_created_at ON document_versions(created_at DESC);

-- =============================================================================
-- 7. USER SESSIONS TABLE (REAL-TIME PRESENCE)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  socket_id VARCHAR(255),
  cursor_position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_sessions_doc_active ON user_sessions(document_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON user_sessions(last_activity DESC);

-- =============================================================================
-- 8. DOCUMENT LOCKS TABLE (PESSIMISTIC 2PL CONCURRENCY)
-- =============================================================================
CREATE TABLE IF NOT EXISTS document_locks (
  id SERIAL PRIMARY KEY,
  document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lock_type lock_type_enum DEFAULT 'write',
  section_id INT,
  section_type section_type_enum DEFAULT 'document',
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  lock_token VARCHAR(255) UNIQUE NOT NULL,
  priority INT DEFAULT 0,
  wait_count INT DEFAULT 0,
  CONSTRAINT chk_lock_expiration CHECK (expires_at > acquired_at)
);

CREATE INDEX IF NOT EXISTS idx_locks_document_user ON document_locks(document_id, user_id);
CREATE INDEX IF NOT EXISTS idx_locks_expires_at ON document_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_locks_token ON document_locks(lock_token);

-- =============================================================================
-- 9. COMMENTS TABLE (THREADED INLINE FEEDBACK)
-- =============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  start_offset INT,
  end_offset INT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by INT REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  parent_comment_id INT REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_document_id ON comments(document_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_position ON comments(position);
CREATE INDEX IF NOT EXISTS idx_comments_resolved ON comments(is_resolved);

-- =============================================================================
-- 10. DOCUMENT TAGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS document_tags (
  id SERIAL PRIMARY KEY,
  document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_doc_tag UNIQUE(document_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_tags_document_id ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag_name ON document_tags(tag_name);

-- =============================================================================
-- 11. AUDIT LOGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  document_id INT REFERENCES documents(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  action_details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_document_id ON audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- =============================================================================
-- 12. TRIGGERS & STORED PROCEDURES
-- =============================================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_comments_updated_at ON comments;
CREATE TRIGGER trg_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

-- Function: Compute document word and character counts
CREATE OR REPLACE FUNCTION fn_update_document_metrics()
RETURNS TRIGGER AS $$
BEGIN
  NEW.character_count = LENGTH(COALESCE(NEW.content, ''));
  NEW.word_count = ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(TRIM(COALESCE(NEW.content, '')), '\s+'), 1);
  IF NEW.content IS NULL OR TRIM(NEW.content) = '' THEN
    NEW.word_count = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_metrics ON documents;
CREATE TRIGGER trg_documents_metrics
BEFORE INSERT OR UPDATE OF content ON documents
FOR EACH ROW
EXECUTE FUNCTION fn_update_document_metrics();

-- Function: Maintain denormalized comment count
CREATE OR REPLACE FUNCTION fn_maintain_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE documents SET comment_count = comment_count + 1 WHERE id = NEW.document_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE documents SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.document_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comments_count ON comments;
CREATE TRIGGER trg_comments_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION fn_maintain_comment_count();

-- Function: Auto-create Owner permission on document creation
CREATE OR REPLACE FUNCTION fn_grant_owner_permission()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO document_permissions (document_id, user_id, permission_type, granted_by)
  VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id)
  ON CONFLICT (document_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_document_owner_permission ON documents;
CREATE TRIGGER trg_document_owner_permission
AFTER INSERT ON documents
FOR EACH ROW
EXECUTE FUNCTION fn_grant_owner_permission();

-- =============================================================================
-- 13. VIEWS
-- =============================================================================

-- View: User's Accessible Documents with Owner Information
CREATE OR REPLACE VIEW user_accessible_documents AS
SELECT 
  d.id AS document_id,
  d.title,
  d.content,
  d.version,
  d.owner_id,
  u.username AS owner_name,
  u.avatar_url AS owner_avatar,
  dp.permission_type,
  d.word_count,
  d.character_count,
  d.comment_count,
  d.created_at,
  d.updated_at
FROM documents d
JOIN users u ON d.owner_id = u.id
JOIN document_permissions dp ON d.id = dp.document_id
WHERE d.is_deleted = FALSE;

-- View: Document Analytics Dashboard
CREATE OR REPLACE VIEW document_analytics AS
SELECT 
  d.id AS document_id,
  d.title,
  d.version,
  d.owner_id,
  COUNT(DISTINCT dp.user_id) AS total_collaborators,
  COUNT(DISTINCT c.id) AS total_comments,
  COUNT(DISTINCT cl.id) AS total_edits,
  MAX(cl.timestamp) AS last_edit_time,
  d.character_count,
  d.word_count
FROM documents d
LEFT JOIN document_permissions dp ON d.id = dp.document_id
LEFT JOIN comments c ON d.id = c.document_id
LEFT JOIN change_logs cl ON d.id = cl.document_id
WHERE d.is_deleted = FALSE
GROUP BY d.id, d.title, d.version, d.owner_id, d.character_count, d.word_count;
