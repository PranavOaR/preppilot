# Judge0 CE — GCP Self-Hosted Setup

## 1. Create the VM

In GCP Console → Compute Engine → VM Instances → Create:

- **Machine type:** `e2-standard-2` (2 vCPU, 8 GB RAM) — ~$48/month
- **OS:** Ubuntu 22.04 LTS
- **Boot disk:** 20 GB SSD
- **Firewall:** allow TCP 2358 (see step 8 for restricting access)

## 2. Install Docker + Docker Compose

SSH into the VM, then:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# Log out and back in so the group takes effect
```

## 3. Copy files to the VM

```bash
scp judge0-gcp/docker-compose.yml judge0-gcp/judge0.conf YOUR_USER@YOUR_GCP_IP:~/judge0/
```

Or create them directly on the VM.

## 4. Set a strong Postgres password

Edit `judge0.conf` and replace `YourStrongPasswordHere` with a real password before starting.

## 5. Start Judge0

```bash
cd ~/judge0
docker compose up -d
```

Wait ~30 seconds for the database to initialise on first run.

## 6. Test it

```bash
curl -X POST http://YOUR_GCP_IP:2358/submissions?wait=true \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"hello\")", "language_id": 71}'
```

Expected: `{"stdout":"hello\n","status":{"id":3,"description":"Accepted"},...}`

## 7. Set the env var in your app

In Vercel (Settings → Environment Variables):

```
JUDGE0_SELF_HOSTED_URL=http://YOUR_GCP_IP:2358
```

Leave it empty or unset to fall back to RapidAPI.

## 8. Restrict firewall access

In GCP Console → VPC Network → Firewall rules, restrict port 2358 to only your app's IP.
**Do NOT leave it open to 0.0.0.0/0** — anyone could run code on your VM.

If using Vercel (no fixed egress IP), use a Cloud NAT gateway or a small proxy.

## 9. Cost estimate

| Resource | Monthly cost |
|---|---|
| e2-standard-2 VM | ~$48 |
| 20 GB SSD | ~$3.40 |
| Egress (light usage) | ~$1–5 |
| **Total** | **~$52–57/month** |

Break-even vs RapidAPI (~$0.001–0.002/request): ~26,000–52,000 requests/month (~500 active users × 50 runs avg).

## 10. Monitoring

```bash
# Check containers
docker compose ps

# Check server logs
docker compose logs server --tail=50 -f

# Check worker logs
docker compose logs workers --tail=50 -f
```
