const express = require('express');

const app = express();
app.use(express.json());


let forceDown = false;    
let forceSlow = false;    

app.get('/toggle/down', (_, res) => {
  forceDown = !forceDown;
  res.json({ forceDown });

});

app.get('/toggle/slow', (_, res) => {

  forceSlow = !forceSlow;
  res.json({ forceSlow });

});


app.post('/notify', (req, res) => {
  const { to, type } = req.body || {};

  if (forceSlow) {

    console.log(`⏱  [SLOW] dropping ${type} -> ${to}`);
    return;
  }

  if (forceDown) {
    console.log(`❌ [DOWN] 500 for ${type} -> ${to}`);
    return res.status(500).json({ error: 'notification service down' });
  }


  if (Math.random() < 0.3) {
    console.log(`⚠️  [RANDOM FAIL] ${type} -> ${to}`);
    return res.status(500).json({ error: 'random failure' });
  }

  console.log(`✅ [OK] ${type} -> ${to}`);
  res.json({ ok: true });
  
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Mock notification service on :${PORT}`));