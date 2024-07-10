const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require("cors");
const { TwelveLabs } = require("twelvelabs-js");

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

const client = new TwelveLabs({ apiKey: API_KEY });

const HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
};

/** Get videos */
app.get("/videos", async (request, response, next) => {
  try {
    const index = await client.index.retrieve(`${INDEX_ID}`);
    const pagination = await client.index.video.listPagination(index.id, {
      pageLimit: request.query.page_limit,
      page: request.query.page,
    });

    const videos = pagination.data.map((video) => ({
      id: video.id,
      metadata: video.metadata,
    }));

    const responseData = {
      videos,
      page_info: pagination.pageInfo,
    };

    response.json(responseData);
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
