const router = require('express').Router();     // Create a new Express router instance

// Test route to check if API router is working
router.post('/test', function(req, res) {      // Define a POST endpoint at /api/test
  res.json({ requestBody: req.body });         // Echo back the request body as JSON
});

module.exports = router;                        // Export the router for use in other files