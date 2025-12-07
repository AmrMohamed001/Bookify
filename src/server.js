const mongoose = require('mongoose')
require('dotenv').config({path:'./src/configs/config.env'})
const app = require('./app')
const connectDB = require("./configs/db");
console.log(process.env.PORT)

connectDB().then(() => {
    app.listen(process.env.PORT||3000, () => console.log("Server is booting 🚀 🌍"));
}).catch(err =>{
    console.log(err);
    process.exit(1);
});

