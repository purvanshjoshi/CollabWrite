# REST API Specification

**Base URL:** `http://localhost:3001/api/v1`  
**Authentication Header:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`

---

## 1. Authentication & User Endpoints

### 1.1 Register User
- **POST** `/auth/register`
- **Request Body:**
  ```json
  {
    "email": "user@collabwrite.dev",
    "username": "johndoe",
    "password": "SecurePassword123!",
    "full_name": "John Doe"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "user": { "id": 4, "email": "user@collabwrite.dev", "username": "johndoe" },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
  ```

### 1.2 Login User
- **POST** `/auth/login`
- **Request Body:**
  ```json
  {
    "email": "user@collabwrite.dev",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": { "id": 4, "email": "user@collabwrite.dev", "username": "johndoe" },
    "accessToken": "eyJhbGciOi..."
  }
  ```

### 1.3 Refresh Access Token
- **POST** `/auth/refresh`
- **Request Body:**
  ```json
  {
    "refreshToken": "eyJhbGciOi..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOi..."
  }
  ```

---

## 2. Document Management Endpoints

### 2.1 List User Documents
- **GET** `/documents`
- **Query Params:** `page=1`, `limit=20`, `search=architecture`, `tag=os`
- **Response (200 OK):**
  ```json
  {
    "documents": [
      {
        "id": 1,
        "title": "Distributed Systems Architecture",
        "owner_id": 1,
        "owner_name": "alice",
        "permission_type": "owner",
        "version": 42,
        "word_count": 1250,
        "updated_at": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "totalPages": 1 }
  }
  ```

### 2.2 Create New Document
- **POST** `/documents`
- **Request Body:**
  ```json
  {
    "title": "Operating Systems Concurrency",
    "content": "Initial draft text."
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": 2,
    "title": "Operating Systems Concurrency",
    "version": 1,
    "created_at": "2025-01-15T10:05:00Z"
  }
  ```

### 2.3 Get Document by ID
- **GET** `/documents/:id`
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "title": "Distributed Systems Architecture",
    "content": "Full text content...",
    "version": 42,
    "permission": "editor",
    "word_count": 1250,
    "character_count": 8940
  }
  ```

### 2.4 Update Document Metadata
- **PATCH** `/documents/:id`
- **Request Body:**
  ```json
  {
    "title": "Renamed Document Title"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "document": { "id": 1, "title": "Renamed Document Title" }
  }
  ```

### 2.5 Soft Delete Document
- **DELETE** `/documents/:id`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Document moved to trash"
  }
  ```

---

## 3. Permissions & Collaboration Endpoints

### 3.1 Grant Document Permission
- **POST** `/documents/:id/permissions`
- **Request Body:**
  ```json
  {
    "user_email": "bob@collabwrite.dev",
    "permission_type": "editor"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "permission": { "document_id": 1, "user_id": 2, "permission_type": "editor" }
  }
  ```

### 3.2 List Document Permissions
- **GET** `/documents/:id/permissions`
- **Response (200 OK):**
  ```json
  [
    { "user_id": 1, "username": "alice", "permission_type": "owner" },
    { "user_id": 2, "username": "bob", "permission_type": "editor" }
  ]
  ```

---

## 4. Version History & Snapshots

### 4.1 List Document Version Snapshots
- **GET** `/documents/:id/versions`
- **Response (200 OK):**
  ```json
  [
    { "version_number": 1, "created_at": "2025-01-15T09:00:00Z", "version_message": "Initial draft" },
    { "version_number": 40, "created_at": "2025-01-15T12:00:00Z", "version_message": "Added diagrams" }
  ]
  ```

### 4.2 Revert to Specific Version
- **POST** `/documents/:id/versions/:version/revert`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "reverted_to_version": 40,
    "new_current_version": 43
  }
  ```

---

## 5. Comments Endpoints

### 5.1 Create Inline Comment
- **POST** `/documents/:id/comments`
- **Request Body:**
  ```json
  {
    "text": "Please review this paragraph.",
    "position": 120,
    "start_offset": 120,
    "end_offset": 160
  }
  ```
- **Response (201 Created):**
  ```json
  { "id": 5, "text": "Please review this paragraph.", "is_resolved": false }
  ```

### 5.2 Resolve Comment
- **PATCH** `/documents/:id/comments/:commentId/resolve`
- **Response (200 OK):**
  ```json
  { "id": 5, "is_resolved": true, "resolved_by": 1 }
  ```
