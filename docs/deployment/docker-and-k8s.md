# Deployment & Infrastructure Guide

## 1. Local & Containerized Setup with Docker Compose

### 1.1 Quickstart

```bash
# 1. Clone repository
git clone https://github.com/purvanshjoshi/CollabWrite.git
cd CollabWrite

# 2. Configure environment
cp .env.example .env

# 3. Start database, cache, backend, and frontend
docker-compose up -d --build

# 4. View running services
docker-compose ps
```

- **Frontend Application:** `http://localhost:3000`
- **Backend API & WebSocket:** `http://localhost:3001`
- **PostgreSQL Database:** `localhost:5432`
- **Redis Pub/Sub:** `localhost:6379`

---

## 2. Production Nginx Configuration & SSL Termination

```nginx
upstream collabwrite_backend {
    ip_hash; # Sticky sessions for WebSocket handshakes
    server 10.0.0.10:3001;
    server 10.0.0.11:3001;
}

server {
    listen 80;
    server_name collabwrite.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name collabwrite.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/collabwrite.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/collabwrite.yourdomain.com/privkey.pem;

    # REST API Proxy
    location /api/ {
        proxy_pass http://collabwrite_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Real-Time Connection Proxy
    location /socket.io/ {
        proxy_pass http://collabwrite_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Frontend Static Assets
    location / {
        root /var/www/collabwrite/frontend/build;
        try_files $uri /index.html;
    }
}
```

---

## 3. Kubernetes (K8s) Production Architecture

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: collabwrite-backend
  labels:
    app: collabwrite-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: collabwrite-backend
  template:
    metadata:
      labels:
        app: collabwrite-backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/purvanshjoshi/collabwrite-backend:v1.0.0
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: collabwrite-config
        - secretRef:
            name: collabwrite-secrets
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
          requests:
            cpu: "250m"
            memory: "256Mi"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 3001
          initialDelaySeconds: 15
          periodSeconds: 10
```
