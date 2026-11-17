# Deploying CollabWrite on Google Cloud

A complete, tested walkthrough for putting CollabWrite on a Google Compute
Engine VM so several people can use it at once over the public internet.

Every command here was run against a real deployment. The troubleshooting
section lists the mistakes that actually happened, not hypothetical ones.

**Time:** 30–40 minutes end to end, most of it waiting on the first Docker build.

---

## 1. What you are building

```
                    browser (any machine, anywhere)
                              │  http://<STATIC_IP>:3000
                              ▼
   ┌──────────────────────────────────────────────────┐
   │  Compute Engine VM  ·  e2-medium  ·  asia-south1 │
   │                                                  │
   │   frontend (nginx)  :3000 ─┐                     │
   │                            │ /api/  /socket.io/  │
   │   backend  (Node + engine) ┘  127.0.0.1:3001     │
   │        │                                         │
   │        ├── /var/lib/collabwrite  ← documents.dat │
   │        │                            wal.log      │
   │        │                            index.dat    │
   │        └── postgres  127.0.0.1:5432              │
   │              (users, titles, permissions only)   │
   └──────────────────────────────────────────────────┘
```

Only port **3000** is public. nginx reaches the backend over the Compose
network, so neither the backend nor PostgreSQL needs a published port.

### The constraint that shapes everything

**Run exactly one backend instance.** The lock table, buffer pool and WAL
writer are in-process data structures. Two instances pointing at one
`documents.dat` would each believe they held the only lock table and would
interleave writes into one log — that is corruption, not slow performance.

A single VM enforces this naturally. Do not add replicas, and do not put the
backend on a platform that autoscales. See `docker-and-k8s.md` section 1.

---

## 2. Prerequisites

- A Google account and a browser.
- A payment method. GCP requires card verification even on the free trial; it
  places a small authorisation and refunds it.
- Nothing installed locally. Every command below runs in **Cloud Shell** or on
  the VM itself.

### Cost

With the $300 / 90-day free trial, running `e2-medium` continuously costs about
$25/month plus ~$1 for the disk — roughly $75 of the credit over the whole
trial. The trial ends at 90 days or $300, whichever comes first, and stops
your resources rather than charging you.

To spend less, stop the VM between sessions (section 10) or use the
Always Free `e2-micro` in `us-west1` / `us-central1` / `us-east1` — free
forever, but 1 GB RAM and much higher latency from India.

---

## 3. Know which machine you are on

This is the single most common way to waste an hour.

| Prompt contains | You are on | Public? | Survives? |
|---|---|---|---|
| `...@cloudshell:~` | **Cloud Shell** — Google's admin terminal | **No** | No: deleted when the session ends |
| `...@collabwrite:~` | **Your VM** | **Yes** | Yes |

Cloud Shell is for running `gcloud` commands. The application is deployed
**on the VM**. Running `docker compose up` in Cloud Shell appears to work and
produces something nobody can reach, which then vanishes.

Steps 4–6 run in Cloud Shell. Steps 7 onward run on the VM.

---

## 4. Create the project (Cloud Shell)

