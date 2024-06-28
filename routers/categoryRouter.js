const express = require('express');
const categoryRoute = express();
const bodyParser = require("body-parser");
const methodOverride = require('method-override');

categoryRoute.use(express.static('public'));
categoryRoute.use(bodyParser.json());
categoryRoute.use(bodyParser.urlencoded({ extended: true }));

categoryRoute.use(methodOverride('_method'));

categoryRoute.set('view engine', 'ejs');
categoryRoute.set("views", './views/category');
const categoryController = require('../controllers/categoryController')

// categoryRoute.get('/categories', categoryController.loadCategoryList);
// categoryRoute.get('/categories/add-category', categoryController.loadAddCategory);
// categoryRoute.post('/categories/add-category', categoryController.addNewCategory);
// categoryRoute.get('/categories/edit-category', categoryController.loadEditCategory);
// categoryRoute.put('/categories/edit-category/:id', categoryController.updateCategory);
// categoryRoute.get('/categories/delete-category', categoryController.deleteCategory);

module.exports = categoryRoute;