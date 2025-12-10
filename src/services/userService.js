const User = require('../models/userModel');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/Api-Features');


exports.getAllUsers = async (query) => {
    const total = await User.countDocuments();

    const features = new ApiFeatures(query, User.find())
        .filter()
        .search(['firstName', 'lastName', 'email'])
        .sort()
        .select()
        .paging(total);

    const users = await features.query.select('-password -refreshTokens');
    return {
        users,
        pagination: {
            page: parseInt(query.page) || 1,
            limit: parseInt(query.limit) || 10,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

exports.getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password -refreshTokens');

    if (!user) {
        throw new AppError(404, 'User not found');
    }
    return user;
};

exports.getCurrentUser = async (userId) => {
    const user = await User.findById(userId).select('-password -refreshTokens');

    if (!user) {
        throw new AppError(404, 'User not found');
    }

    return user;
};

exports.updateProfile = async (userId, updateData) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(404, 'User not found');
    }

    // Update basic fields
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;

    // Update profile fields safely
    if (updateData.profile) {
        // Update avatar
        if (updateData.profile.avatar) {
            user.profile.avatar = {
                url: updateData.profile.avatar.url || user.profile.avatar?.url,
                publicId: updateData.profile.avatar.publicId || user.profile.avatar?.publicId,
            };
        }

        // Update bio
        if (updateData.profile.bio !== undefined) {
            user.profile.bio = updateData.profile.bio;
        }

        // Update phone
        if (updateData.profile.phone !== undefined) {
            user.profile.phone = updateData.profile.phone;
        }

        // Update addresses
        if (updateData.profile.addresses) {
            user.profile.addresses = updateData.profile.addresses;
        }
    }

    await user.save();

    // Remove sensitive fields
    user.password = undefined;
    user.refreshTokens = undefined;

    return user;
};

exports.updateUser = async (userId, updateData) => {
    const allowedFields = ['firstName', 'lastName', 'role', 'isActive'];

    const filteredData = {};
    Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
            filteredData[key] = updateData[key];
        }
    });

    const user = await User.findByIdAndUpdate(userId, filteredData, {
        new: true,
        runValidators: true,
    }).select('-password -refreshTokens');

    if (!user) {
        throw new AppError(404, 'User not found');
    }

    return user;
};

exports.deactivateUser = async (userId) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
    ).select('-password -refreshTokens');

    if (!user) {
        throw new AppError(404, 'User not found');
    }

    return user;
};

exports.deleteUser = async (userId) => {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
        throw new AppError(404, 'User not found');
    }

    return user;
};

exports.applyForAuthor = async (userId, authorData) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(404, 'User not found');
    }

    if (user.role === 'author') {
        throw new AppError(400, 'You are already an author');
    }

    user.role = 'author';
    user.authorInfo = {
        isApproved: false,
        biography: authorData.biography,
    };

    await user.save();

    return {
        message: 'Author application submitted successfully. Awaiting admin approval.',
        user,
    };
};

exports.approveAuthor = async (userId, adminId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(404, 'User not found');
    }

    if (user.role !== 'author') {
        throw new AppError(400, 'User is not an author applicant');
    }

    if (user.authorInfo.isApproved) {
        throw new AppError(400, 'Author is already approved');
    }

    user.authorInfo.isApproved = true;
    user.authorInfo.approvedAt = new Date();
    user.authorInfo.approvedBy = adminId;

    await user.save();

    return {
        message: 'Author approved successfully',
        user,
    };
};

exports.rejectAuthor = async (userId, rejectionReason) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(404, 'User not found');
    }

    if (user.role !== 'author') {
        throw new AppError(400, 'User is not an author applicant');
    }

    user.role = 'user';
    user.authorInfo.isApproved = false;
    user.authorInfo.rejectionReason = rejectionReason;

    await user.save();

    return {
        message: 'Author application rejected',
        user,
    };
};


exports.getPendingAuthors = async () => {
    const pendingAuthors = await User.find({
        role: 'author',
        'authorInfo.isApproved': false,
    }).select('-password -refreshTokens');

    return pendingAuthors;
};
