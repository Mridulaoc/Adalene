const express = require('express');
const categoryRoute = express();
const bodyParser = require("body-parser");

categoryRoute.use(express.static('public'));
categoryRoute.use(bodyParser.json());
categoryRoute.use(bodyParser.urlencoded({ extended: true }));

categoryRoute.set('view engine', 'ejs');
categoryRoute.set("views", './views/category');
const categoryController = require('../controllers/categoryController')

categoryRoute.get('/categories', categoryController.loadCategoryList);
categoryRoute.get('/categories/add-category', categoryController.loadAddCategory);
categoryRoute.post('/categories/add-category', categoryController.addNewCategory);
categoryRoute.get('/categories/edit-category', categoryController.loadEditCategory);
categoryRoute.post('/categories/edit-category', categoryController.updateCategory);
categoryRoute.get('/categories/delete-category', categoryController.deleteCategory);

module.exports = categoryRoute;