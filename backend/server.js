const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { TwelveLabs, SearchData } = require("twelvelabs-js");

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

/** Image search */
app.get("/search", async (request, response, next) => {
  try {
    const imageSrc = request.query.imageSrc;
    const imagePath = path.join(
      __dirname,
      "../frontend/public/images",
      imageSrc
    );

    // Check if the image file exists
    if (!fs.existsSync(imagePath)) {
      console.error("Image not found at path:", imagePath);
      return response.status(404).json({ error: "Image not found" });
    }

    const imageResult = await client.search.query({
      indexId: INDEX_ID,
      queryMediaFile: fs.createReadStream(imagePath),
      queryMediaType: "image",
      options: ["visual"],
      threshold: "high",
      page_limit: "12",
      // adjust_confidence_level: "0.7",
    });
    console.log("🚀 > app.get > imageResult=", imageResult);

    // Inspect the structure of imageResult
    const searchResults = imageResult.data;

    const responseData = {
      searchResults,
      pageInfo: imageResult.pageInfo,
    };
    response.json(responseData);
    // let nextPageDataByImage = await imageResult.next();
    // while (nextPageDataByImage !== null) {
    //   nextPageDataByImage.forEach((clip) => {
    //     console.log(
    //       `  score=${clip.score} start=${clip.start} end=${clip.end} confidence=${clip.confidence}`
    //     );
    //     searchResults.push({
    //       score: clip.score,
    //       start: clip.start,
    //       end: clip.end,
    //       confidence: clip.confidence,
    //     });
    //   });
    //   nextPageDataByImage = await imageResult.next();
    // }
  } catch (error) {
    console.error("Error searching for image:", error);
    response.status(500).send("Internal Server Error");
  }
});
