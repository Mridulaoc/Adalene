const Product = require('../models/product');


const getProductOffer = async(req,res)=>{
    try {
        let page = 1;
        const limit = 5
        if(req.query.page){
          page = req.query.page;
        }
    
        const product = await Product.find()
        const totalCount = product.reduce((acc, curr)=>{
          acc+=curr.offer.length
        },0)
        const totalPage = Math.ceil(totalCount/limit)
        const productOffer = await Product.find({
          'offer.name': { $exists: true }
        }).limit(limit).skip((page - 1) * limit);
    
        const productData = {
          
          product,totalPage,productOffer, page,
          
        }
        res.render('productOfferList', productData)
    } catch (error) {
        console.log(error)
    }
}

const getAddProductOffer = async(req,res)=>{
    try {
        const id = req.params.id;
        const product = await Product.findById(id);
        console.log(product)
        res.render('addProductOffer',{product:product});
    } catch (error) {
        console.log(error);
    }
}

const addNewproductOffer = async(req,res)=>{
    try {
       
        const {name,description,startDate,endDate,percentage,productId} = req.body;
        console.log("Received request body:", req.body);
        const product = await Product.findById({_id:productId});
        product.offer = {
            name:name,
            description:description,
            discount_percentage:percentage,
            start_date:startDate,
            end_date:endDate
        }

        await product.save();
        res.redirect('/admin/products')


    } catch (error) {
        console.log(error)
    }
}

const getEditProductOffer = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findById(id);        
        res.render('editProductOffer',{product:product});
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    getProductOffer,
    getAddProductOffer,
    addNewproductOffer,
    getEditProductOffer
}