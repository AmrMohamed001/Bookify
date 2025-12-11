const Category = require('../models/categoryModel');
const ApiFeatures = require('../utils/Api-Features');
const { uploadIcon, deleteFile } = require('../utils/cloudinaryHelpers');

exports.getAll = async (query) => {
    const noDocs = await countDocs();
    const features = new ApiFeatures(query, Category.find())
        .filter()
        .sort()
        .select()
        .paging(noDocs);
    return await features.query;
};

exports.getOne = async (catId, populateBooks = false) => {
    let query = Category.findById(catId);
    if (populateBooks) query = query.populate('books', 'title slug coverImage pricing.digital.price');
    const category = await query;
    if (!category) throw new Error('Category not found');
    return category;
};

exports.create = async (catBody, iconFile = null) => {
    if (iconFile) {
        const iconResult = await uploadIcon(iconFile.buffer);
        catBody.icon = {
            url: iconResult.url,
            publicId: iconResult.publicId,
        };
    }
    return await Category.create(catBody);
};

exports.update = async (id, catBody, iconFile = null) => {
    const category = await Category.findById(id);
    if (!category) throw new Error('Category not found');

    if (iconFile) {
        if (category.icon?.publicId) {
            await deleteFile(category.icon.publicId, 'image').catch(console.error);
        }
        const iconResult = await uploadIcon(iconFile.buffer, id);
        catBody.icon = {
            url: iconResult.url,
            publicId: iconResult.publicId,
        };
    }

    Object.assign(category, catBody);
    await category.save();
    return category;
};

exports.delete = async (id) => {
    const category = await Category.findById(id);
    if (!category) throw new Error('Category not found');

    if (category.icon?.publicId) await deleteFile(category.icon.publicId, 'image').catch(console.error);

    await Category.findByIdAndDelete(id);
    return category;
};

const countDocs = async () => await Category.countDocuments();

