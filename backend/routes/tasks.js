const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');


router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Reminder routes
router.post('/:id/reminder', taskController.enableReminder);
router.delete('/:id/reminder', taskController.disableReminder);
router.get('/:id/reminder', taskController.getReminderStatus);

module.exports = router;