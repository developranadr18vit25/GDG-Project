const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    workshop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop',
      required: true,
    },
    memberEmail: { type: String, required: true },
    memberName: { type: String, required: true },
    status: {
      type: String,
      enum: ['CONFIRMED_PENDING_NOTIFY', 'NOTIFIED'],
      default: 'CONFIRMED_PENDING_NOTIFY',
    },
  },
  { timestamps: true }
);

registrationSchema.index({ workshop: 1, memberEmail: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);