# Reporta AI - Ollama Connection Setup Guide

This guide explains how to run the **Reporta AI LLM connection test app** and how to fix the common error:

> **Cannot connect to Ollama. Check VPN, SSH tunnel, and OLLAMA_URL.**

---

## 1. What this app does

This is a simple test app for the Reporta AI capstone project. It checks whether our **local backend** can send a prompt to the **remote Ollama LLM server** and receive a generated football report.

**Architecture (important):**

```
Browser UI  →  Local backend (Express)  →  SSH tunnel  →  Remote Ollama server
```

- The **frontend never calls Ollama directly**.
- The **backend** calls Ollama using the environment variable `OLLAMA_URL`.
- Default tunnel URL: `OLLAMA_URL=http://127.0.0.1:11434`

**Connection flow:**

1. User opens the website.
2. User clicks **Test Ollama Connection**.
3. Frontend calls the local backend (`http://localhost:3001`).
4. Backend calls Ollama through `OLLAMA_URL` (for example `http://127.0.0.1:11434/api/tags`).
5. Ollama returns a model list or a generated report.
6. Backend returns the response to the frontend.

**Tech stack:**

| Part | Technology |
|------|------------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| LLM | Ollama on a remote server machine |
| Access | VPN + SSH tunnel |

**Project structure:**

```
├── client/          React + Vite frontend
├── server/          Node.js + Express backend
├── package.json     Root scripts (run both apps)
└── README.md
```

**First-time install (from project root):**

```bash
npm install
cp server/.env.example server/.env
npm run dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:3001  

---

## 2. Common error

If you see this message in the app:

```
Cannot connect to Ollama. Check VPN, SSH tunnel, and OLLAMA_URL.
```

It usually means **one** of these problems:

| Problem | What it means |
|---------|----------------|
| VPN is not connected | Your laptop cannot reach the remote server network. |
| SSH tunnel is not running | Nothing is forwarding Ollama to your laptop on port 11434. |
| Wrong `OLLAMA_URL` in backend `.env` | Backend is calling the wrong address or port. |
| Ollama is not running on the remote server | The tunnel works but Ollama is down on the server. |
| Backend was not restarted after changing `.env` | Old settings are still in memory. |
| Local port is already in use | Another program (or old tunnel) is using port 11434. |

**Remember:** Turning on VPN alone is **not enough**. You must also keep an **SSH tunnel** open.

---

## 3. Required setup before using the app

Make sure you have:

- [ ] **VPN access** to server network  
- [ ] **SSH access** to the LLM server  
- [ ] **Node.js 18+** installed  
- [ ] This project **cloned** on your laptop  
- [ ] Dependencies installed (`npm install` from project root)  
- [ ] `server/.env` created (copy from `server/.env.example`)

**Connection placeholders (no real passwords in this repo):**

| Setting | Example value |
|---------|----------------|
| `REMOTE_USER` | `team-AUT2606` |
| `REMOTE_SERVER` | `172.20.20.102` |

Use your own SSH password when the terminal asks for it. **Do not put passwords in GitHub or in `.env` files that you commit.**

---

## 4. Windows setup

Use **PowerShell** for the steps below.

### Step 1: Connect VPN

1. Open **OpenVPN** (or your team VPN client).  
2. Connect to the VPN profile provided by your team.  
3. Wait until the connection shows as **Connected**.

### Step 2: Open PowerShell Terminal 1 — create SSH tunnel

Open a **new PowerShell** window and run:

```powershell
ssh -L 11434:127.0.0.1:11434 team-AUT2606@172.20.20.102
```

- Enter your **SSH password** when asked.  
- **Keep this terminal open** for the whole session.  
- If you close it, the tunnel stops and the app will fail.

**What this command does:**

- Your laptop’s port **11434** is forwarded to the remote machine’s Ollama port **11434**.
- The backend can call `http://127.0.0.1:11434` even though Ollama is actually on the remote server.

### Step 3: Open PowerShell Terminal 2 — test Ollama

In a **second** PowerShell window:

```powershell
curl.exe http://127.0.0.1:11434/api/tags
```

**Expected result:** JSON listing available models, for example `qwen2.5:14b`.

If this fails, fix the tunnel before opening the website.

### Step 4: Test report generation manually (optional)

```powershell
curl.exe http://127.0.0.1:11434/api/generate `
  -H "Content-Type: application/json" `
  -d "{ `"model`": `"qwen2.5:14b`", `"prompt`": `"Write a short football match report.`", `"stream`": false }"
```

If you get JSON with a `"response"` field containing text, Ollama is working end-to-end.

### Step 5: Check backend `.env`

Open `server/.env` and confirm:

```env
PORT=3001
OLLAMA_URL=http://127.0.0.1:11434
DEFAULT_MODEL=qwen2.5:14b
```

Copy from example if needed:

```powershell
copy server\.env.example server\.env
```

### Step 6: Restart backend

After any `.env` change, **stop** the backend (Ctrl+C) and start again.

From the **project root**:

```powershell
npm run dev
```

Or run only the backend:

```powershell
npm run dev:server
```

Or from the `server` folder:

```powershell
cd server
npm run dev
```

### Step 7: Start frontend and test in browser

1. If you used `npm run dev` at the root, the frontend starts automatically.  
   Otherwise, in another terminal: `npm run dev:client`  
2. Open http://localhost:5173  
3. Click **Test Ollama Connection** — you should see models listed.  
4. Load a sample, then click **Generate Report**.

---

## 5. macOS setup

Use **Terminal** for the steps below.

### Step 1: Connect VPN

1. Open **OpenVPN** (or your team VPN client).  
2. Connect to the VPN profile.  
3. Wait until connected.

### Step 2: Open Terminal 1 — create SSH tunnel

```bash
ssh -L 11434:127.0.0.1:11434 team-AUT2606@172.20.20.102
```

- Enter your SSH password when asked.  
- **Keep Terminal 1 open.**

### Step 3: Open Terminal 2 — test Ollama

```bash
curl http://127.0.0.1:11434/api/tags
```

**Expected result:** JSON with a `"models"` array.

### Step 4: Test report generation manually (optional)

```bash
curl http://127.0.0.1:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:14b",
    "prompt": "Write a short football match report.",
    "stream": false
  }'
