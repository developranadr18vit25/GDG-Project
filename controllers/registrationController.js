const Workshop = require('../models/Workshop');
const Registration = require('../models/Registration');
const Notification = require('../models/Notification');

exports.register = async (req, res) => {

  const { memberEmail, memberName } = req.body;

  if (!memberEmail || !memberName)
    return res.status(400).json({ error: 'memberEmail and memberName required' });

  try {

    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) return res.status(404).json({ error: 'Workshop not found' });

    if (workshop.status === 'CANCELLED')
      return res.status(400).json({ error: 'Workshop is cancelled' });

    const existing = await Registration.findOne({
      workshop: workshop._id,
      memberEmail,
    });

    if (existing)
      return res.status(409).json({ error: 'Already registered for this workshop' });

    const registration = await Registration.create({
      workshop: workshop._id,
      memberEmail,
      memberName,
    });


    await Notification.create({
      type: 'REGISTRATION_CONFIRMATION',
      recipientEmail: memberEmail,
      recipientName: memberName,
      payload: {
        registrationId: registration._id,
        workshopId: workshop._id,
        workshopTitle: workshop.title,
      },
      status: 'PENDING',
      nextAttemptAt: new Date(),
    });


    res.status(201).json({
      message: 'Registered. Confirmation will be sent shortly.',
      registrationId: registration._id,
    });

  } catch (e) {
    if (e.code === 11000)
      return res.status(409).json({ error: 'Already registered for this workshop' });
    res.status(500).json({ error: e.message });
  }
};

exports.listRegistrations = async (req, res) => {
  const regs = await Registration.find({ workshop: req.params.id });
  res.json(regs);
};

exports.listNotifications = async (req, res) => {
  const list = await Notification.find().sort({ createdAt: -1 }).limit(100);
  res.json(list);
};