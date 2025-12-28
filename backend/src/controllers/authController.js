const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendEmail, generateVerificationCode, validatePassword } = require('../utils/sendEmail');

// @desc   Register new user (sends verification code)
// @route  POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please provide name, email, and password',
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: 'Password does not meet requirements',
        checks: passwordValidation.checks,
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      // If existing admin user, update and mark as verified without sending email
      if (userExists.isAdmin) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        userExists.name = name;
        userExists.password = hashedPassword;
        userExists.isVerified = true;
        userExists.verificationCode = null;
        userExists.verificationCodeExpires = null;
        await userExists.save();

        return res.status(200).json({
          message: 'Admin account updated and verified',
          email: userExists.email,
          requiresVerification: false,
        });
      }

      // If user exists but is not verified, allow re-registration for non-admins
      if (!userExists.isVerified) {
        // Update existing unverified user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        userExists.name = name;
        userExists.password = hashedPassword;
        userExists.verificationCode = verificationCode;
        userExists.verificationCodeExpires = verificationCodeExpires;
        await userExists.save();

        // Send verification email
        await sendEmail({
          to: email,
          subject: 'ReadTrack - Verify Your Email',
          text: `Your verification code is: ${verificationCode}\n\nThis code will expire in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #382110;">Welcome to ReadTrack!</h2>
              <p>Your verification code is:</p>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #382110;">
                ${verificationCode}
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                This code will expire in 10 minutes.
              </p>
            </div>
          `,
        });

        return res.status(200).json({
          message: 'Verification code sent to your email',
          email: userExists.email,
          requiresVerification: true,
        });
      }

      return res.status(400).json({
        message: 'User already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isAdmin: false,
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
    });

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'ReadTrack - Verify Your Email',
      text: `Your verification code is: ${verificationCode}\n\nThis code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #382110;">Welcome to ReadTrack!</h2>
          <p>Your verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #382110;">
            ${verificationCode}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This code will expire in 10 minutes.
          </p>
        </div>
      `,
    });

    return res.status(201).json({
      message: 'Verification code sent to your email',
      email: user.email,
      requiresVerification: true,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while registering user',
    });
  }
};

// @desc   Verify email with code
// @route  POST /api/auth/verify-email
// @access Public
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: 'Please provide email and verification code',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // If user is an admin, treat as already verified and skip code validation
    if (user.isAdmin) {
      user.isVerified = true;
      user.verificationCode = null;
      user.verificationCodeExpires = null;
      await user.save();

      const token = generateToken(user._id);

      return res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token,
        message: 'Admin account verified automatically',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: 'Email is already verified',
      });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({
        message: 'Invalid verification code',
      });
    }

    if (new Date() > user.verificationCodeExpires) {
      return res.status(400).json({
        message: 'Verification code has expired. Please register again.',
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while verifying email',
    });
  }
};

// @desc   Resend verification code
// @route  POST /api/auth/resend-verification
// @access Public
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Please provide email',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // Admin accounts do not require verification; return informative response
    if (user.isAdmin) {
      return res.status(200).json({
        message: 'Admin accounts do not require verification',
        email: user.email,
      });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    await sendEmail({
      to: email,
      subject: 'ReadTrack - New Verification Code',
      text: `Your new verification code is: ${verificationCode}\n\nThis code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #382110;">ReadTrack Verification</h2>
          <p>Your new verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #382110;">
            ${verificationCode}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This code will expire in 10 minutes.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message: 'New verification code sent to your email',
      email: user.email,
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while resending verification',
    });
  }
};

// @desc   Forgot password - send reset code
// @route  POST /api/auth/forgot-password
// @access Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Please provide email',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        message: 'If an account with that email exists, a reset code has been sent.',
        email,
      });
    }

    const resetCode = generateVerificationCode();
    const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = resetCodeExpires;
    await user.save();

    await sendEmail({
      to: email,
      subject: 'ReadTrack - Password Reset Code',
      text: `Your password reset code is: ${resetCode}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #382110;">Password Reset</h2>
          <p>Your password reset code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #382110;">
            ${resetCode}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This code will expire in 10 minutes.
          </p>
          <p style="color: #999; font-size: 12px;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message: 'If an account with that email exists, a reset code has been sent.',
      email,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while processing forgot password',
    });
  }
};

// @desc   Verify reset code
// @route  POST /api/auth/verify-reset-code
// @access Public
const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: 'Please provide email and reset code',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid email or reset code',
      });
    }

    if (user.resetPasswordCode !== code) {
      return res.status(400).json({
        message: 'Invalid reset code',
      });
    }

    if (new Date() > user.resetPasswordExpires) {
      return res.status(400).json({
        message: 'Reset code has expired. Please request a new one.',
      });
    }

    return res.status(200).json({
      message: 'Reset code verified',
      email,
      codeValid: true,
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while verifying reset code',
    });
  }
};

// @desc   Reset password with verified code
// @route  POST /api/auth/reset-password
// @access Public
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        message: 'Please provide email, code, and new password',
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: 'Password does not meet requirements',
        checks: passwordValidation.checks,
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid email or reset code',
      });
    }

    if (user.resetPasswordCode !== code) {
      return res.status(400).json({
        message: 'Invalid reset code',
      });
    }

    if (new Date() > user.resetPasswordExpires) {
      return res.status(400).json({
        message: 'Reset code has expired. Please request a new one.',
      });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    // Also verify user if not already verified
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while resetting password',
    });
  }
};

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Check if user is verified (admins skip verification)
    if (!user.isVerified && !user.isAdmin) {
      // Send a new verification code
      const verificationCode = generateVerificationCode();
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

      user.verificationCode = verificationCode;
      user.verificationCodeExpires = verificationCodeExpires;
      await user.save();

      await sendEmail({
        to: email,
        subject: 'ReadTrack - Verify Your Email',
        text: `Your verification code is: ${verificationCode}\n\nThis code will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #382110;">Verify Your Email</h2>
            <p>Your verification code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #382110;">
              ${verificationCode}
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This code will expire in 10 minutes.
            </p>
          </div>
        `,
      });

      return res.status(403).json({
        message: 'Email not verified. A new verification code has been sent.',
        email: user.email,
        requiresVerification: true,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while logging in',
    });
  }
};

// @desc   Get current user profile
// @route  GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    return res.json(user);
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while fetching profile',
    });
  }
};
// @desc   Update current user profile
// @route  PUT /api/auth/me
// @access Private
const updateMe = async (req, res) => {
  try {
    const { name, bio, avatarUrl, favouriteGenres } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (favouriteGenres !== undefined) {
      // expecting array of strings
      user.favouriteGenres = Array.isArray(favouriteGenres)
        ? favouriteGenres
        : [];
    }

    const saved = await user.save();

    return res.json({
      _id: saved._id,
      name: saved.name,
      email: saved.email,
      bio: saved.bio,
      avatarUrl: saved.avatarUrl,
      favouriteGenres: saved.favouriteGenres,
      isAdmin: saved.isAdmin,
      createdAt: saved.createdAt,
    });
  } catch (error) {
    console.error('UpdateMe error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while updating profile',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyResetCode,
  resetPassword,
};