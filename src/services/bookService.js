const Book = require('../models/bookModel');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/Api-Features');
const {
  uploadCoverImage,
  uploadPdf,
  generatePreviewUrl,
  getSignedUrl,
  deleteFile,
} = require('../utils/cloudinaryHelpers');

exports.createBook = async (authorId, bookData, files) => {
  let coverImage = null;
  let pdfFile = null;
  let preview = null;

  try {
    // Handle file uploads
    if (files?.coverImage)
      coverImage = await uploadCoverImage(files.coverImage[0].buffer);
    if (files?.pdfFile) pdfFile = await uploadPdf(files.pdfFile[0].buffer);

    // Generate preview from uploaded PDF
    if (pdfFile.publicId) preview = generatePreviewUrl(pdfFile.publicId, 10);
  } catch (error) {
    // Cleanup uploaded files if book creation fails
    console.error('Book creation error:', error);
    if (coverImage?.publicId)
      await deleteFile(coverImage.publicId, 'image').catch(console.error);
    if (pdfFile?.publicId)
      await deleteFile(pdfFile.publicId, 'raw').catch(console.error);
    throw new AppError(500, `Failed to create book: ${error.message}`);
  }

  const book = await Book.create({
    ...bookData,
    author: authorId,
    coverImage,
    pdfFile,
    preview,
    status: 'draft',
  });

  return book;
};

exports.getAllBooks = async query => {
  const filter = { status: 'approved' };
  if (query.search) {
    // Full-text search using text index
    // Note: Only matches complete words, not partial (e.g., "javascript" works, "ja" won't)
    filter.$text = { $search: query.search };
  }

  const total = await Book.countDocuments(filter);

  let baseQuery = Book.find(filter);

  if (query.search) {
    baseQuery = baseQuery
      .select({ score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } }); // Sort by relevance
  }

  const features = new ApiFeatures(query, baseQuery)
    .filter()
    .sort()
    .select()
    .paging(total);

  const books = await features.query
    .populate('author', 'firstName lastName')
    .populate('category', 'name');
  return {
    books,
    pagination: {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      total,
      pages: Math.ceil(total / (parseInt(query.limit) || 10)),
    },
  };
};

exports.getBooksByAuthorId = async (authorId, query) => {
  const filter = { author: authorId, status: 'approved' };
  const baseQuery = Book.find(filter);
  const total = await Book.countDocuments(filter);

  const features = new ApiFeatures(query, baseQuery)
    .filter()
    .sort()
    .select()
    .paging(total);

  const books = await features.query
    .populate(
      'author',
      'firstName lastName profile.avatar authorInfo.biography'
    )
    .populate('category', 'name');

  return {
    books,
    pagination: {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      total,
      pages: Math.ceil(total / (parseInt(query.limit) || 10)),
    },
  };
};

exports.getBookById = async (bookId, incrementView = true) => {
  const book = await Book.findById(bookId)
    .populate('author', 'firstName lastName profile.avatar')
    .populate('category', 'name')
    .populate('reviews');

  if (!book) throw new AppError(404, 'Book not found');

  if (incrementView && book.status === 'approved') await book.incrementViews();

  return book;
};

exports.getAuthorBooks = async (authorId, query) => {
  const baseQuery = Book.find({ author: authorId });
  const total = await Book.countDocuments({ author: authorId });

  const features = new ApiFeatures(query, baseQuery)
    .filter()
    .sort()
    .select()
    .paging(total);

  const books = await features.query.populate('category', 'name');

  return {
    books,
    pagination: {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      total,
      pages: Math.ceil(total / (parseInt(query.limit) || 10)),
    },
  };
};

exports.updateBook = async (
  bookId,
  userId,
  updateData,
  files,
  isAdmin = false
) => {
  const book = await Book.findById(bookId);

  if (!book) throw new AppError(404, 'Book not found');

  // Check ownership (unless admin)
  if (!isAdmin && book.author.toString() !== userId.toString()) {
    throw new AppError(403, 'You can only update your own books');
  }

  // Check if book can be edited
  if (!isAdmin && !book.canEdit()) {
    throw new AppError(
      400,
      'Cannot edit book in current status. Only draft or rejected books can be edited.'
    );
  }

  // Handle file updates
  if (files?.coverImage) {
    // Delete old cover if exists
    if (book.coverImage?.publicId)
      await deleteFile(book.coverImage.publicId, 'image');
    updateData.coverImage = await uploadCoverImage(files.coverImage[0].buffer);
  }

  if (files?.pdfFile) {
    // Delete old PDF if exists
    if (book.pdfFile?.publicId) await deleteFile(book.pdfFile.publicId, 'raw');
    updateData.pdfFile = await uploadPdf(files.pdfFile[0].buffer);
    // Regenerate preview
    if (updateData.pdfFile.publicId)
      updateData.preview = generatePreviewUrl(updateData.pdfFile.publicId, 10);
  }

  Object.assign(book, updateData);
  await book.save();

  return book;
};

