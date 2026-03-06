const User = require('../models/User');

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('-password -emailVerificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { profile: user } });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, email, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (avatar !== undefined) user.avatar = String(avatar).trim();
    if (email !== undefined && email !== user.email) {
      const existing = await User.findOne({ email: email.trim().toLowerCase() });
      if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });
      user.email = email.trim().toLowerCase();
      user.isEmailVerified = false;
    }

    await user.save();
    res.json({ success: true, data: { profile: user.toJSON() } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile };
