const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv/config')
const mongoose = require('mongoose');
mongoose.connect(process.env.CONNECTION_STRING)
.then(()=>{
    console.log("Database connected successfully")
})
.catch((err)=>{
    console.log(err)
});

const userRoute = require('./routers/userRouter');
app.use('/',userRoute);

const adminRoute = require('./routers/adminRouter');
app.use('/admin',adminRoute);

const categoryRoute = require('./routers/categoryRouter');
app.use('/admin', categoryRoute);

const productRoute = require('./routers/productRouter');
app.use('/admin', productRoute);

const userManagementRoute = require('./routers/userManagementRouter');
app.use('/admin', userManagementRoute)

app.listen(3000, ()=>{
    console.log("Server starting...")
})
