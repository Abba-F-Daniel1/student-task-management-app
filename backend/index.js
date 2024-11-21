const express = require('express');
const cors = require('cors'); 
const taskRoutes = require('./routes/tasks');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();
const { initializeReminderService } = require('./utils/emailReminderService');


const app = express();

// Initialize reminder service
initializeReminderService().catch(error => {
  // console.error('Failed to initialize reminder service:', error);
});
// Enable CORS
app.use(cors({ origin: 'http://localhost:5173' })); 

app.use(express.json());

// Use task routes
app.use('/tasks', taskRoutes);

// Global error handler
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
