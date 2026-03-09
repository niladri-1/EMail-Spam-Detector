const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI, {
			dbName: process.env.MONGODB_NAME
		});
		console.log("MongoDB Connected Successfully");
	} catch (error) {
		console.error("Database connection failed:", error.message);
		process.exit(1);
	}
};

module.exports = connectDB;