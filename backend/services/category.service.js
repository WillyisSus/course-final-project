import models from '../utils/db.js'; //

export const CategoryService = {

  // Fetching the full tree or list
  async findAllCategories() {
    return await models.categories.findAll({
      include: [
        {
          model: models.categories,
          as: 'sub_categories', // Fetching sub-categories
          attributes: ['category_id', 'name']
        }
      ],
      where: { parent_id: null }, // Start from root categories
      order: [['name', 'ASC']]
    });
  },

  async findCategoryById(categoryId) {
    const category = await models.categories.findByPk(categoryId, {
      include: [
        {
          model: models.categories,
          as: 'parent', //
          attributes: ['name']
        }
      ]
    });
    if (!category) throw new Error('Category not found');
    return category;
  },

  async createCategory(name, parentId = null) {
    const parentCategory = parentId ? await models.categories.findByPk(parentId) : null;
    if (parentId && !parentCategory) {
      throw new Error('Parent category not found');
    }
    if (parentId && parentCategory){
      if (parentCategory.parent_id){
        throw new Error('Cannot create sub-category under a sub-category (only 2 levels allowed).');
      }
      const countProducts = await models.products.count({ where: { category_id: parentId } });
      if (countProducts > 0){
        throw new Error('Cannot create sub-category under a category that contains products.');
      }
      console.log("Creating category under parent:", parentCategory.name);
    } 
    return await models.categories.create({
      name,
      parent_id: parentId
    });
  },

  async updateCategory(categoryId, updateData) {
    const category = await models.categories.findByPk(categoryId);
    if (!category) throw new Error('Category not found');
    if (updateData.parent_id && updateData.parent_id !== category.parent_id) {
      const parentId = updateData.parent_id;
      const parentCategory = parentId ? await models.categories.findByPk(parentId) : null;
      if (parentId && !parentCategory) {
        throw new Error('Parent category not found');
      }
      if (parentId && parentCategory){
        if (parentCategory.parent_id){
          throw new Error('Cannot create sub-category under a sub-category (only 2 levels allowed).');
        }
        const countProducts = await models.products.count({ where: { category_id: parentId } });
        if (countProducts > 0){
          throw new Error('Cannot create sub-category under a category that contains products.');
        }
        console.log("Creating category under parent:", parentCategory.name);
      } 
    }
    return await category.update(updateData);
  },

  async deleteCategory(categoryId) {
    const category = await models.categories.findByPk(categoryId);
    if (!category) throw new Error('Category not found');

    // Constraint: Cannot delete if it has sub-categories
    const subCount = await models.categories.count({ where: { parent_id: categoryId } });
    if (subCount > 0) throw new Error('Cannot delete category: It has sub-categories.');

    // Constraint: Cannot delete if it has products
    const prodCount = await models.products.count({ where: { category_id: categoryId } }); //
    if (prodCount > 0) throw new Error('Cannot delete category: It contains products.');

    return await category.destroy();
  }
};