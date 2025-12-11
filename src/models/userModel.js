const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
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
      select: false,
    },

    passwordConfirm: {
      type: String,
      required: function () {
        return (
          this.isModified('password') &&
          (this.authProvider === 'local' || !this.authProvider)
        );
      },
      validate: {
        validator: function (value) {
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

    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },

    googleId: {
      type: String,
      sparse: true,
    },
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

    emailVerificationToken: String,
    emailVerificationExpires: Date,

    passwordResetToken: String,
    passwordResetExpires: Date,

    lastLoginAt: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'authorInfo.isApproved': 1 });
// userSchema.index({ googleId: 1 }, { sparse: true }); // For OAuth user lookups

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});


userSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});

userSchema.pre('save', function () {
  if (this.isModified('refreshTokens')) {
    this.refreshTokens = this.refreshTokens.filter(
      token => token.expiresAt > new Date()
    );
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hasRole = function (role) {
  return this.role === role;
};

userSchema.methods.isApprovedAuthor = function () {
  return this.role === 'author' && this.authorInfo.isApproved;
};

userSchema.methods.addRefreshToken = function (token, expiresAt) {
  this.refreshTokens.push({
    token,
    expiresAt,
    createdAt: new Date(),
  });
};

userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};


userSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
};
userSchema.methods.checkPasswordChanged = function (jwtTimeStemp) {
  if (this.passwordChangedAt) {
    const changedDate = this.passwordChangedAt.getTime() / 1000;
    return jwtTimeStemp < changedDate;
  }
  return false;
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.getActiveUsersByRole = function (role) {
  return this.find({ role, isActive: true });
};
userSchema.statics.getPendingAuthors = function () {
  return this.find({
    role: 'author',
    'authorInfo.isApproved': false,
  });
};

module.exports = mongoose.model('User', userSchema);
