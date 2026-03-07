const User = require('../models/User');
const { createEmailVerificationToken, createResetPasswordToken, signAccessToken, signRefreshToken, verifyToken, hashToken } = require('../utils/tokens');
const { sendMail, verificationEmail, resetPasswordEmail } = require('../utils/email');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const { token, expires } = createEmailVerificationToken();
    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: expires,
    });
    const mailOpts = verificationEmail(user.email, user.name, token);
    await sendMail(mailOpts);
    const accessToken = signAccessToken({ userId: user._id });
    const refreshToken = signRefreshToken({ userId: user._id });
    res.status(201).json({
      success: true,
      message: 'Registered. Please verify your email.',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
        expiresIn: '7d',
      },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Static Admin User Bypass
    // if (email === 'admin@gmail.com' && password === '12345678') {
    //   const adminId = '000000000000000000000000'; // Mocked ObjectId
    //   const accessToken = signAccessToken({ userId: adminId });
    //   const refreshToken = signRefreshToken({ userId: adminId });
    //   return res.json({
    //     success: true,
    //     data: {
    //       user: {
    //         _id: adminId,
    //         name: 'System Admin',
    //         email: 'admin',
    //         role: 'admin',
    //         isEmailVerified: true
    //       },
    //       accessToken,
    //       refreshToken,
    //       expiresIn: '7d',
    //     },
    //   });
    // }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const accessToken = signAccessToken({ userId: user._id });
    const refreshToken = signRefreshToken({ userId: user._id });
    res.json({
      success: true,
      data: {
        user: (await User.findById(user._id)).toJSON(),
        accessToken,
        refreshToken,
        expiresIn: '7d',
      },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }
    const decoded = verifyToken(refreshToken);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    const accessToken = signAccessToken({ userId: user._id });
    const newRefreshToken = signRefreshToken({ userId: user._id });
    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: '7d',
      },
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token required' });
    }
    const hashed = hashToken(token);
    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

async function verifyEmailFromQuery(req, res, next) {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token required' });
    }
    // Reuse the same logic by delegating into the existing handler shape.
    req.body = { token };
    return verifyEmail(req, res, next);
  } catch (err) {
    next(err);
  }
}

async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }
    const { token, expires } = createEmailVerificationToken();
    user.emailVerificationToken = hashToken(token);
    user.emailVerificationExpires = expires;
    await user.save({ validateBeforeSave: false });
    const mailOpts = verificationEmail(user.email, user.name, token);
    await sendMail(mailOpts);
    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: true, message: 'If an account exists, a reset link has been sent' });
    }
    const { token, expires } = createResetPasswordToken();
    user.resetPasswordToken = hashToken(token);
    user.resetPasswordExpires = expires;
    await user.save({ validateBeforeSave: false });
    const mailOpts = resetPasswordEmail(user.email, user.name, token);
    await sendMail(mailOpts);
    res.json({ success: true, message: 'If an account exists, a reset link has been sent' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password required' });
    }
    const hashed = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    }
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    // Return mocked admin user if the JWT decodes to the admin ID
    if (req.user._id.toString() === '000000000000000000000000') {
      return res.json({
        success: true, data: {
          user: {
            _id: req.user._id,
            name: 'System Admin',
            email: 'admin',
            role: 'admin',
            isEmailVerified: true
          }
        }
      });
    }
    res.json({ success: true, data: { user: req.user } });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const match = await user.comparePassword(currentPassword);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

async function verifyEmailDev(req, res, next) {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Dev mode: Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  verifyEmail,
  verifyEmailFromQuery,
  verifyEmailDev,
  resendVerification,
  forgotPassword,
  resetPassword,
  me,
  changePassword,
};
