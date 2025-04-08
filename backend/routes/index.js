// backend/routes/index.js
const express = require('express');
const router = express.Router();

// Test route - serves as a health check and sets CSRF token
router.get('/hello/world', function(req, res) {
  res.cookie('XSRF-TOKEN', req.csrfToken());  // Set CSRF token in cookie for frontend
  res.send('Hello World!');                    // Simple response to confirm server works
});

// CSRF token restoration route
router.get("/api/csrf/restore", (req, res) => {
  const csrfToken = req.csrfToken();
  res.cookie("XSRF-TOKEN", csrfToken);         // Set token in cookie
  res.status(200).json({
    'XSRF-Token': csrfToken                    // Also return token in JSON response
  });
});

module.exports = router;