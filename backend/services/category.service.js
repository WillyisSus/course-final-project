import models from '../utils/db.js'; //

export const CategoryService = {

  // Fetching the full tree or list
  async findAllCategories() {
    return await models.categories.findAll({
      include: [
        {
          model: models.categories,
          as: 'categories', // Fetching sub-categories
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
    return await models.categories.create({
      name,
      parent_id: parentId
    });
  },

  async updateCategory(categoryId, updateData) {
    const category = await models.categories.findByPk(categoryId);
    if (!category) throw new Error('Category not found');
    
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