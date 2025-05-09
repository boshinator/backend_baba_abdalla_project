const express = require('express');          // Import Express
const { Op } = require('sequelize');           // Import Sequelize operators
const bcrypt = require('bcryptjs');            // Import bcrypt for password comparison
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, restoreUser } = require('../../utils/auth');  // Import auth utilities
const { User } = require('../../db/models');   // Import User model

const router = express.Router();

const validateLogin = [
  check('credential')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('Please provide a valid email or username.'),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a password.'),
  handleValidationErrors
];

// Log in
router.post(
  '/',
  validateLogin,
  async (req, res, next) => {   // POST /api/session endpoint
    const { credential, password } = req.body;   // Extract credentials from request body

    // Find the user by either username or email
    const user = await User.unscoped().findOne({  // Use unscoped() to include hashedPassword
      where: {
        [Op.or]: {                              // Use OR operator to match either field
          username: credential,
          email: credential
        }
      }
    });

    // Check if user exists and password is correct
    if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
      const err = new Error('Login failed');     // Create error for failed login
      err.status = 401;                          // Set HTTP status code to 401 Unauthorized
      err.title = 'Login failed';
      err.errors = { credential: 'The provided credentials were invalid.' };
      return next(err);                          // Pass error to error-handling middleware
    }

    // Create a safe user object (without hashedPassword)
    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,                 // Include firstName
      lastName: user.lastName                    // Include lastName
    };

    // Set the JWT cookie
    await setTokenCookie(res, safeUser);         // Create and set JWT cookie

    // Return the user information
    return res.json({
      user: safeUser                            // Return user data as JSON
    });
  }
);

router.delete('/', (_req, res) => {            // DELETE /api/session endpoint
  res.clearCookie('token');                    // Remove the JWT cookie
  return res.json({ message: 'success' });     // Return success message
});

// Restore session user
router.get(
  '/',
  (req, res) => {
    const { user } = req;
    if (user) {
      const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,               // Include firstName
        lastName: user.lastName                  // Include lastName
      };
      return res.json({
        user: safeUser
      });
    } else return res.json({ user: null });
  }
);

module.exports = router;           