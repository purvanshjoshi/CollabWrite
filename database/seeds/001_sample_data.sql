-- =============================================================================
-- CollabWrite - Development Seed Data
-- =============================================================================
--
-- Seeds the support store only: three accounts, two document metadata rows
-- and the permissions between them.
--
-- There is no document text here, and there cannot be. Content belongs to the
-- engine, which creates a document's page chain through its own transaction
-- manager and write-ahead log. Seeding text with an INSERT would bypass both
-- and leave the two stores disagreeing about what exists.
--
-- To seed content as well, start the server and run:
--     npm run demo:concurrency
-- or create documents through POST /api/documents, which writes the metadata
-- row and the engine pages together.
--
-- All three accounts use the password 'password123'.
-- =============================================================================

INSERT INTO users (id, username, email, password_hash, full_name, role, is_active)
VALUES
  (1, 'ananya', 'ananya@collabwrite.dev',
      '$2b$10$wAjp5sJ9UEIk2yxivko9O.3.lBxW/TfDSe3RHRYy3USUjcpbhXJpW',
      'Ananya Sharma', 'admin', TRUE),
  (2, 'rahul', 'rahul@collabwrite.dev',
      '$2b$10$wAjp5sJ9UEIk2yxivko9O.3.lBxW/TfDSe3RHRYy3USUjcpbhXJpW',
      'Rahul Verma', 'user', TRUE),
  (3, 'priya', 'priya@collabwrite.dev',
      '$2b$10$wAjp5sJ9UEIk2yxivko9O.3.lBxW/TfDSe3RHRYy3USUjcpbhXJpW',
      'Priya Nair', 'user', TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Document metadata. The matching page chains are created by the engine the
-- first time these documents are opened through the API.
INSERT INTO documents (id, title, owner_id)
VALUES
  (1, 'Operating Systems Project Report', 1),
  (2, 'DBMS Concurrency Control Notes', 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval('documents_id_seq', (SELECT MAX(id) FROM documents));

-- The owner permission is granted by a trigger; these rows add collaborators.
INSERT INTO document_permissions (document_id, user_id, role)
VALUES
  (1, 2, 'editor'),
  (1, 3, 'viewer'),
  (2, 1, 'editor')
ON CONFLICT (document_id, user_id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO audit_logs (user_id, document_id, action, details)
VALUES
  (1, 1, 'document.create', '{"source": "seed"}'::jsonb),
  (2, 2, 'document.create', '{"source": "seed"}'::jsonb)
ON CONFLICT DO NOTHING;
