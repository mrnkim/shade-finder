// Mock data for Video List
const mockVideosResponse = {
  data: [
    {
      id: "video1",
      systemMetadata: { filename: "Test Video 1", duration: 54, fps: 30, height: 1280, width: 720 },
      hls: { videoUrl: "https://example.com/video1.m3u8", thumbnailUrls: ["https://example.com/thumb1.jpg"], status: "COMPLETE" },
      indexedAt: "2024-06-27T05:11:29Z",
      createdAt: "2024-06-27T05:01:35Z",
      updatedAt: "2024-06-27T05:01:52Z",
    },
    {
      id: "video2",
      systemMetadata: { filename: "Test Video 2", duration: 120, fps: 24, height: 720, width: 1280 },
      hls: { videoUrl: "https://example.com/video2.m3u8", thumbnailUrls: ["https://example.com/thumb2.jpg"], status: "COMPLETE" },
      indexedAt: "2024-06-27T05:11:29Z",
      createdAt: "2024-06-27T05:01:35Z",
      updatedAt: "2024-06-27T05:01:52Z",
    },
  ],
  response: {
    pageInfo: {
      page: 1,
      limitPerPage: 12,
      totalPage: 3,
      totalResults: 29,
    },
  },
};

// Mock data for a single Video
const mockVideoResponse = {
  id: "video1",
  systemMetadata: {
    duration: 54,
    filename: "test video name",
    fps: 30,
    height: 1280,
    size: 9601300,
    width: 720,
  },
  hls: {
    videoUrl: "https://example.com/video.m3u8",
    thumbnailUrls: ["https://example.com/thumbnail.jpg"],
    status: "COMPLETE",
    updatedAt: "2024-05-22T02:49:49.074Z",
  },
  indexedAt: "2024-05-22T03:03:53Z",
  createdAt: "2024-05-22T02:49:28Z",
  updatedAt: "2024-05-22T02:49:36Z",
};

// Mock data for Search Results
const mockSearchResponse = {
  data: [
    {
      score: 84.45,
      start: 379.133,
      end: 381,
      videoId: "video1",
      confidence: "high",
      thumbnailUrl: "https://example.com/thumbnail.jpg",
    },
  ],
  response: {
    pageInfo: {
      limitPerPage: 12,
      totalResults: 20,
      pageExpiresAt: "2024-08-15T04:09:46Z",
      nextPageToken: "nextPageToken1",
    },
  },
};

// Mock data for search.retrieve (byPageToken)
const mockSearchRetrieveResponse = {
  data: [
    {
      score: 80.12,
      start: 100,
      end: 105,
      videoId: "video2",
      confidence: "medium",
      thumbnailUrl: "https://example.com/thumbnail2.jpg",
    },
  ],
  pageInfo: {
    limitPerPage: 12,
    totalResults: 20,
    pageExpiresAt: "2024-08-15T04:09:46Z",
    nextPageToken: "nextPageToken2",
  },
};

const mockTwelveLabs = {
  indexes: {
    videos: {
      list: jest.fn().mockResolvedValue(mockVideosResponse),
      retrieve: jest.fn().mockResolvedValue(mockVideoResponse),
    },
  },
  search: {
    query: jest.fn().mockResolvedValue(mockSearchResponse),
    retrieve: jest.fn().mockResolvedValue(mockSearchRetrieveResponse),
  },
};

module.exports = {
  TwelveLabs: jest.fn().mockImplementation(() => mockTwelveLabs),
};
