// Global error handler
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // prisma-specific errors
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Duplicate entry - resource already exists' });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found' });
  }

  // validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // default to 500 error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
