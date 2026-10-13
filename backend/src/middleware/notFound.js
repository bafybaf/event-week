const notFound = (req, res, next) => {
  // Static files için 404 döndür, 500 değil
  if (req.originalUrl.includes('.ico') || 
      req.originalUrl.includes('.png') || 
      req.originalUrl.includes('.json') ||
      req.originalUrl.includes('.js') ||
      req.originalUrl.includes('.css')) {
    return res.status(404).json({ error: 'Static file not found' });
  }
  
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = notFound;
