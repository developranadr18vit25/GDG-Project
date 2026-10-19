const router = require('express').Router();
const r = require('../controllers/registrationController');

router.get('/notifications', r.listNotifications);

module.exports = router;