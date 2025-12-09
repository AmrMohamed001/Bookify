const mongoose = require('mongoose')
require('dotenv').config({path:'./src/configs/config.env'})
const app = require('./app')
const connectDB = require("./configs/db");

let server
connectDB().then(() => {
    server = app.listen(process.env.PORT||3000, () => console.log("Server is booting 🚀 🌍"));
}).catch(err =>{
    console.log(err);
    process.exit(1);
});

process.on('unhandledRejection',(err)=>{
    console.log(`UNHANDLED REJECTION ${err.name} : ${err.message}`)
    console.log(err)
    server.close(()=>{
        console.log('SHUTTING DOWN . . . ')
        process.exit(1)
    })
})

