const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const gmailRoutes = require("./routes/gmailRoutes");

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

app.use("/", gmailRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
