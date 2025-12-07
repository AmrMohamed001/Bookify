const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECTION);
        console.log("DB started 🗄️");
    } catch (err) {
        console.error("DB error", err);
        process.exit(1);
    }
};

module.exports = connectDB;