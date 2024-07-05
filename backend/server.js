const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const API_KEY = process.env.TWELVE_LABS_API_KEY;

app.post("/api/search", async (req, res) => {
  const { image } = req.body;

  try {
    const response = await axios.post("https://api.twelvelabs.io/search", {
      image,
      apiKey: API_KEY,
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error searching videos", error);
    res.status(500).send("Server Error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
