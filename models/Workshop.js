const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    date: Date,
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELLED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workshop', workshopSchema);