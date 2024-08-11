const res = require('express/lib/response');
const Product = require('../models/product');
const Category = require('../models/category');
const Offer = require('../models/offer');


const getOfferList = async (req, res) => {
    try {
        let page = 1;
        const limit = 5
        if(req.query.page){
          page = req.query.page;
        }
        const offer = await Offer.find({});
        const count = await Offer.find().countDocuments();
        const totalPage = Math.ceil(count / limit);

        res.render('offerList', {offers: offer,totalPage,page})
    } catch (error) {
        console.log(error);
    }
}




const getAddOfferPage = async(req,res)=>{
    try {
       
        res.render('addOffer');
    } catch (error) {
        console.log(error);
    }
}


const addNewOffer = async(req,res)=>{
    try {
        const {name,description,startDate,endDate,percentage} = req.body;
        const isExisting = await Offer.findOne({
            name: new RegExp(`^${name}$`, "i"),
          });
          if (isExisting) {
            res.render("addOffer", { error: "Offer name should be unique" });
          } else {
            const offer = new Offer({
              name,
              description,
              start_date:startDate,
              end_date:endDate,
              discount_percentage:percentage
            });
            await offer.save();
      
            res.redirect("/admin/offers");
          }

    } catch (error) {
        console.log(error)
    }
}

const getEditOfferPage = async(req, res)=>{
    try {
        const id = req.query.id;
        console.log(id)
        const offer = await Offer.findById(id);
        res.render('editOffer', {offer})

    } catch (error) {
        console.log(error)
    }
}

const updateOffer = async(req, res)=>{
    try {
        const id = req.params.id;
        const {name,description,startDate,endDate,percentage} =req.body;
        const offer = await Offer.findByIdAndUpdate(
            {_id:id},
            {$set:{name:name,description:description,start_date:startDate,end_date:endDate,discount_percentage:percentage}}
        )
        res.redirect('/admin/offers')
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    
    getOfferList,
    getAddOfferPage,
    addNewOffer,
    getEditOfferPage,
    updateOffer
}