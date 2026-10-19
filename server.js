require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const { startWorker, processQueue } = require('./services/notificationService');

const app = express();
app.use(express.json());

app.use('/api/workshops', require('./routes/workshopRoutes'));
app.use('/api', require('./routes/registrationRoutes'));

app.get('/health', (_, res) => res.json({ ok: true }));


const PORT = process.env.PORT || 4000;

(async () => {

  await connectDB();

  await processQueue();
  startWorker();

  app.listen(PORT, () => console.log(`App on http://localhost:${PORT}`));
  
})();