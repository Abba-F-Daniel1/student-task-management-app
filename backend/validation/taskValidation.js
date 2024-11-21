const Joi = require('joi');

const taskCreationSchema = Joi.object({
  title: Joi.string().min(3).max(255).required().messages({
    'string.empty': 'Title cannot be empty',
    'string.min': 'Title should be at least 3 characters',
    'string.max': 'Title should be at most 255 characters',
    'any.required': 'Title is a required field',
  }),
  description: Joi.string().optional().allow(''),
  dueDate: Joi.date().iso().required().messages({
    'date.base': 'Due date must be a valid date',
    'any.required': 'Due date is required',
  }),
  userEmail: Joi.string().email().required().messages({
    'string.email': 'User email must be a valid email address',
    'any.required': 'User email is required',
  }),
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().optional().allow(''),
  dueDate: Joi.date().iso().optional(),
  status: Joi.string().valid('not_started', 'in_progress', 'completed', 'cancelled', 'overdue').optional(),
});

module.exports = {
  taskCreationSchema,
  taskUpdateSchema,
};
