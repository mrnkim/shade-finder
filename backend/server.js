const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const asyncHandler = require("express-async-handler");
const { TwelveLabs } = require("twelvelabs-js");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend/public")));

const PORT = 5001;
const API_BASE_URL = "https://api.twelvelabs.io/v1.2";
const API_KEY = process.env.TWELVE_LABS_API_KEY;
const INDEX_ID = process.env.TWELVE_LABS_INDEX_ID;

const client = new TwelveLabs({ apiKey: API_KEY });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/** Global error handler */
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
});

/** Get videos */
app.get(
  "/videos",
  asyncHandler(async (req, res, next) => {
    const { page_limit, page } = req.query;

    const pagination = await client.index.video.listPagination(INDEX_ID, {
      pageLimit: page_limit,
      page: page,
    });

    const videos = pagination.data.map((video) => ({
      id: video.id,
      metadata: video.metadata,
    }));

    res.json({
      videos,
      page_info: pagination.pageInfo,
    });
  })
);

//TODO: Change to SDK (once the response includes source object)
/** Get a video of an index */
app.get(
  "/videos/:videoId",
  asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;

    const options = {
      method: "GET",
      url: `${API_BASE_URL}/indexes/${INDEX_ID}/videos/${videoId}`,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    };

    const apiResponse = await axios.request(options);

    res.json(apiResponse.data);
  })
);

/** Search videos based on an image query */
app.get(
  "/search",
  asyncHandler(async (req, res, next) => {
    const { imageSrc } = req.query;
    const imagePath = path.join(
      __dirname,
      "../frontend/public/images",
      imageSrc
    );

    if (!fs.existsSync(imagePath)) {
      console.error("Image not found at path:", imagePath);
      return res.status(404).json({ error: "Image not found" });
    }

    const imageResult = await client.search.query({
      indexId: INDEX_ID,
      queryMediaFile: fs.createReadStream(imagePath),
      queryMediaType: "image",
      options: ["visual"],
      threshold: "medium",
      pageLimit: "12",
      adjustConfidenceLevel: "0.6",
    });

    res.json({
      searchResults: imageResult.data,
      pageInfo: imageResult.pageInfo,
    });
  })
);

/** Get search results of a specific page */
app.get(
  "/search/:pageToken",
  asyncHandler(async (req, res, next) => {
    const { pageToken } = req.params;

    let searchResults = await client.search.byPageToken(`${pageToken}`);

    res.json({
      searchResults: searchResults.data,
      pageInfo: searchResults.pageInfo,
    });
  })
);
