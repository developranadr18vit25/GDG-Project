const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['REGISTRATION_CONFIRMATION', 'WORKSHOP_CANCELLATION'],
      required: true,
    },
    recipientEmail: { type: String, required: true },
    recipientName: String,
    payload: { type: Object, default: {} },

    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
    },
    attempts: { type: Number, default: 0 },
    lastError: String,
    nextAttemptAt: { type: Date, default: () => new Date() },
    sentAt: Date,
  },
  { timestamps: true }
);

// Worker query: pending + due
notificationSchema.index({ status: 1, nextAttemptAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);