-- =============================================================================
-- CollabWrite - Development Seed Data
-- =============================================================================

-- Passwords hashed with bcrypt (cost 10) for 'password123':
-- $2a$10$w8T082T8nsuR14r0fK3rCexJm2nU6yK6m4t5Cq6jQ7R.V3N0E8p4W

INSERT INTO users (id, email, username, password_hash, full_name, avatar_url, is_active, is_admin)
VALUES 
  (1, 'alice@collabwrite.dev', 'alice', '$2a$10$w8T082T8nsuR14r0fK3rCexJm2nU6yK6m4t5Cq6jQ7R.V3N0E8p4W', 'Alice Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', TRUE, TRUE),
  (2, 'bob@collabwrite.dev', 'bob', '$2a$10$w8T082T8nsuR14r0fK3rCexJm2nU6yK6m4t5Cq6jQ7R.V3N0E8p4W', 'Bob Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', TRUE, FALSE),
  (3, 'charlie@collabwrite.dev', 'charlie', '$2a$10$w8T082T8nsuR14r0fK3rCexJm2nU6yK6m4t5Cq6jQ7R.V3N0E8p4W', 'Charlie Davis', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Seed Document 1
INSERT INTO documents (id, owner_id, title, content, version, last_modified_by)
VALUES (
  1,
  1,
  'Distributed Systems Architecture Notes',
  'Welcome to CollabWrite. This document demonstrates real-time Operational Transformation and concurrency control.',
  3,
  2
) ON CONFLICT (id) DO NOTHING;

SELECT setval('documents_id_seq', (SELECT MAX(id) FROM documents));

-- Seed Permissions for Document 1
INSERT INTO document_permissions (document_id, user_id, permission_type, granted_by)
VALUES 
  (1, 2, 'editor', 1),
  (1, 3, 'viewer', 1)
ON CONFLICT (document_id, user_id) DO NOTHING;

-- Seed Change Logs (WAL Operations) for Document 1
INSERT INTO change_logs (document_id, user_id, operation_id, operation_type, position, content, client_version, server_version, is_applied)
VALUES
  (1, 1, 'op_init_001', 'insert', 0, 'Welcome to CollabWrite.', 1, 1, TRUE),
  (1, 1, 'op_init_002', 'insert', 23, ' This document demonstrates real-time Operational Transformation', 1, 2, TRUE),
  (1, 2, 'op_init_003', 'insert', 86, ' and concurrency control.', 2, 3, TRUE)
ON CONFLICT (operation_id) DO NOTHING;

-- Seed Snapshots in document_versions
INSERT INTO document_versions (document_id, version_number, content, created_by, version_message, change_summary)
VALUES
  (1, 1, 'Welcome to CollabWrite.', 1, 'Initial draft', 'Created base document'),
  (1, 3, 'Welcome to CollabWrite. This document demonstrates real-time Operational Transformation and concurrency control.', 2, 'Added concurrency description', 'Expanded architecture explanation')
ON CONFLICT (document_id, version_number) DO NOTHING;

-- Seed Comments
INSERT INTO comments (id, document_id, user_id, text, position, start_offset, end_offset, is_resolved)
VALUES
  (1, 1, 2, 'Should we also add a section covering Wait-For graph algorithms?', 86, 86, 110, FALSE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments));

-- Seed Tags
INSERT INTO document_tags (document_id, tag_name)
VALUES
  (1, 'architecture'),
  (1, 'distributed-systems'),
  (1, 'os-dbms')
ON CONFLICT (document_id, tag_name) DO NOTHING;
