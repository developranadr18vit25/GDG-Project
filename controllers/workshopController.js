const Workshop = require('../models/Workshop');
const Registration = require('../models/Registration');
const Notification = require('../models/Notification');

// POST /api/workshops
exports.createWorkshop = async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const workshop = await Workshop.create({ title, description, date });
    res.status(201).json(workshop);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET /api/workshops
exports.listWorkshops = async (req, res) => {
  const workshops = await Workshop.find().sort({ createdAt: -1 });
  res.json(workshops);
};

// POST /api/workshops/:id/cancel
exports.cancelWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) return res.status(404).json({ error: 'Workshop not found' });
    if (workshop.status === 'CANCELLED')
      return res.status(400).json({ error: 'Already cancelled' });

    workshop.status = 'CANCELLED';
    await workshop.save();

    // Create one notification job per registered member (durable outbox).
    const registrations = await Registration.find({ workshop: workshop._id });
    const jobs = registrations.map((r) => ({
      type: 'WORKSHOP_CANCELLATION',
      recipientEmail: r.memberEmail,
      recipientName: r.memberName,
      payload: { workshopId: workshop._id, workshopTitle: workshop.title },
      status: 'PENDING',
      nextAttemptAt: new Date(),
    }));

    if (jobs.length) await Notification.insertMany(jobs);

    res.json({
      message: 'Workshop cancelled. Notifications queued.',
      queued: jobs.length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};