const express = require("express");
const axios = require("axios"); 
require("dotenv").config();


// Initialize Express app
const app = express();
const port = 3000;

// Define Express route for testing
app.get("/test", async (req, res) => {
 res.status(200).json({ data: "No .mkv link found." });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
