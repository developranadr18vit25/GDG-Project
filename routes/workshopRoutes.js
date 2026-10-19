const router = require('express').Router();
const c = require('../controllers/workshopController');
const r = require('../controllers/registrationController');

router.post('/', c.createWorkshop);
router.get('/', c.listWorkshops);
router.post('/:id/cancel', c.cancelWorkshop);

router.post('/:id/register', r.register);
router.get('/:id/registrations', r.listRegistrations);

module.exports = router;