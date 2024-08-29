// Mock data for Video List with Pagination
const mockVideosResponse = {
  data: [
    {
      id: "video1",
      metadata: { title: "Test Video 1" },
      hls: undefined,
      source: undefined,
      indexedAt: "2024-06-27T05:11:29Z",
      createdAt: "2024-06-27T05:01:35Z",
      updatedAt: "2024-06-27T05:01:52Z",
    },
    {
      id: "video2",
      metadata: { title: "Test Video 2" },
      hls: undefined,
      source: undefined,
      indexedAt: "2024-06-27T05:11:29Z",
      createdAt: "2024-06-27T05:01:35Z",
      updatedAt: "2024-06-27T05:01:52Z",
    },
  ],
  pageInfo: {
    page: 1,
    limitPerPage: 12,
    totalPage: 3,
    totalResults: 29,
    totalDuration: 19122,
  },
};

// Mock data for a single Video
const mockVideoResponse = {
  id: "video1",
  metadata: {
    duration: 54,
    engine_ids: ["marengo2.6", "pegasus1.1"],
    filename: "test video name",
    fps: 30,
    height: 1280,
    size: 9601300,
    video_title: "test video title",
    width: 720,
  },
  hls: {
    videoUrl: "https://example.com/video.m3u8",
    thumbnailUrls: ["https://example.com/thumbnail.jpg"],
    status: "COMPLETE",
    updatedAt: "2024-05-22T02:49:49.074Z",
  },
  source: {
    type: "youtube",
    name: "youtuber",
    url: "https://www.youtube.com/watch?v=video1",
  },
  indexedAt: "2024-05-22T03:03:53Z",
  createdAt: "2024-05-22T02:49:28Z",
  updatedAt: "2024-05-22T02:49:36Z",
};

// Mock data for Search Results
const mockSearchResponse = {
  pool: {
    totalCount: 29,
    totalDuration: 19122,
    indexId: "index1",
  },
  data: [
    {
      score: 84.45,
      start: 379.133,
      end: 381,
      metadata: [{ title: "Search Result 1" }],
      videoId: "video1",
      confidence: "high",
      thumbnailUrl: "https://example.com/thumbnail.jpg",
    },
  ],
  pageInfo: {
    limitPerPage: 12,
    totalResults: 20,
    pageExpiredAt: "2024-08-15T04:09:46Z",
    nextPageToken: "nextPageToken1",
  },
};

const mockTwelveLabs = {
  index: {
    video: {
      listPagination: jest.fn().mockResolvedValue(mockVideosResponse),
      retrieve: jest.fn().mockResolvedValue(mockVideoResponse),
    },
  },
  search: {
    query: jest.fn().mockResolvedValue(mockSearchResponse),
    byPageToken: jest.fn().mockResolvedValue(mockSearchResponse),
  },
};

module.exports = {
  TwelveLabs: jest.fn().mockImplementation(() => mockTwelveLabs),
};
