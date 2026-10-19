# Workshop Registration & Notification Service

Backend-only MERN project (Node + Express + MongoDB) that demonstrates **reliable, crash-safe notification delivery** using the **transactional outbox pattern**.

- Organizers create/cancel workshops. Members register (once per workshop).
- Every successful registration **eventually** produces a confirmation.
- Every cancellation notifies **all** registered members.
- Delivery is retried with exponential backoff if the notification service is down.
- Notifications survive backend restarts and one member's failure never blocks others.

A **mock notification service** is included — it randomly fails/times out so retries can be demonstrated. No real email/SMS integration.

---

## Quick Start

```bash
# Terminal 1 — MongoDB
mongod --dbpath ./data

# Terminal 2 — Mock notification service
cd mock-notification-service && npm install && npm start

# Terminal 3 — Main app
npm install && npm start
```

Sanity check: `curl http://localhost:4000/health` → `{"ok":true}`

---

## Project Structure

```
workshop-service/
├── .env
├── package.json
├── server.js
├── config/db.js
├── models/
│   ├── Workshop.js
│   ├── Registration.js
│   └── Notification.js          ← outbox queue
├── routes/
│   ├── workshopRoutes.js
│   └── registrationRoutes.js
├── controllers/
│   ├── workshopController.js
│   └── registrationController.js
├── services/notificationService.js   ← background worker
├── utils/retry.js
└── mock-notification-service/
    ├── package.json
    └── mockServer.js
```

---

## Configuration (`.env`)

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/workshop_db
NOTIFY_URL=http://localhost:5000/notify
WORKER_INTERVAL_MS=3000
```

---

## API Reference

| Method | Endpoint                              | Purpose                              |
| ------ | ------------------------------------- | ------------------------------------ |
| POST   | `/api/workshops`                      | Create workshop                      |
| GET    | `/api/workshops`                      | List workshops                       |
| POST   | `/api/workshops/:id/register`         | Register a member (returns immediately) |
| GET    | `/api/workshops/:id/registrations`    | List registrations                   |
| POST   | `/api/workshops/:id/cancel`           | Cancel + queue cancellation notices  |
| GET    | `/api/notifications`                  | Inspect outbox queue (demo helper)   |
| GET    | `/health`                             | Health check                         |

**Register body:** `{ "memberEmail": "...", "memberName": "..." }` → 201; duplicate → 409.

Mock service controls: `GET :5000/toggle/down`, `GET :5000/toggle/slow`, `POST :5000/notify`.

---

## Demo (cURL)

```bash
# 1. Create workshop
WID=$(curl -s -X POST http://localhost:4000/api/workshops \
  -H "Content-Type: application/json" \
  -d '{"title":"Node 101","date":"2026-01-10"}' \
  | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)

# 2. Register — returns 201 instantly; confirmation sent in background
curl -X POST http://localhost:4000/api/workshops/$WID/register \
  -H "Content-Type: application/json" \
  -d '{"memberEmail":"alice@x.com","memberName":"Alice"}'

# 3. Duplicate → 409
curl -X POST http://localhost:4000/api/workshops/$WID/register \
  -H "Content-Type: application/json" \
  -d '{"memberEmail":"alice@x.com","memberName":"Alice"}'

# 4. Failure + retry
curl http://localhost:5000/toggle/down
curl -X POST http://localhost:4000/api/workshops/$WID/register \
  -H "Content-Type: application/json" \
  -d '{"memberEmail":"bob@x.com","memberName":"Bob"}'
curl http://localhost:4000/api/notifications        # bob: PENDING, attempts climbing

# 5. Recovery
curl http://localhost:5000/toggle/down              # back on
sleep 5
curl http://localhost:4000/api/notifications        # bob: SENT

# 6. Restart safety — register, Ctrl+C the app, npm start again
curl http://localhost:5000/toggle/down
curl -X POST http://localhost:4000/api/workshops/$WID/register \
  -H "Content-Type: application/json" \
  -d '{"memberEmail":"carol@x.com","memberName":"Carol"}'
# Ctrl+C → npm start → toggle back on → carol's row flips to SENT

# 7. Cancellation
curl -X POST http://localhost:4000/api/workshops/$WID/cancel
curl http://localhost:4000/api/notifications
```

---

## Design in Brief

- **Outbox pattern** — registration and its pending `Notification` row are written to MongoDB *before* responding. Delivery is done by a background worker.
- **Fast response** — the register handler never calls the notification service; it just writes two rows and returns 201.
- **Restart safety** — pending jobs live in MongoDB; `server.js` calls `await processQueue()` on boot before starting the polling loop.
- **Retries** — worker picks up `PENDING` rows where `nextAttemptAt <= now`; failures schedule the next attempt via exponential backoff (`2^attempts`, capped at 60s). After 10 attempts the row is marked `FAILED`.
- **Isolation** — each notification is processed in its own try/catch inside `Promise.allSettled`, so one failure can't block others.
- **Cancellation** — `cancelWorkshop` inserts one `WORKSHOP_CANCELLATION` job per registration; the same worker handles them.
- **Duplicate delivery** — the system is **at-least-once**; the notification `_id` is included in the payload as an idempotency key for any receiving service that wishes to dedupe (the mock does not).

---

## Trade-offs (intentional, for scope)

- Single worker process (multi-instance would need row leases via `findOneAndUpdate` + `lockedUntil`).
- No dead-letter UI — `FAILED` rows are visible via `GET /api/notifications`.
- At-least-once delivery (exactly-once with an external HTTP service is impossible).

---

## Troubleshooting

| Symptom                        | Check                                              |
| ------------------------------ | -------------------------------------------------- |
| No `MongoDB connected` log     | Is `mongod` running? Correct `MONGO_URI`?          |
| Notifications stuck `PENDING`  | Is mock service running? `/toggle/down` or `/toggle/slow` on? See `lastError` on the row. |
| 409 on register                | Expected — one registration per member per workshop. |
| Port in use                    | Change `PORT` in `.env`.                            |

---

## License

MIT
