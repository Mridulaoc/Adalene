const categoryRoute = require("../routers/categoryRouter");
const Category = require("../models/category");
const Offer = require("../models/offer");
var moment = require("moment");

const loadCategoryList = async (req, res) => {
  try {
    const categoryData = await Category.find({ cat_status: "ACTIVE" });   
    const offers = await Offer.find()
    res.render("categoryList", { categories:categoryData, moment,offers });
  } catch (err) {
    console.log(err);
  }
};

const loadAddCategory = async (req, res) => {
  try {
    res.render("addCategory");
  } catch (err) {
    console.log(err);
  }
};

const addNewCategory = async (req, res) => {
  try {
    const categoryName = req.body.category;
    const isExisting = await Category.findOne({
      cat_name: new RegExp(`^${categoryName}$`, "i"),
    });
    if (isExisting) {
      res.render("addCategory", { error: "Already existing category" });
    } else {
      const category = new Category({
        cat_name: req.body.category,
        cat_desc: req.body.description,
      });
      await category.save();

      res.redirect("/admin/categories");
    }
  } catch (error) {
    console.log(error);
  }
};

const loadEditCategory = async (req, res) => {
  try {
    // const id = req.query.id;
    const categoryData = await Category.findById({ _id: req.query.id });
    res.render("editCategory", { categories: categoryData });
  } catch (error) {
    console.log(error.message);
  }
};

const updateCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const categoryData = await Category.findByIdAndUpdate(
      { _id: id },
      { $set: { cat_name: req.body.category, cat_desc: req.body.description } }
    );
    res.redirect("/admin/categories");
  } catch (error) {
    console.log(error);
  }
};
const deleteCategory = async (req, res) => {
  try {
    const categoryData = await Category.findByIdAndUpdate(
      { _id: req.query.id },
      { $set: { is_Deleted: true, cat_status: "INACTIVE" } }
    );
    res.redirect("/admin/categories");
  } catch (error) {
    console.log(error);
  }
};

const updateCategoryOffer = async (req, res) => {
  const { categoryId, offerId } = req.body;
    console.log(categoryId,offerId);
    try {
      const categories = await Category.findById(categoryId);
      if (!categories) {
          return res.status(404).json({ success: false, message: 'Category not found' });
      }

      if (offerId) {
          const offer = await Offer.findById(offerId);
          if (!offer) {
              return res.status(404).json({ success: false, message: 'Offer not found' });
          }
          categories.offer = offerId;
      } else {
          categories.offer = null; 
      }

      await categories.save();
      res.json({ success: true, message: 'Offer updated successfully' });
  } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update offer' });
  }
}
  

module.exports = {
  loadCategoryList,
  loadAddCategory,
  loadEditCategory,
  addNewCategory,
  deleteCategory,
  updateCategory,
  updateCategoryOffer
};
