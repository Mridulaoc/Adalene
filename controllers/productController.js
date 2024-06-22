const productRoute = require('../routers/productRouter');
const Product = require('../models/product')
const Category = require('../models/category')
const Color = require('../models/color')
const Size = require('../models/size')
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');

const loadProductList = async(req,res)=>{
    try {        
        const products = await Product.find({prod_status:'ACTIVE'}).populate('prod_category');        
        res.render('productList', {products: products});               
        
    } catch (error) {
        console.log(error);
    }
    
}

const loadAddProduct = async(req,res)=>{
    try {
        const categories = await Category.find();
        const colors = await Color.find();
        const sizes = await Size.find();
        res.render('addProduct',{ categories,colors,sizes});
    } catch (error) {
        console.log(error);
    }
    
}

const addNewProduct = async (req,res)=>{

    const files = req.files;

    if(!files || files.length === 0){
        console.log("No files found");
    }

    const imagePaths = [];
    const uploadPromises = files.map(async(file)=>{
        const filename = `${Date.now()}-${file.originalname}`;
        const outputPath = path.join(__dirname,'../public/uploads',filename);

        // Resize and crop 

        await sharp(file.buffer)
        .resize(300,300)
        .toFile(outputPath);
        const croppedImg = path.basename(outputPath);

        imagePaths.push(croppedImg)
    });

    await Promise.all(uploadPromises)

    const product = new Product({
        prod_name : req.body.name,
        prod_price:req.body.price,
        prod_desc:req.body.description,
        prod_quantity:req.body.quantity,
        prod_images:imagePaths,
        prod_category:req.body.categoryId,
        prod_size:req.body.sizeId,
        prod_color:req.body.colorId,
        prod_rating:req.body.rating      

    })

    await product.save();
    res.redirect('/admin/products');

}

const loadEditProduct = async(req,res)=>{
    try {
        const products = await Product.findById({_id:req.params.id}).populate('prod_category').populate('prod_size').populate('prod_color')
        const categories = await Category.find();
        const colors = await Color.find();
        const sizes = await Size.find();
      
        res.render('editProduct',{ categories,colors,sizes,products});
    } catch (error) {
        console.log(error);
    }
}

const updateProduct = async (req,res)=>{
    try {
        const files = req.files;
        // const id = req.body.id;    

    if(files && files.length > 0){
    
    const imagePaths = [];
    const uploadPromises = files.map(async(file)=>{
        const filename = `${Date.now()}-${file.originalname}`;
        const outputPath = path.join(__dirname,'../public/uploads',filename);

        // Resize and crop 

        await sharp(file.buffer)
        .resize(300,300)
        .toFile(outputPath);
        const croppedImg = path.basename(outputPath);

        imagePaths.push(croppedImg)
    });

    await Promise.all(uploadPromises)

        
    const productData = await Product.findByIdAndUpdate({_id:req.params.id},           
    {
    $set:{
    prod_name:req.body.name,
    prod_price:req.body.price,
    prod_desc:req.body.description,
    prod_quantity:req.body.quantity,
    prod_images:imagePaths,
    prod_category:req.body.categoryId,
    prod_size:req.body.sizeId,
    prod_color:req.body.colorId,
    prod_rating:req.body.rating      
    }
    }
    )
    
    res.redirect('/admin/products')
    }
   
    else{
            
           const productData = await Product.findByIdAndUpdate({_id:req.params.id},           
            {$set:{prod_name:req.body.name,prod_price:req.body.price,prod_desc:req.body.description,prod_quantity:req.body.quantity,            
            prod_category:req.body.categoryId,prod_size:req.body.sizeId,prod_rating:req.body.rating,prod_color:req.body.colorId }})
            
            console.log(productData)
                
            res.redirect('/admin/products')
            }
    
    
    } catch (error) {
        console.log(error)
    }
    }

    const deleteProduct = async(req,res)=>{
        try {
           
            const productData = await Product.findByIdAndUpdate({_id:req.query.id},{$set:{is_deleted:true, prod_status: 'INACTIVE'}});
            res.redirect('/admin/categories');
        } catch (error) {
            console.log(error)
        }
    }


module.exports = {
    loadProductList,
    loadAddProduct,
    loadEditProduct,
    updateProduct,
    addNewProduct,
    deleteProduct
}