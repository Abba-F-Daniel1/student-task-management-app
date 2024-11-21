const Task = require('../models/Task');
const { taskCreationSchema, taskUpdateSchema } = require('../validation/taskValidation');
const { sendEmailReminder } = require('../utils/emailReminderService');

// Helper function to update task status based on time
const updateTaskStatusBasedOnTime = (task) => {
  const now = new Date();
  const dueDate = new Date(task.dueDate);

  if (task.status !== 'completed' && dueDate < now) {
    return 'overdue';
  } else if (task.status === 'not_started' && dueDate > now) {
    return 'not_started';
  } else {
    return task.status;
  }
};

// Create task with reminder setup
exports.createTask = async (req, res, next) => {
  try {
    const { error } = taskCreationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, description, dueDate, userEmail, reminderEnabled = false } = req.body;
    const newTask = await Task.create({ 
      title, 
      description, 
      dueDate, 
      userEmail,
      reminder_enabled: reminderEnabled,
      last_reminder_sent: null,
      status: 'not_started'
    });

    // Send initial reminder if enabled
    if (reminderEnabled) {
      const reminderSent = await sendEmailReminder(newTask);
      if (reminderSent) {
        await Task.update(newTask.id, {
          last_reminder_sent: new Date().toISOString()
        });
      }
    }

    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
};

exports.enableReminder = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await Task.update(taskId, {
      reminder_enabled: true,
      last_reminder_sent: null
    });

    // Send initial reminder
    const reminderSent = await sendEmailReminder(updatedTask);
    if (reminderSent) {
      await Task.update(taskId, {
        last_reminder_sent: new Date().toISOString()
      });
    }

    res.json({ 
      success: true, 
      message: 'Reminder enabled successfully',
      task: updatedTask
    });
  } catch (err) {
    next(err);
  }
};

exports.disableReminder = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await Task.update(taskId, {
      reminder_enabled: false,
      last_reminder_sent: null
    });

    res.json({ 
      success: true, 
      message: 'Reminder disabled successfully',
      task: updatedTask
    });
  } catch (err) {
    next(err);
  }
};

exports.getReminderStatus = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      enabled: task.reminder_enabled || false,
      lastSent: task.last_reminder_sent,
      nextReminder: task.reminder_enabled ? calculateNextReminder(task) : null
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { error } = taskUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { status, reminder_enabled } = req.body;
    
    if (status === 'completed') {
      req.body.completed_at = new Date();
    }

    if (reminder_enabled !== undefined) {
      req.body.last_reminder_sent = null;
    }

    const updatedTask = await Task.update(req.params.id, req.body);
    if (!updatedTask) return res.status(404).json({ error: 'Task not found' });

    if (reminder_enabled && !updatedTask.last_reminder_sent) {
      const reminderSent = await sendEmailReminder(updatedTask);
      if (reminderSent) {
        updatedTask.last_reminder_sent = new Date().toISOString();
        await Task.update(req.params.id, {
          last_reminder_sent: updatedTask.last_reminder_sent
        });
      }
    }

    res.json(updatedTask);
  } catch (err) {
    next(err);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.findAll();

    const updatedTasks = await Promise.all(
      tasks.map(async (task) => {
        const newStatus = updateTaskStatusBasedOnTime(task);

        if (newStatus !== task.status) {
          task.status = newStatus;
          await Task.update(task.id, { status: newStatus });
        }

        return task;
      })
    );

    res.json(updatedTasks);
  } catch (err) {
    next(err);
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const deleted = await Task.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

// Helper function to calculate next reminder time
const calculateNextReminder = (task) => {
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const hoursTillDue = (dueDate - now) / (1000 * 60 * 60);

  if (hoursTillDue <= 2) {
    return new Date(now.getTime() + 30 * 60000); // 30 minutes from now
  } else if (hoursTillDue <= 24) {
    return new Date(now.getTime() + 60 * 60000); // 1 hour from now
  } else {
    return new Date(dueDate.getTime() - 24 * 60 * 60000); // 24 hours before due
  }
};