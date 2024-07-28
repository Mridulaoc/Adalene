const categoryRoute = require('../routers/categoryRouter');
const Category = require('../models/category');
var moment = require('moment');

const loadCategoryList = async(req,res)=>{
    try {
        const categoryData =await Category.find({cat_status:'ACTIVE'});
        if (categoryData){
            res.render('categoryList', { categories: categoryData, moment});
        }
        
    } catch (err) {
        console.log(err)
    }
}

const loadAddCategory = async(req,res)=>{
    try {
        
        res.render('addCategory');
    } catch (err) {
        console.log(err)
    }
}

const addNewCategory = async(req,res)=>{
    try {
        
        
        const categoryName = req.body.category;        
        const isExisting = await Category.findOne({cat_name: new RegExp(`^${categoryName}$`, 'i') });
        if(isExisting){
            res.render('addCategory', {error:'Already existing category'});
        }else{
                const category = new Category({
                cat_name : req.body.category,
                cat_desc: req.body.description,
            })
             await category.save();
           
                res.redirect('/admin/categories');
        }
        
        
    } catch (error) {
        console.log(error);
    }
}

const loadEditCategory = async(req,res)=>{
    try {
       
            // const id = req.query.id;
            const categoryData = await Category.findById({_id:req.query.id});
            res.render('editCategory', {categories:categoryData});
     
        
        
    } catch (error) {
        console.log(error.message);
    }
}


const updateCategory = async(req,res)=>{
    try {
        const id = req.params.id;
        const categoryData = await Category.findByIdAndUpdate({_id:id},{$set:{cat_name:req.body.category, cat_desc:req.body.description}})
        res.redirect('/admin/categories')
    } catch (error) {
        console.log(error)
    }
}
const deleteCategory = async(req,res)=>{
    try {
       
        const categoryData = await Category.findByIdAndUpdate({_id:req.query.id},{$set:{is_Deleted:true, cat_status: 'INACTIVE'}});
        res.redirect('/admin/categories');
    } catch (error) {
        console.log(error)
    }
}

module.exports ={
    loadCategoryList,
    loadAddCategory,
    loadEditCategory,
    addNewCategory,
    deleteCategory,
    updateCategory
}