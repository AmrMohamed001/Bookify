const express = require('express')
const morgan = require('morgan')
const app = express();
/////////////////////////////////////////////////////////////////
const categoryRouter = require('./routes/categoryRoute')
/////////////////////////////////////////////////////////////////
// MIDDLEWARES
app.use(express.json({limit:'10kb'}))
app.use(express.static(`${__dirname}/public`));
if(process.env.NODE_ENV === 'development') app.use(morgan('dev'))
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});
app.use('/',(req,res)=>res.status(200).json({message:"Welcome to Bookify server" , timeCost:req.requestTime}))
/////////////////////////////////////////////////////////////////
// MOUNTING
app.use('/api/v1/categories',categoryRouter)
module.exports = app;