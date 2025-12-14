const router = require('express').Router();
const controller = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const passport = require('../config/passport');
const {
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
} = require('../middlewares/rateLimiter');

router.post('/signup' /*, authLimiter*/, controller.signup);
router.get('/verify-email', controller.verifyEmail);
router.post(
  '/resend-verification',
  emailVerificationLimiter,
  controller.resendVerificationEmail
);
router.post('/login' /*, authLimiter*/, controller.login);
router.post('/refresh-token', controller.refreshAccessToken);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  controller.forgotPassword
);
router.post('/reset-password', passwordResetLimiter, controller.resetPassword);
router.post('/logout', protect, controller.logout);
router.patch('/update-password', protect, controller.updatePassword);
// Initiate Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  controller.googleCallback
);

module.exports = router;
