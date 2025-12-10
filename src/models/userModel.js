const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ==================== BASIC INFO ====================
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },

    password: {
      type: String,
      required: function () {
        // Password required only for local auth
        return this.authProvider === 'local' || !this.authProvider;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },

    passwordConfirm: {
      type: String,
      required: function () {
        // Only required when password is being set
        return this.isModified('password') && (this.authProvider === 'local' || !this.authProvider);
      },
      validate: {
        validator: function (value) {
          // Only validate on create or when password is modified
          return value === this.password;
        },
        message: 'Passwords do not match',
      },
    },

    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },

    // ==================== AUTH PROVIDER ====================
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },

    googleId: {
      type: String,
      sparse: true, // Allow null values but unique when present
    },

    // ==================== ROLE & STATUS ====================
    role: {
      type: String,
      enum: ['guest', 'user', 'author', 'admin'],
      default: 'user',
      index: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ==================== PROFILE ====================
    profile: {
      avatar: {
        url: String,
        publicId: String, // Cloudinary public ID
      },
      bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
      },
      phone: {
        type: String,
        validate: {
          validator: function (v) {
            if (!v) return true; // Optional field
            return /^[+]?[\d\s\-()]+$/.test(v);
          },
          message: 'Invalid phone number format',
        },
      },
      addresses: [
        {
          type: {
            type: String,
            enum: ['shipping', 'billing'],
            required: true,
          },
          street: {
            type: String,
            required: true,
          },
          city: {
            type: String,
            required: true,
          },
          state: {
            type: String,
            required: true,
          },
          zipCode: {
            type: String,
            required: true,
          },
          country: {
            type: String,
            required: true,
          },
          isDefault: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },

    // ==================== AUTHOR INFO ====================
    authorInfo: {
      isApproved: {
        type: Boolean,
        default: false,
      },
      approvedAt: Date,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectionReason: String,
      biography: {
        type: String,
        maxlength: [2000, 'Biography cannot exceed 2000 characters'],
      },
    },

    // ==================== REFRESH TOKENS ====================
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ==================== EMAIL VERIFICATION ====================
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // ==================== PASSWORD RESET ====================
    passwordResetToken: String,
    passwordResetExpires: Date,

    // ==================== TIMESTAMPS ====================
    lastLoginAt: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================
// userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'authorInfo.isApproved': 1 });
// userSchema.index({ googleId: 1 }, { sparse: true }); // For OAuth user lookups

// ==================== VIRTUALS ====================
// Full name virtual
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function () {
  // Skip if password doesn't exist (OAuth users) or not modified
  if (!this.password || !this.isModified('password')) return;

  // Hash password with cost factor 12 (as per SRS NFR-SEC-001)
  this.password = await bcrypt.hash(this.password, 12);

  // Remove passwordConfirm field (don't persist to database)
  this.passwordConfirm = undefined;
});

// Clean up expired refresh tokens before saving
userSchema.pre('save', function () {
  if (this.isModified('refreshTokens')) {
    this.refreshTokens = this.refreshTokens.filter(
      token => token.expiresAt > new Date()
    );
  }
});

// ==================== METHODS ====================
// Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user has a specific role
userSchema.methods.hasRole = function (role) {
  return this.role === role;
};

// Check if user is author and approved
userSchema.methods.isApprovedAuthor = function () {
  return this.role === 'author' && this.authorInfo.isApproved;
};

// Add refresh token
userSchema.methods.addRefreshToken = function (token, expiresAt) {
  this.refreshTokens.push({
    token,
    expiresAt,
    createdAt: new Date(),
  });
};

// Remove refresh token (for logout)
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};

// Update last login timestamp
userSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
  return this.save({ validateBeforeSave: false });
};
userSchema.methods.checkPasswordChanged = function (jwtTimeStemp) {
  if (this.passwordChangedAt) {
    //password changed
    const changedDate = this.passwordChangedAt.getTime() / 1000;
    return jwtTimeStemp < changedDate;
  }
  return false; //not changed
};
// ==================== STATIC METHODS ====================
// Find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Get active users by role
userSchema.statics.getActiveUsersByRole = function (role) {
  return this.find({ role, isActive: true });
};

// Get pending author applications
userSchema.statics.getPendingAuthors = function () {
  return this.find({
    role: 'author',
    'authorInfo.isApproved': false,
  });
};

module.exports = mongoose.model('User', userSchema);
