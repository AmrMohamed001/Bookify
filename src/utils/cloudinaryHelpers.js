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

const uploadBuffer = async (
  buffer,
  options,
  timeoutMs = 300000,
  maxRetries = 3
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Upload attempt ${attempt}/${maxRetries} for ${options.public_id || 'file'}`
      );

      const result = await new Promise((resolve, reject) => {
        let settled = false;

        const safeResolve = value => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            resolve(value);
          }
        };

        const safeReject = error => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(error);
          }
        };

        const timeout = setTimeout(() => {
          safeReject(
            new Error(
              `Cloudinary upload timed out after ${timeoutMs / 1000} seconds. Please try a smaller file.`
            )
          );
        }, timeoutMs);

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            ...options,
            timeout: timeoutMs,
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              safeReject(new Error(`File upload failed: ${error.message}`));
            } else {
              console.log(`Upload successful: ${result.public_id}`);
              safeResolve(result);
            }
          }
        );

        uploadStream.on('error', err => {
          console.error('Upload stream error:', err);
          safeReject(new Error(`Upload stream failed: ${err.message}`));
        });

        uploadStream.end(buffer);
      });

      return result;
    } catch (error) {
      lastError = error;
      console.error(`Upload attempt ${attempt} failed:`, error.message);

      // Don't retry on the last attempt
      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If all retries failed, throw the last error
  throw new Error(
    `Upload failed after ${maxRetries} attempts: ${lastError.message}`
  );
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
    public_id: userId
      ? `avatar_${userId}_${Date.now()}`
      : `avatar_${Date.now()}`,
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
    public_id: bookId
      ? `pdf_${bookId}_${Date.now()}.pdf`
      : `pdf_${Date.now()}.pdf`,
  };

  console.log(
    `Uploading PDF: ${(buffer.length / 1024 / 1024).toFixed(2)} MB, ${pageCount || 'unknown'} pages`
  );

  // Use longer timeout for PDFs (10 minutes) since they can be large
  const result = await uploadBuffer(buffer, options, 600000);
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
    public_id: categoryId
      ? `icon_${categoryId}_${Date.now()}`
      : `icon_${Date.now()}`,
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
