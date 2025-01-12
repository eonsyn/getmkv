const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
require("dotenv").config();

let puppeteer;
let chrome = {};

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}

// Initialize Express app
const app = express();
const port = 3000;

// Function to fetch the .mkv link
const fetchMkvLink = async (finalLink) => {
  let browser = null;
  try {
    console.log("Launching browser...");
    // Options for Puppeteer depending on environment (local vs serverless)
    let options = {};

    if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
      options = {
        args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
        defaultViewport: chrome.defaultViewport,
        executablePath: await chrome.executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
      };
    }

    // Launch Puppeteer browser
    browser = await puppeteer.launch(options);
    const page = await browser.newPage();

    // Set the user-agent and other necessary headers (optional)
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
    );

    // Navigate to the URL
    await page.goto(finalLink, { waitUntil: "domcontentloaded" });

    // Wait for the page to load
    await page.waitForSelector("body");

    // Extract URL from the page (if available)
    const url = await page.evaluate(() => window.url || null);
    if (url) {
      console.log("Extracted URL:", url);
    } else {
      console.log("URL not found on the page.");
    }

    // Close the browser
    await browser.close();

    // Fetch the HTML content using axios
    const response = await axios.get(url);
    const htmlContent = response.data;

    // Load the HTML content into Cheerio
    const $ = cheerio.load(htmlContent);

    // Find the first anchor tag with href ending in .mkv
    const mkvLink = $('a[href$=".mkv"]').attr("href");

    if (mkvLink) {
      console.log("Found .mkv link:", mkvLink);
      return mkvLink; // Return the found .mkv link
    } else {
      console.log("No .mkv link found.");
      return null; // Return null if no link is found
    }
  } catch (error) {
    console.error("Error in fetchMkvLink:", error.message);
    return null; // Return null in case of an error
  }
};

// Define Express route for testing
app.get("/test", async (req, res) => {
  try {
    const { finalLink } = req.query;
    const data = await fetchMkvLink(finalLink);
    if (data) {
      res.json({ message: data });
    } else {
      res.status(404).json({ error: "No .mkv link found." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
