module.exports = class AppError extends Error{
    constructor(statusCode,message) {
        super(message);
        this.statusCode = statusCode;
        this.status =`${this.statusCode}`.startsWith('4')? "Failed" : "Error" ;
        this.isOperational = true;
        Error.captureStackTrace(this,this.constructor)
    }
}