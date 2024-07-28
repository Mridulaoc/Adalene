const productRoute = require("../routers/productRouter");
const Product = require("../models/product");
const Category = require("../models/category");
const Color = require("../models/color");
const Size = require("../models/size");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { ObjectId } = require("mongodb");

const loadProductList = async (req, res) => {
  try {
    if (req.session.userid) {
      let search = "";
      if (req.query.search) {
        search = req.query.search;
        console.log(search);
      }
      let page = 1;
      if (req.query.page) {
        page = req.query.page;
      }
      const limit = 5;

      const productsData = await Product.find({
        prod_name: { $regex: ".*" + search + ".*", $options: "i" },
      })
        .populate("prod_category")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ created_on: -1 })
        .lean()
        .exec();

      const count = await Product.find({
        prod_name: { $regex: ".*" + search + ".*", $options: "i" },
      }).countDocuments();

      const productsWithOfferStatus = productsData.map(product => ({
        ...product,
        has_offer: !!product.offer && new Date(product.offer.end_date) > new Date()
      }));

      res.render("productList", {
        products: productsWithOfferStatus,
        search,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    const colors = await Color.find();
    const sizes = await Size.find();
    res.render("addProduct", { categories, colors, sizes });
  } catch (error) {
    console.log(error);
  }
};

const addNewProduct = async (req, res) => {
  const {
    name,
    price,
    mPrice,
    description,
    quantity,
    categoryId,
    sizeId,
    colorId,
    rating,
  } = req.body;
  // console.log(name,price,description)

  const files = req.files;
  // console.log(files)

  if (!files || files.length === 0) {
    console.log("No files found");
  }

  const imagePaths = [];
  const uploadPromises = files.map(async (file) => {
    const filename = `${Date.now()}-${file.originalname}`;
    const outputPath = path.join(__dirname, "../public/uploads", filename);

    console.log(outputPath);
    await sharp(file.buffer).resize(500, 500).toFile(outputPath);
    const croppedImg = path.basename(outputPath);

    imagePaths.push(croppedImg);
    // console.log(imagePaths)
  });

  await Promise.all(uploadPromises);

  const product = new Product({
    prod_name: name,
    prod_price: price,
    prod_mrp: mPrice,
    prod_desc: description,
    prod_quantity: quantity,
    prod_images: imagePaths,
    prod_category: categoryId,
    prod_size: sizeId,
    prod_color: colorId,
    prod_rating: rating,
  });

  await product.save();
  console.log(product);
  res.redirect("/admin/products");
};

const loadEditProduct = async (req, res) => {
  try {
    if (req.session.userid) {
      const products = await Product.findById({ _id: req.params.id })
        .populate("prod_category")
        .populate("prod_size")
        .populate("prod_color");
      const categories = await Category.find();
      const colors = await Color.find();
      const sizes = await Size.find();

      res.render("editProduct", { categories, colors, sizes, products });
    }
  } catch (error) {
    console.log(error);
  }
};

const updateProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      mPrice,
      description,
      quantity,
      categoryId,
      sizeId,
      colorId,
      rating,
    } = req.body;
    const files = req.files;
    const productId = req.params.id;

    if (files && files.length > 0) {
      imagePaths = [];
      const uploadPromises = files.map(async (file) => {
        const filename = `${Date.now()}-${file.originalname}`;
        const outputPath = path.join(__dirname, "../public/uploads", filename);
        // Resize and crop

        await sharp(file.buffer).resize(500, 500).toFile(outputPath);
        const croppedImg = path.basename(outputPath);

        imagePaths.push(croppedImg);
      });
      await Promise.all(uploadPromises);

      const product = await Product.findById(productId);
      const updatedImages = [...product.prod_images, ...imagePaths];

      (product.prod_name = name), (product.prod_category = categoryId);
      product.prod_desc = description;
      product.prod_price = price;
      (product.prod_mrp = mPrice), (product.prod_color = colorId);
      product.prod_images = updatedImages;
      product.prod_size = sizeId;
      product.prod_quantity = quantity;
      product.prod_rating = rating;
      await product.save();

      res.redirect("/admin/products");
    } else {
      const productData = await Product.findByIdAndUpdate(
        { _id: req.params.id },
        {
          $set: {
            prod_name: req.body.name,
            prod_price: req.body.price,
            prod_desc: req.body.description,
            prod_quantity: req.body.quantity,
            prod_category: req.body.categoryId,
            prod_size: req.body.sizeId,
            prod_rating: req.body.rating,
            prod_color: req.body.colorId,
          },
        }
      );

      console.log(productData);

      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error);
  }
};

const deleteProductImage = async (req, res) => {
  const { index, image, productId } = req.body;
  console.log(index, image, productId);

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const imagePath = path.join(__dirname, "../public/uploads", image);

    fs.unlink(imagePath, (err) => {
      if (err) {
        return res.status(500).send("Failed to delete image file");
      }
      product.prod_images.splice(index, 1);
      product.save();
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById({ _id: id });
    if (productData.is_deleted) {
      await Product.findByIdAndUpdate(
        { _id: id },
        { $set: { is_deleted: false } }
      );
      res.status(301).redirect("/admin/products");
    } else {
      await Product.findByIdAndUpdate(
        { _id: id },
        { $set: { is_deleted: true } }
      );
      res.status(301).redirect("/admin/products");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadProductList,
  loadAddProduct,
  loadEditProduct,
  updateProduct,
  addNewProduct,
  deleteProduct,
  deleteProductImage,
};
