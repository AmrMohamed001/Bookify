const cloudinary = require('../config/cloudinary');

const uploadOptions = {
    coverImage: {
        folder: 'bookify/covers',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 800, height: 1200, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
        ],
    },
    pdf: {
        folder: 'bookify/pdfs',
        resource_type: 'raw',
        allowed_formats: ['pdf'],
        chunk_size: 6000000,
    },
};


const uploadBuffer = (buffer, options, timeoutMs = 120000) => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Cloudinary upload timed out. Please try a smaller file.'));
        }, timeoutMs);

        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                clearTimeout(timeout);
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(new Error(`File upload failed: ${error.message}`));
                } else {
                    resolve(result);
                }
            }
        );

        uploadStream.on('error', (err) => {
            clearTimeout(timeout);
            console.error('Upload stream error:', err);
            reject(new Error(`Upload stream failed: ${err.message}`));
        });

        uploadStream.end(buffer);
    });
};


const uploadCoverImage = async (buffer, bookId = null) => {
    const options = {
        ...uploadOptions.coverImage,
        public_id: bookId ? `cover_${bookId}_${Date.now()}` : `cover_${Date.now()}`,
    };

    const result = await uploadBuffer(buffer, options);
    return {
        url: result.secure_url,
        publicId: result.public_id,
    };
};


const uploadAvatar = async (buffer, userId = null) => {
    const options = {
        folder: 'bookify/avatars',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
        ],
        public_id: userId ? `avatar_${userId}_${Date.now()}` : `avatar_${Date.now()}`,
    };

    const result = await uploadBuffer(buffer, options);
    return {
        url: result.secure_url,
        publicId: result.public_id,
    };
};

const uploadPdf = async (buffer, bookId = null) => {
    let pageCount = null;
    try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        pageCount = pdfData.numpages;
    } catch (err) {
        console.error('Failed to parse PDF for page count:', err.message);
    }

    const options = {
        ...uploadOptions.pdf,
        public_id: bookId ? `pdf_${bookId}_${Date.now()}.pdf` : `pdf_${Date.now()}.pdf`,
    };

    const result = await uploadBuffer(buffer, options);
    return {
        url: result.secure_url,
        publicId: result.public_id,
        sizeInBytes: result.bytes,
        pageCount: pageCount,
    };
};


const generatePreviewUrl = (pdfPublicId, pages = 10) => {
    const url = cloudinary.url(pdfPublicId, {
        resource_type: 'image',
        format: 'jpg',
        page: 1,
        transformation: [{ width: 800, crop: 'fit' }, { quality: 'auto:good' }],
    });

    return {
        url,
        pageRange: `1-${pages}`,
    };
};


const getSignedUrl = (publicId, expiresInMinutes = 30) => {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;

    return cloudinary.utils.private_download_url(publicId, 'pdf', {
        resource_type: 'raw',
        expires_at: expiresAt,
    });
};


const deleteFile = async (publicId, resourceType = 'image') => {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};


const deleteFiles = async (publicIds, resourceType = 'image') => {
    return cloudinary.api.delete_resources(publicIds, {
        resource_type: resourceType,
    });
};

const uploadIcon = async (buffer, categoryId = null) => {
    const options = {
        folder: 'bookify/icons',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
        transformation: [
            { width: 200, height: 200, crop: 'fit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
        ],
        public_id: categoryId ? `icon_${categoryId}_${Date.now()}` : `icon_${Date.now()}`,
    };

    const result = await uploadBuffer(buffer, options);
    return {
        url: result.secure_url,
        publicId: result.public_id,
    };
};

module.exports = {
    uploadCoverImage,
    uploadAvatar,
    uploadIcon,
    uploadPdf,
    generatePreviewUrl,
    getSignedUrl,
    deleteFile,
    deleteFiles,
};
