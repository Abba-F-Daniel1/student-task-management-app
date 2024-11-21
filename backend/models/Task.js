// Task.js
const db = require('../config/db.config');

const Task = {
  create: ({ title, description, dueDate, userEmail, reminder_enabled = false, last_reminder_sent = null, status = 'not_started' }) => {
    return new Promise((resolve, reject) => {
      const formattedDate = new Date(dueDate).toISOString().slice(0, 19).replace('T', ' ');
      const query = 'INSERT INTO tasks (title, description, dueDate, userEmail, reminder_enabled, last_reminder_sent, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
      db.query(query, [title, description, formattedDate, userEmail, reminder_enabled, last_reminder_sent, status], (err, result) => {
        if (err) return reject(err);
        resolve({ id: result.insertId, title, description, dueDate, userEmail, reminder_enabled, last_reminder_sent, status });
      });
    });
  },

  update: (id, fields) => {
    return new Promise((resolve, reject) => {
      // Convert the date format if dueDate is included in the update
      const updatedFields = { ...fields };
      if (updatedFields.dueDate) {
        updatedFields.dueDate = new Date(updatedFields.dueDate)
          .toISOString()
          .slice(0, 19)
          .replace('T', ' ');
      }

      // Filter out undefined fields to prevent setting them to NULL
      const updates = Object.keys(updatedFields)
        .filter((key) => updatedFields[key] !== undefined)
        .map((key) => `${key} = ?`)
        .join(', ');

      const values = Object.keys(updatedFields)
        .filter((key) => updatedFields[key] !== undefined)
        .map((key) => updatedFields[key]);

      // Add 'id' to the values array for the WHERE clause
      values.push(id);

      const query = `UPDATE tasks SET ${updates} WHERE id = ?`;

      db.query(query, values, (err, result) => {
        if (err) return reject(err);
        if (result.affectedRows === 0) return resolve(null);

        // Fetch the updated record
        db.query('SELECT * FROM tasks WHERE id = ?', [id], (err, rows) => {
          if (err) return reject(err);
          resolve(rows[0]);
        });
      });
    });
  },

  findAll: () => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM tasks';
      db.query(query, (err, results) => {
        if (err) return reject(err);
        // Format dates in the response
        const formattedResults = results.map(task => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null
        }));
        resolve(formattedResults);
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM tasks WHERE id = ?';
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) return resolve(null);

        // Format the date in the response
        const task = {
          ...results[0],
          dueDate: results[0].dueDate ? new Date(results[0].dueDate).toISOString() : null
        };
        resolve(task);
      });
    });
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      // First check if the task exists
      db.query('SELECT * FROM tasks WHERE id = ?', [id], (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) return resolve(false);

        // If task exists, proceed with deletion
        db.query('DELETE FROM tasks WHERE id = ?', [id], (err, result) => {
          if (err) return reject(err);
          resolve(true);
        });
      });
    });
  },
  findTasksNeedingReminders: () => {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const query = `
        SELECT * FROM tasks 
        WHERE reminder_enabled = true 
        AND status != 'completed'
        AND dueDate > NOW()
        AND (
          last_reminder_sent IS NULL
          OR (
            TIMESTAMPDIFF(HOUR, last_reminder_sent, dueDate) > 24 AND TIMESTAMPDIFF(HOUR, last_reminder_sent, NOW()) >= 24
            OR TIMESTAMPDIFF(HOUR, last_reminder_sent, dueDate) <= 24 AND TIMESTAMPDIFF(HOUR, last_reminder_sent, dueDate) > 2 AND TIMESTAMPDIFF(HOUR, last_reminder_sent, NOW()) >= 1
            OR TIMESTAMPDIFF(HOUR, last_reminder_sent, dueDate) <= 2 AND TIMESTAMPDIFF(MINUTE, last_reminder_sent, NOW()) >= 30
          )
        )`;

      db.query(query, (err, results) => {
        if (err) return reject(err);
        // Format dates in the response
        const formattedResults = results.map(task => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null
        }));
        resolve(formattedResults);
      });
    });
  },

};

module.exports = Task;