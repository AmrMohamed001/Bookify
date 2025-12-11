const multer = require('multer');
const AppError = require('../utils/appError');

const storage = multer.memoryStorage(); //processing before Cloudinary upload


const fileFilter = (req, file, cb) => {
    // Cover image, avatar, or icon 
    if (file.fieldname === 'coverImage' || file.fieldname === 'avatar' || file.fieldname === 'icon') {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new AppError(
                    400,
                    'Invalid image format. Only JPEG, PNG, and WebP are allowed.'
                ),
                false
            );
        }
    }
    // PDF 
    else if (file.fieldname === 'pdfFile') {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new AppError(400, 'Invalid file format. Only PDF files are allowed.'), false);
        }
    }
    else {
        cb(new AppError(400, `Unexpected field: ${file.fieldname}`), false);
    }
};

const limits = {
    fileSize: 100 * 1024 * 1024, // 100MB max (for PDFs)
    files: 2, // Max 2 files (cover + pdf)
};

const upload = multer({
    storage,
    fileFilter,
    limits,
});

const uploadBookFiles = upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'pdfFile', maxCount: 1 },
]);
const uploadCoverOnly = upload.single('coverImage');
const uploadAvatar = upload.single('avatar');
const uploadIcon = upload.single('icon');


// Middleware to validate file sizes after upload
const validateFileSizes = (req, res, next) => {
    if (req.files) {
        // Cover image: max 5MB
        if (req.files.coverImage && req.files.coverImage[0].size > 5 * 1024 * 1024) {
            return next(new AppError(400, 'Cover image must be less than 5MB'));
        }
        // PDF: max 100MB
        if (req.files.pdfFile && req.files.pdfFile[0].size > 100 * 1024 * 1024) {
            return next(new AppError(400, 'PDF file must be less than 100MB'));
        }
    }
    if (req.file) {
        // Avatar: max 2MB
        if (req.file.fieldname === 'avatar' && req.file.size > 2 * 1024 * 1024) {
            return next(new AppError(400, 'Avatar must be less than 2MB'));
        }
        // Icon: max 1MB
        if (req.file.fieldname === 'icon' && req.file.size > 1 * 1024 * 1024) {
            return next(new AppError(400, 'Icon must be less than 1MB'));
        }
    }
    next();
};

module.exports = {
    uploadBookFiles,
    uploadCoverOnly,
    uploadAvatar,
    uploadIcon,
    validateFileSizes,
};

