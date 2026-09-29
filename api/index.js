// Import the Express app from server.js
const app = require('../server.js');

// Export as Vercel serverless handler
module.exports = (req, res) => {
  return app(req, res);
};

// Export app for compatibility
module.exports.app = app;
