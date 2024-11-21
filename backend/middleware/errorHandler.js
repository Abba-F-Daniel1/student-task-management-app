const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Handle specific MySQL errors
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(404).json({
      error: 'Referenced record not found'
    });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({
      error: 'Cannot delete or update a parent row: a foreign key constraint fails'
    });
  }

  // Default error response
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
};

module.exports = errorHandler;