```

### Step 5: Check backend `.env`

```env
PORT=3001
OLLAMA_URL=http://127.0.0.1:11434
DEFAULT_MODEL=qwen2.5:14b
```

Create from example if needed:

```bash
cp server/.env.example server/.env
```

### Step 6: Restart backend

From project root:

```bash
npm run dev
```

Or backend only:

```bash
npm run dev:server
```

### Step 7: Open frontend and test

1. Open http://localhost:5173  
2. Click **Test Ollama Connection**  
3. Try **Generate Report** with a sample dataset

---

## 6. If port 11434 is already used

Sometimes your laptop already uses port **11434** (another app or an old tunnel).

Use local port **11435** instead.

**SSH tunnel:**

```bash
ssh -L 11435:127.0.0.1:11434 team-AUT2606@172.20.20.102
```

**Update `server/.env`:**

```env
OLLAMA_URL=http://127.0.0.1:11435
```

**Restart the backend**, then test:

**Windows:**

```powershell
curl.exe http://127.0.0.1:11435/api/tags
```

**macOS:**

```bash
curl http://127.0.0.1:11435/api/tags
```

---

## 7. How to know which part is broken

| Problem | Likely cause | Fix |
|---------|----------------|-----|
| VPN cannot connect | VPN profile or credentials issue | Reconnect VPN or check VPN credentials with your team |
| SSH tunnel command fails | VPN not connected, wrong server IP, wrong SSH password, or server unreachable | Connect VPN first, then try SSH again with `team-AUT2606@172.20.20.102` |
| `/api/tags` does not work | SSH tunnel is not running or wrong local port | Keep tunnel terminal open; check `OLLAMA_URL` matches tunnel port (11434 or 11435) |
| `/api/tags` works but website still shows error | Backend `.env` is wrong or backend was not restarted | Set `OLLAMA_URL` correctly and restart backend |
| Backend works but frontend fails | Frontend is calling wrong backend URL | Check `client/src/api.js` — base URL should be `http://localhost:3001` |
| `EADDRINUSE` on port 3001 | Old backend still running | Stop other terminals running the server, or run `taskkill` / Activity Monitor on the Node process |
| Generate report is very slow | Model is loading or prompt is long | Wait 1–2 minutes; use `qwen2.5:14b`; keep the loading state — do not refresh |

**Quick isolation test:**

| Test | Command | If it fails, fix… |
|------|---------|-------------------|
| Ollama via tunnel | `curl` → `http://127.0.0.1:11434/api/tags` | VPN + SSH tunnel |
| Backend → Ollama | Open `http://localhost:3001/api/ollama/status` in browser | `.env` + restart backend |
| Full UI | Click **Test Ollama Connection** | Frontend + backend both running |

---

## 8. Quick checklist

Before using the app, confirm:

- [ ] VPN connected  
- [ ] SSH tunnel terminal is **open**  
- [ ] `curl` to `/api/tags` works  
- [ ] `server/.env` has correct `OLLAMA_URL`  
- [ ] Backend **restarted** after any `.env` change  
- [ ] Frontend is running (http://localhost:5173)  
- [ ] **Test Ollama Connection** works in the browser  
- [ ] **Generate Report** works with a sample JSON  

---

## 9. Security note

- **Do not commit** VPN passwords, SSH passwords, private keys, or server credentials to GitHub.  
- Use `.env` files for local configuration only.  
- `server/.env` is listed in `.gitignore` — keep it on your machine.  
- Share setup steps in this README, not real passwords.

---

## 10. Example successful result

**Successful `/api/tags` response (simplified):**

```json
{
  "models": [
    {
      "name": "qwen2.5:14b"
    }
  ]
}
```

**Successful `/api/generate` response (simplified):**

```json
{
  "response": "Sydney FC secured a 2-1 win..."
}
```

**Successful UI — Test Ollama Connection:**

```
Ollama is reachable at http://127.0.0.1:11434

Available models:
  - qwen2.5:14b
  - ...
```

---

## API reference (for developers)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ollama/status` | Proxies to `${OLLAMA_URL}/api/tags` |
| POST | `/api/reports/generate` | Builds prompt and calls `${OLLAMA_URL}/api/generate` |

Frontend API base URL: `http://localhost:3001` (see `client/src/api.js`).

---

## Need more help?

1. Work through **Section 8** checklist in order.  
2. Do not skip the SSH tunnel — it is required even when VPN is on.  
3. Ask a teammate to confirm `REMOTE_SERVER` and model name `qwen2.5:14b` are still correct for your environment.