exports.deleteBook = async (bookId, userId, isAdmin = false) => {
  const book = await Book.findById(bookId);

  if (!book) throw new AppError(404, 'Book not found');

  // Check ownership (unless admin)
  if (!isAdmin && book.author.toString() !== userId.toString())
    throw new AppError(403, 'You can only delete your own books');

  // Authors can only delete draft books
  if (!isAdmin && book.status !== 'draft')
    throw new AppError(
      400,
      'You can only delete draft books. Contact admin for other cases.'
    );

  // Delete Cloudinary assets
  if (book.coverImage?.publicId)
    await deleteFile(book.coverImage.publicId, 'image');
  if (book.pdfFile?.publicId) await deleteFile(book.pdfFile.publicId, 'raw');

  await Book.findByIdAndDelete(bookId);

  return { message: 'Book deleted successfully' };
};

/**
 * Submit book for review
 */
exports.submitForReview = async (bookId, userId) => {
  const book = await Book.findById(bookId);

  if (!book) throw new AppError(404, 'Book not found');

  if (book.author.toString() !== userId.toString())
    throw new AppError(403, 'You can only submit your own books');

  if (book.status !== 'draft' && book.status !== 'rejected')
    throw new AppError(
      400,
      'Only draft or rejected books can be submitted for review'
    );

  // Validate required fields for submission
  if (!book.pdfFile?.url)
    throw new AppError(
      400,
      'PDF file is required before submitting for review'
    );

  book.status = 'pending';
  await book.save();

  return book;
};

exports.getPendingBooks = async query => {
  const baseQuery = Book.find({ status: 'pending' });
  const total = await Book.countDocuments({ status: 'pending' });

  const features = new ApiFeatures(query, baseQuery).sort().paging(total);

  const books = await features.query
    .populate('author', 'firstName lastName email')
    .populate('category', 'name');

  return {
    books,
    pagination: {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      total,
      pages: Math.ceil(total / (parseInt(query.limit) || 10)),
    },
  };
};

exports.approveBook = async (bookId, adminId) => {
  const book = await Book.findById(bookId);

  if (!book) throw new AppError(404, 'Book not found');

  if (book.status !== 'pending')
    throw new AppError(400, 'Only pending books can be approved');

  book.status = 'approved';
  book.adminReview = {
    reviewedBy: adminId,
    reviewedAt: new Date(),
    rejectionReason: null,
  };
  // publishedAt is set automatically by pre-save hook
  await book.save();

  return book;
};

exports.rejectBook = async (bookId, adminId, rejectionReason) => {
  const book = await Book.findById(bookId);

  if (!book) throw new AppError(404, 'Book not found');

  if (book.status !== 'pending')
    throw new AppError(400, 'Only pending books can be rejected');

  book.status = 'rejected';
  book.adminReview = {
    reviewedBy: adminId,
    reviewedAt: new Date(),
    rejectionReason,
  };
  await book.save();

  return book;
};

exports.getPreviewUrl = async bookId => {
  const book = await Book.findById(bookId);

  if (!book) throw new AppError(404, 'Book not found');

  if (!book.pdfFile?.publicId)
    throw new AppError(404, 'No preview available for this book');

  const signedUrl = getSignedUrl(book.pdfFile.publicId, 30);

  return {
    previewUrl: signedUrl,
    pageRange: book.preview?.pageRange || '1-10',
    expiresIn: '30 minutes',
  };
};

/**
 * Get signed URL for full book (purchased users only - placeholder for now)
 */
exports.getBookDownloadUrl = async (bookId, userId) => {
  const book = await Book.findById(bookId);

  if (!book) {
    throw new AppError(404, 'Book not found');
  }

  // TODO: Check if user has purchased this book
  // For now, return signed URL
  const signedUrl = getSignedUrl(book.pdfFile.publicId, 30);

  return {
    downloadUrl: signedUrl,
    expiresIn: '30 minutes',
  };
};
