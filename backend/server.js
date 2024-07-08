const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const PORT = process.env.PORT;
const API_BASE_URL = "https://api.twelvelabs.io/v1.2";
const API_KEY = process.env.TWELVE_LABS_API_KEY;
const INDEX_ID = process.env.TWELVE_LABS_INDEX_ID;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
};

/** Get videos */
app.get("/videos", async (request, response, next) => {
  if (!INDEX_ID) return Error;

  const params = {
    page_limit: request.query.page_limit,
  };
  console.log("🚀 > app.get > params=", params);

  try {
    const options = {
      method: "GET",
      url: `${API_BASE_URL}/indexes/${INDEX_ID}/videos`,
      headers: { ...HEADERS },
      params: params,
    };
    console.log("🚀 > app.get > options=", options);
    const apiResponse = await axios.request(options);
    response.json(apiResponse.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || "Error Getting Videos";
    return next({ status, message });
  }
});

/** Get a video of an index */
app.get("/videos/:videoId", async (request, response, next) => {
  const videoId = request.params.videoId;

  try {
    const options = {
      method: "GET",
      url: `${API_BASE_URL}/indexes/${INDEX_ID}/videos/${videoId}`,
      headers: { ...HEADERS },
    };
    const apiResponse = await axios.request(options);
    response.json(apiResponse.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || "Error Getting a Video";
    return next({ status, message });
  }
});