Open [console.cloud.google.com](https://console.cloud.google.com), activate the
free trial, then open Cloud Shell (the `>_` icon, top right).

```bash
gcloud config set project <YOUR_PROJECT_ID>
gcloud services enable compute.googleapis.com
```

The second command takes a minute on a brand-new project.

## 5. Reserve a static IP (Cloud Shell)

```bash
gcloud compute addresses create collabwrite-ip --region=asia-south1
```

Without this the VM gets an ephemeral address that changes on every restart,
which silently breaks `CLIENT_ORIGIN` and produces a confusing CORS failure
later.

## 6. Create the VM and open the port (Cloud Shell)

```bash
gcloud compute instances create collabwrite \
  --zone=asia-south1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2404-lts-amd64 \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --address=collabwrite-ip \
  --tags=collabwrite

gcloud compute firewall-rules create allow-collabwrite \
  --allow=tcp:3000 \
  --target-tags=collabwrite \
  --source-ranges=0.0.0.0/0
```

Note your public address — this becomes your URL:

```bash
gcloud compute instances describe collabwrite --zone=asia-south1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

**`--tags=collabwrite` matters.** It scopes the firewall rule to this instance.
Without it the rule applies to every VM in the project.

> If the firewall command reports *"already exists"*, an earlier rule is in the
> way. Check it actually targets the tag:
> ```bash
> gcloud compute firewall-rules describe allow-collabwrite \
>   --format='table(name,allowed[].map().firewall_rule().list(),targetTags.list(),sourceRanges.list())'
> gcloud compute firewall-rules update allow-collabwrite \
>   --allow=tcp:3000 --target-tags=collabwrite --source-ranges=0.0.0.0/0
> ```
> A rule with an empty `TARGET_TAGS` will not reach your VM.

## 7. Connect and install Docker (VM)

```bash
gcloud compute ssh collabwrite --zone=asia-south1-a
```

Accept the SSH key prompt (Enter twice for no passphrase). **Your prompt now
changes to `...@collabwrite:~$`.** Everything from here runs on the VM.

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
exit
```

That `exit` is required, not optional. `usermod` adds you to the `docker`
group, and group membership is only read at login. Reconnect:

```bash
gcloud compute ssh collabwrite --zone=asia-south1-a
docker ps
```

An empty table (headers only) means it worked. `permission denied` means you
are still in the old session — `exit` and reconnect again.

**Do not type `exit` after a successful `docker ps`.** Stay on the VM.

## 8. Clone and configure (VM)

The block below refuses to run on the wrong machine, generates your secrets,
and reads the external IP from the metadata server so it cannot be mistyped.

```bash
if [ "$(hostname -s)" != "collabwrite" ]; then
  echo "WRONG MACHINE: you are on $(hostname -s). SSH to the VM first."
else
  cd ~
  git clone https://github.com/purvanshjoshi/CollabWrite.git
  cd CollabWrite
  cp .env.example .env

  IP=$(curl -s -H "Metadata-Flavor: Google" \
    http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)
  echo "External IP: $IP"

  sed -i \
    -e "s|^NODE_ENV=.*|NODE_ENV=production|" \
    -e "s|^TRUST_PROXY=.*|TRUST_PROXY=1|" \
    -e "s|^CLIENT_ORIGIN=.*|CLIENT_ORIGIN=http://$IP:3000|" \
    -e "s|^JWT_EXPIRATION=.*|JWT_EXPIRATION=8h|" \
    -e "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 48)|" \
    -e "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -hex 16)|" \
    -e "s|^AUTH_RATE_LIMIT=.*|AUTH_RATE_LIMIT=500|" \
    -e "s|^API_RATE_LIMIT=.*|API_RATE_LIMIT=3000|" \
    .env

  echo "BACKEND_TARGET=production" >> .env
fi
```

Confirm the result:

```bash
grep -E '^(NODE_ENV|BACKEND_TARGET|TRUST_PROXY|CLIENT_ORIGIN|VITE_API_URL|STORE_DRIVER|JWT_EXPIRATION)=' .env
```

```
NODE_ENV=production
CLIENT_ORIGIN=http://34.14.163.28:3000
TRUST_PROXY=1
VITE_API_URL=
STORE_DRIVER=postgres
JWT_EXPIRATION=8h
BACKEND_TARGET=production
```

### Why each of these matters

| Setting | Why |
|---|---|
| `VITE_API_URL=` **empty** | Empty makes the client use same-origin relative URLs, which nginx proxies. Set it to anything and every remote browser calls *its own* machine instead of your server. |
| `TRUST_PROXY=1` | nginx sits in front, so without this every request appears to come from nginx and the rate limiter buckets all users into one counter. One busy client then locks out the room. |
| `CLIENT_ORIGIN` | Must match the URL people type, exactly. There is no `*` fallback by design. |
| `JWT_EXPIRATION=8h` | There is no refresh-token flow. The 15-minute default signs people out mid-session. |
| `BACKEND_TARGET=production` | Selects the production Docker stage: runtime dependencies only, running as the unprivileged `node` user. Not in `.env.example`, so it has to be appended. |
| Raised rate limits | Everyone on one campus network shares a public IP, so they share a bucket even when `TRUST_PROXY` is correct. |

`JWT_SECRET` and `DB_PASSWORD` are generated above. Never ship the placeholders.

## 9. Deploy and verify (VM)

```bash
docker compose up -d --build
```

The first build takes 3–5 minutes. Then:

```bash
docker compose ps
curl -s localhost:3001/health
docker compose logs backend | tail -20
```

Expected:

```
collabwrite_postgres   Up (healthy)   127.0.0.1:5432->5432/tcp
collabwrite_backend    Up (healthy)   127.0.0.1:3001->3001/tcp
collabwrite_frontend   Up             0.0.0.0:3000->80/tcp

{"status":"ok","documents":0,"uptimeSeconds":81}
```

```
[INFO] [PostgresStore] PostgreSQL connected {"host":"postgres","database":"collabwrite"}
[INFO] [StorageManager] Storage opened {"file":"/var/lib/collabwrite/documents.dat","pages":4}
[INFO] [WAL] WAL opened {"file":"/var/lib/collabwrite/wal.log","records":0}
[INFO] [Engine] Engine started {"recovery":{"scanned":0,...}}
[INFO] [Server] CollabWrite listening {"host":"0.0.0.0","port":3001}
```

`/health` returns `status: "starting"` until crash recovery finishes, then
`"ok"`. There is no schema step: Compose mounts `database/init.sql` into
PostgreSQL's init directory, so the four support tables are created on first
boot. The seed file is deliberately **not** mounted — it creates three accounts
with the password `password123`, one of them an admin.

Finally, open `http://<STATIC_IP>:3000` **from a phone on mobile data**, not
campus Wi-Fi. That is the only test that proves it is genuinely public.

---

## 10. Day-two operations

```bash
docker compose logs -f backend      # live logs
docker compose restart backend      # restart (exercises WAL recovery)
docker compose down                 # stop containers, keep all data
docker compose up -d                # bring back
```

Stop the VM when you are not using it. Data and the IP both survive:

```bash
gcloud compute instances stop  collabwrite --zone=asia-south1-a
gcloud compute instances start collabwrite --zone=asia-south1-a
```

### Backups — read this before you need it

**Your documents are not in PostgreSQL.** They live in `documents.dat` and
`wal.log` inside the `enginedata` Docker volume. A database dump backs up
accounts and permissions and *none of your content*.

```bash
cd ~/CollabWrite
docker run --rm -v collabwrite_enginedata:/data -v $PWD:/backup alpine \
  tar czf /backup/enginedata.tgz -C /data .
docker compose exec -T postgres pg_dump -U collabuser collabwrite > pgdump.sql
```

Copy both off the VM:

```bash
# from Cloud Shell
gcloud compute scp collabwrite:~/CollabWrite/enginedata.tgz . --zone=asia-south1-a
gcloud compute scp collabwrite:~/CollabWrite/pgdump.sql    . --zone=asia-south1-a
```

Restore:

```bash
docker compose down
docker run --rm -v collabwrite_enginedata:/data -v $PWD:/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/enginedata.tgz -C /data"
docker compose up -d
```

`wal.log` grows without bound — log truncation is out of scope
(`design.md` §12). Watch the disk on any long-lived deployment.

---

## 11. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Page unreachable from outside | Firewall rule missing, or its `TARGET_TAGS` is empty | Section 6 |
| Page loads, every API call fails | `CLIENT_ORIGIN` ≠ the URL you typed | Match it exactly, no trailing slash, then `docker compose up -d` |
| Remote browsers hit their own machine | `VITE_API_URL` is not empty | Clear it, then `docker compose up -d --build` (it is baked in at build time) |
| `backend` stuck `Restarting` | Usually PostgreSQL auth | See below |
| `permission denied` from `docker` | Did not reconnect after `usermod` | `exit`, SSH again |
| Everyone shares one rate limit | `TRUST_PROXY` unset or not passed through | Confirm `grep -c TRUST_PROXY docker-compose.yml` returns ≥ 1 |
| `429 Too Many Requests` | Shared campus IP | Raise `AUTH_RATE_LIMIT` / `API_RATE_LIMIT` |
| Everything vanished after a restart | You deployed in Cloud Shell | Section 3 |

### The PostgreSQL password trap

`DB_PASSWORD` is only applied when PostgreSQL **initialises an empty volume**.
Changing it in `.env` afterwards does nothing: the old password stays baked
into `pgdata`, and the backend then crash-loops on authentication.

```bash
docker compose logs backend | grep -i "password\|auth"
```

Fix, **destroying all data**:

```bash
docker compose down -v      # -v deletes the volumes, including every document
docker compose up -d --build
```

Back up first (section 10) unless the deployment is genuinely empty.

---

## 12. Pre-demo checklist

- [ ] `curl http://<IP>:3000/health` returns `status: "ok"`
- [ ] Opened from a phone on mobile data, not campus Wi-Fi
- [ ] Accounts registered **in advance**, not live
- [ ] Two devices, one shared document, edits propagating both ways
- [ ] `JWT_SECRET` is not the placeholder
- [ ] Seed data not loaded
- [ ] VM left running so the first request is warm
- [ ] You know that two people editing the same text gives `409
      VERSION_CONFLICT` — correct behaviour, worth demonstrating deliberately
      rather than discovering live

### If port 3000 is blocked by the venue

Some institutional networks block outbound traffic to non-standard ports. Move
to port 80:

```bash
gcloud compute firewall-rules create allow-http-collabwrite \
  --allow=tcp:80 --target-tags=collabwrite --source-ranges=0.0.0.0/0
```

```bash
# on the VM
cd ~/CollabWrite
sed -i 's|"3000:80"|"80:80"|' docker-compose.yml
sed -i "s|^CLIENT_ORIGIN=.*|CLIENT_ORIGIN=http://<YOUR_IP>|" .env
docker compose up -d
```

The URL becomes `http://<YOUR_IP>` with no port. Test it before the demo.

---

## 13. Teardown

```bash
gcloud compute instances delete collabwrite --zone=asia-south1-a
gcloud compute addresses delete collabwrite-ip --region=asia-south1
gcloud compute firewall-rules delete allow-collabwrite
```

Deleting the instance deletes its disk and every document on it. Take the
backups in section 10 first if you want to keep anything.

---

## 14. What this deployment does not do

Stated plainly, because a deployment guide that overstates its coverage is
worse than none.

| Not done | Consequence |
|---|---|
| No HTTPS | Traffic is plaintext; browsers show "Not secure". Needs a domain plus Caddy or certbot. |
| No horizontal scaling | By design — see section 1. |
| No WAL truncation | `wal.log` grows forever; recovery time grows with it. |
| No automated backups | Section 10 is manual. |
| No monitoring or alerting | `/health` exists; nothing watches it. |
| Single zone | A zonal outage takes the service down. |

For a classroom demo or a portfolio deployment, every one of these is a
reasonable trade. For anything carrying real user data, they are not.
