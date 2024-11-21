const cron = require('node-cron');
const { Resend } = require('resend');
require('dotenv').config();
const Task = require('../models/Task');

// Initialize Resend with environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

const getTaskUrgency = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const hoursUntilDue = (due - now) / (1000 * 60 * 60);

  if (hoursUntilDue <= 2) return 'URGENT';
  if (hoursUntilDue <= 24) return 'HIGH';
  return 'NORMAL';
};

const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: process.env.TIMEZONE || 'UTC'
  });
};

const createEmailContent = (task) => {
  const urgency = getTaskUrgency(task.dueDate);
  const formattedDueDate = formatDate(task.dueDate);

  const userName = task.userEmail.split('@')[0]
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Task Reminder for ${userName}</h2>
          <div style="padding: 20px; border-radius: 5px; margin: 20px 0; background-color: ${
            urgency === 'URGENT' ? '#ffe6e6' :
            urgency === 'HIGH' ? '#fff3e6' : '#f5f5f5'
          }">
            <h3 style="margin-top: 0;">${task.title}</h3>
            <p><strong>Description:</strong> ${task.description || 'No description provided'}</p>
            <p><strong>Due Date:</strong> ${formattedDueDate}</p>
            <p><strong>Status:</strong> ${task.status.replace(/_/g, ' ')}</p>
            <p><strong>Urgency:</strong> ${urgency}</p>
          </div>
          <div>
            <a href="${process.env.FRONTEND_URL}/tasks/${task.id}" 
               style="background-color: #007bff; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              View Task
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    userName,
    htmlContent,
    urgency
  };
};

const sendEmailReminder = async (task) => {
  try {
    const { userName, htmlContent, urgency } = createEmailContent(task);
    let retries = 3;
    let lastError;

    while (retries > 0) {
      try {
        const { data, error } = await resend.emails.send({
          from: `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
          to: task.userEmail,
          subject: `${urgency === 'URGENT' ? '🚨 ' : ''}Task Reminder: ${task.title}`,
          html: htmlContent
        });

        if (error) throw error;

        // console.log({
        //   level: 'info',
        //   message: 'Email reminder sent successfully',
        //   taskId: task.id,
        //   urgencyLevel: urgency,
        //   emailId: data.id,
        //   timestamp: new Date().toISOString()
        // });

        await Task.update(task.id, {
          last_reminder_sent: new Date().toISOString()
        });

        return true;
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
        }
      }
    }

    throw lastError;
  } catch (error) {
    // console.error({
    //   level: 'error',
    //   message: 'Failed to send email reminder',
    //   taskId: task.id,
    //   error: error.message,
    //   timestamp: new Date().toISOString()
    // });
    return false;
  }
};

// Initialize the reminder service
const initializeReminderService = async () => {
  // Schedule to run every minute
  cron.schedule('* * * * *', async () => {
    try {
      // Get all tasks that need reminders
      const tasks = await Task.findTasksNeedingReminders();
      
      // Send reminders for each task
      for (const task of tasks) {
        await sendEmailReminder(task);
      }
    } catch (error) {
      // console.error({
      //   level: 'error',
      //   message: 'Failed to process reminder batch',
      //   error: error.message,
      //   timestamp: new Date().toISOString()
      // });
    }
  });
};

module.exports = {
  sendEmailReminder,
  initializeReminderService
};