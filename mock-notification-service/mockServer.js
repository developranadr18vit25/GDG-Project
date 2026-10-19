const express = require('express');

const app = express();
app.use(express.json());

// Demo control
let forceDown = false;    // when true, always fail
let forceSlow = false;    // when true, always time out (no response)

app.get('/toggle/down', (_, res) => {
  forceDown = !forceDown;
  res.json({ forceDown });
});
app.get('/toggle/slow', (_, res) => {
  forceSlow = !forceSlow;
  res.json({ forceSlow });
});

// POST /notify
app.post('/notify', (req, res) => {
  const { to, type } = req.body || {};

  if (forceSlow) {
    // Never respond -> client timeout
    console.log(`⏱  [SLOW] dropping ${type} -> ${to}`);
    return;
  }

  if (forceDown) {
    console.log(`❌ [DOWN] 500 for ${type} -> ${to}`);
    return res.status(500).json({ error: 'notification service down' });
  }

  // ~30% random failure for realistic retries
  if (Math.random() < 0.3) {
    console.log(`⚠️  [RANDOM FAIL] ${type} -> ${to}`);
    return res.status(500).json({ error: 'random failure' });
  }

  console.log(`✅ [OK] ${type} -> ${to}`);
  res.json({ ok: true });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Mock notification service on :${PORT}`));