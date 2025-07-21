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

// Add debug logs for initialization
console.log("Initializing server with:");
console.log("API_KEY exists:", !!API_KEY);
console.log("API_KEY starts with:", API_KEY?.substring(0, 8) + "...");
console.log("INDEX_ID:", INDEX_ID);

// Debug client object
console.log("TwelveLabs client structure:", {
  hasClient: !!client,
  clientKeys: Object.keys(client),
  hasVideos: !!client?.videos,
  hasVideo: !!client?.video,
  hasIndex: !!client?.index,
  hasIndexes: !!client?.indexes,
});

try {
  const { version } = require("twelvelabs-js/package.json");
  console.log("TwelveLabs SDK version:", version);
} catch (error) {
  console.warn("Could not determine TwelveLabs SDK version");
}

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

    try {
      console.log("Fetching videos through index API...");
      const videosResponse = await client.index.video.list(INDEX_ID, {
        page: parseInt(page) || 1,
        pageLimit: parseInt(page_limit) || 10,
      });

      // Transform the response to match frontend expectations
      const videos = videosResponse.map((video) => {
        const transformedVideo = {
          id: video.id,
          metadata: {
            filename:
              video.systemMetadata?.filename ||
              video.userMetadata?.filename ||
              "Untitled",
            title: video.systemMetadata?.title || video.userMetadata?.title,
            description:
              video.systemMetadata?.description ||
              video.userMetadata?.description,
          },
          source: {
            url: video.hls?.videoUrl || video.source?.url || "",
          },
        };
        console.log(`Video ${video.id} URL:`, video.hls?.videoUrl);
        return transformedVideo;
      });

      const response = {
        videos,
        page_info: {
          page: parseInt(page) || 1,
          page_limit: parseInt(page_limit) || 10,
          total_count: videos.length,
        },
      };

      console.log("Final response example:", {
        totalVideos: videos.length,
        firstVideo: response.videos[0],
      });

      res.json(response);
    } catch (error) {
      console.error("Error fetching videos:", {
        name: error.name,
        message: error.message,
        status: error.status,
      });
      throw error;
    }
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
