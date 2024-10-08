"use strict";

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const { TwelveLabs } = require("twelvelabs-js");

dotenv.config();

const app = express();
module.exports = app;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend/public")));

const PORT = 5001;
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

    const videosResponse = await client.index.video.listPagination(INDEX_ID, {
      pageLimit: page_limit,
      page: page,
    });

    const videos = videosResponse.data.map((video) => ({
      id: video.id,
      metadata: video.metadata,
    }));

    res.json({
      videos,
      page_info: videosResponse.pageInfo,
    });
  })
);

/** Get a video of an index */
app.get(
  "/videos/:videoId",
  asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;

    const videoResponse = await client.index.video.retrieve(INDEX_ID, videoId);

    res.json({
      metadata: videoResponse.metadata,
      hls: videoResponse.hls,
      source: videoResponse.source,
    });
  })
);

/** Search videos based on an image query */
app.get(
  "/search",
  asyncHandler(async (req, res, next) => {
    const { imageSrc, threshold, pageLimit, adjustConfidenceLevel } = req.query;

    const imagePath = path.join(
      __dirname,
      "../frontend/public/images",
      imageSrc
    );

    if (!fs.existsSync(imagePath)) {
      console.error("Image not found at path:", imagePath);
      return res.status(404).json({ error: "Image not found" });
    }

    const searchResponse = await client.search.query({
      indexId: INDEX_ID,
      queryMediaFile: fs.createReadStream(imagePath),
      queryMediaType: "image",
      options: ["visual"],
      threshold: threshold,
      pageLimit: pageLimit,
      adjustConfidenceLevel: adjustConfidenceLevel,
    });

    res.json({
      searchResults: searchResponse.data,
      pageInfo: searchResponse.pageInfo,
    });
  })
);

/** Get search results of a specific page */
app.get(
  "/search/:pageToken",
  asyncHandler(async (req, res, next) => {
    const { pageToken } = req.params;

    let searchByPageResponse = await client.search.byPageToken(`${pageToken}`);

    res.json({
      searchResults: searchByPageResponse.data,
      pageInfo: searchByPageResponse.pageInfo,
    });
  })
);
