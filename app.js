const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
// import swal from 'sweetalert';
require("dotenv/config");
const mongoose = require("mongoose");
const { attachCartData } = require("./middleware/cartMiddleware");
const paypal = require("./utils/paypal");

mongoose
  .connect(process.env.CONNECTION_STRING, {
   
    
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.log(err);
  });

const port = process.env.PORT;

const adminRoute = require("./routers/adminRouter");
app.use("/admin", adminRoute);

app.use(attachCartData);
const userRoute = require("./routers/userRouter");
app.use("/", userRoute);

app.listen(port, () => {
  console.log("Server starting...");
});
