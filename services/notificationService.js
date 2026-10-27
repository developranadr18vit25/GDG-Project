const axios = require('axios');
const Notification = require('../models/Notification');
const { nextBackoff } = require('../utils/retry');

const NOTIFY_URL = process.env.NOTIFY_URL || 'http://localhost:6000/notify';
const MAX_ATTEMPTS = 10;


async function deliverOne(notification) {
  try {

    await axios.post(
      NOTIFY_URL,
      {
        type: notification.type,
        to: notification.recipientEmail,
        name: notification.recipientName,
        payload: notification.payload,
      },
      { timeout: 2500 }
    );

    notification.status = 'SENT';
    notification.sentAt = new Date();
    notification.lastError = undefined;

    await notification.save();

    console.log(`✅ Sent ${notification.type} → ${notification.recipientEmail}`);


  } catch (err) {
    notification.attempts += 1;
    notification.lastError = err.message;

    if (notification.attempts >= MAX_ATTEMPTS) {
      notification.status = 'FAILED';
      console.log(`❌ Giving up ${notification.type} → ${notification.recipientEmail}`);

    } else {
      notification.nextAttemptAt = nextBackoff(notification.attempts);

      console.log(
        `⚠️ Retry #${notification.attempts} for ${notification.recipientEmail} in ~${Math.round(
          (notification.nextAttemptAt - Date.now()) / 1000
        )}s (${err.message})`
      );

    }

    await notification.save();
  }
}

async function processQueue() {

  try {

    const due = await Notification.find({
      status: 'PENDING',
      nextAttemptAt: { $lte: new Date() },
    }).limit(20);


    await Promise.allSettled(due.map(deliverOne));
  } catch (e) {
    console.error('Worker error', e);
  }
}


function startWorker() {
  const interval = Number(process.env.WORKER_INTERVAL_MS || 3000);
  
  setInterval(processQueue, interval);
  console.log(`Notification worker started (every ${interval}ms)`);
}

module.exports = { startWorker, processQueue };