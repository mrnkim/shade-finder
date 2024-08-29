const request = require("supertest");
const app = require("./server");

describe("API Endpoints", () => {
  it("should return a list of videos", async () => {
    const res = await request(app)
      .get("/videos")
      .query({ page_limit: 5, page: 1 });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("videos");
    expect(Array.isArray(res.body.videos)).toBe(true);
  });

  it("should return a specific video", async () => {
    const videoId = "video1";
    const res = await request(app).get(`/videos/${videoId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("metadata");
    expect(res.body).toHaveProperty("hls");
    expect(res.body).toHaveProperty("source");
  });

  it("should return search results based on an image query", async () => {
    const imageSrc = "berry.jpg";
    const res = await request(app).get("/search").query({
      imageSrc: imageSrc,
      threshold: 0.5,
      pageLimit: 5,
      adjustConfidenceLevel: 0.6,
    });

    if (res.statusCode === 404) {
      expect(res.body).toHaveProperty("error");
    } else {
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("searchResults");
      expect(Array.isArray(res.body.searchResults)).toBe(true);
    }
  });
});
