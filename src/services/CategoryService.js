const Category = require('../models/categoryModel')
const ApiFeatures = require("../utils/Api-Features");

exports.getAll = async (query) => {
    const noDocs = await countDocs();
    const features = new ApiFeatures(query, Category.find()).filter().sort().select().paging(noDocs)
    return await features.query
}
exports.getOne = async (catId) => {
    const category = await Category.findById(catId);
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
}
exports.create = async (catBody) => {
    return await Category.create(catBody)
}
exports.update = async (id, catBody) => {
    const category = await Category.findByIdAndUpdate(id, catBody, {
        runValidators: true,
        new: true
    });
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
}
exports.delete = async (id) => {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
}

const countDocs = async () => {
    return await Category.countDocuments();
}
