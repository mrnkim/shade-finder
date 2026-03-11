"use strict";

let currImgIndex = 0;
let nextPageToken;
const videoCache = new Map();
let activeVideoElement = null;

const SERVER = window.location.hostname?.includes("replit")
  ? `https://${window.location.hostname}/`
  : "http://localhost:5001/";

const VIDEO_PAGE_LIMIT = 12;
const SEARCH_PAGE_LIMIT = 12;

/********************** Images Data ***************************/
const images = [
  { src: "./images/berry.jpg", label: "Berry Shades" },
  { src: "./images/orange.jpg", label: "Orange Shades" },
  { src: "./images/blue.png", label: "Blue Shades" },
  { src: "./images/green.png", label: "Green Shades" },
  { src: "./images/pink.jpg", label: "Pink Shades" },
  { src: "./images/brown.jpg", label: "Brown Shades" },
];

/********************** DOM Elements **************************/
const carouselImg = document.getElementById("carousel-image");
const colorLabel = document.getElementById("color-label");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const videoListLoading = document.getElementById("video-list-loading");
const videoList = document.getElementById("video-list");
const videoListPagination = document.getElementById("video-list-pagination");
const searchButton = document.getElementById("search");
const videoListContainer = document.getElementById("video-list-container");
const searchResultContainer = document.getElementById(
  "search-result-container"
);
const searchResultList = document.getElementById("search-result-list");

/********************** Event Listeners ***********************/

// Image Carousel Navigation
prevButton.addEventListener("click", () => {
  currImgIndex = currImgIndex === 0 ? images.length - 1 : currImgIndex - 1;
  updateCarousel();
});

nextButton.addEventListener("click", () => {
  currImgIndex = currImgIndex === images.length - 1 ? 0 : currImgIndex + 1;
  updateCarousel();
});

// Search Button Click
searchButton.addEventListener("click", async () => {
  await handleSearchButtonClick();
});

/********************** Helper Functions ***********************/

async function handleSearchButtonClick() {
  toggleSearchButton(false);

  nextPageToken = null;
  searchResultContainer.innerHTML = "";
  videoListContainer.classList.add("hidden");
  searchResultContainer.classList.remove("hidden");
  searchResultList.innerHTML = "";

  const loadingSpinnerContainer = createLoadingSpinner();
  searchResultContainer.appendChild(loadingSpinnerContainer);

  try {
    const { searchResults } = await searchByImage();

    searchResultContainer.removeChild(loadingSpinnerContainer);

    if (searchResults.length > 0) {
      showSearchResults(searchResults);
    } else {
      displayNoResultsMessage();
    }
  } catch (error) {
    console.error("Error fetching search results:", error);
  } finally {
    toggleSearchButton(true);
  }
}

function toggleSearchButton(enable) {
  searchButton.disabled = !enable;
  prevButton.disabled = !enable;
  nextButton.disabled = !enable;
}

function createLoadingSpinner() {
  const loadingSpinnerContainer = document.createElement("div");
  loadingSpinnerContainer.classList.add(
    "flex",
    "justify-center",
    "items-center",
    "py-12"
  );

  const loadingSpinner = document.createElement("img");
  loadingSpinner.src = "./images/LoadingSpinner.svg";
  loadingSpinner.alt = "loading spinner";
  loadingSpinner.classList.add("animate-spin", "h-8", "w-8");

  loadingSpinnerContainer.appendChild(loadingSpinner);
  return loadingSpinnerContainer;
}

function displayNoResultsMessage() {
  const noResultsContainer = document.createElement("div");
  noResultsContainer.classList.add("text-center", "my-8", "p-4");

  const noResultsMessage = document.createElement("p");
  noResultsMessage.textContent = "No search results found :(";
  noResultsMessage.classList.add("text-center", "my-4", "text-text-secondary");

  const backToHomeButton = createBackToHomeButton();

  noResultsContainer.appendChild(noResultsMessage);
  noResultsContainer.appendChild(backToHomeButton);

  searchResultContainer.appendChild(noResultsContainer);
}

async function showSearchResults(searchResults) {
  await Promise.all(
    searchResults.map(async (result) => {
      try {
        const videoDetail = await getVideo(result.videoId);
        result.videoDetail = videoDetail;
      } catch (error) {
        console.error(
          `Error fetching video details for ${result.videoId}:`,
          error
        );
      }
    })
  );

  searchResults.forEach(displaySearchResult);

  if (nextPageToken) {
    createShowMoreButton();
  } else {
    removeExistingButton();
    appendBackToHomeButton();
  }
}

function displaySearchResult(result) {
  const videoContainer = document.createElement("div");
  videoContainer.classList.add(
    "bg-surface",
    "rounded-2xl",
    "overflow-hidden",
    "border",
    "border-border-light",
    "hover:border-border",
    "transition"
  );

  const thumbnailContainer = createThumbnailContainer(result);
  const contentContainer = document.createElement("div");
  contentContainer.classList.add("p-3");

  const videoTitle = createVideoTitle(result);
  const resultDetails = createResultDetails(result);

  contentContainer.append(videoTitle, resultDetails);
  videoContainer.append(thumbnailContainer, contentContainer);
  searchResultList.appendChild(videoContainer);
  searchResultContainer.appendChild(searchResultList);
}

function createVideoTitle(result) {
  const videoTitle = document.createElement("p");
  videoTitle.classList.add(
    "text-xs",
    "font-medium",
    "truncate",
    "mb-1"
  );
  videoTitle.textContent = result.videoDetail?.metadata?.filename || "Untitled";
  return videoTitle;
}

function createThumbnailContainer(result) {
  const thumbnailContainer = document.createElement("div");
  thumbnailContainer.classList.add("relative", "cursor-pointer", "group");

  const thumbnailImage = document.createElement("img");
  thumbnailImage.src = result.thumbnailUrl;
  thumbnailImage.alt = "Video Thumbnail";
  thumbnailImage.classList.add("w-full", "aspect-video", "object-cover");

  const playOverlay = document.createElement("div");
  playOverlay.classList.add(
    "absolute",
    "inset-0",
    "flex",
    "items-center",
    "justify-center",
    "bg-black/20",
    "opacity-0",
    "group-hover:opacity-100",
    "transition"
  );
  playOverlay.innerHTML =
    '<i class="fa-solid fa-play text-white text-2xl"></i>';

  thumbnailContainer.append(thumbnailImage, playOverlay);

  thumbnailContainer.addEventListener("click", () => {
    openVideoPlayer(result);
  });

  return thumbnailContainer;
}

function openVideoPlayer(result) {
  if (!result.videoDetail?.hls?.videoUrl) return;

  // Close any previously active video
  if (activeVideoElement) {
    activeVideoElement.pause();
    const oldOverlay = document.getElementById("video-overlay");
    if (oldOverlay) oldOverlay.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = "video-overlay";
  overlay.classList.add(
    "fixed",
    "inset-0",
    "z-50",
    "bg-black/80",
    "flex",
    "items-center",
    "justify-center",
    "p-4"
  );

  const playerContainer = document.createElement("div");
  playerContainer.classList.add(
    "relative",
    "w-full",
    "max-w-3xl",
    "bg-black",
    "rounded-xl",
    "overflow-hidden"
  );

  const closeButton = document.createElement("button");
  closeButton.classList.add(
    "absolute",
    "top-3",
    "right-3",
    "z-10",
    "text-white",
    "bg-black/50",
    "rounded-full",
    "w-8",
    "h-8",
    "flex",
    "items-center",
    "justify-center",
    "hover:bg-black/70",
    "transition"
  );
  closeButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  closeButton.addEventListener("click", () => {
    video.pause();
    if (video.hlsInstance) video.hlsInstance.destroy();
    overlay.remove();
    activeVideoElement = null;
  });

  const video = document.createElement("video");
  video.classList.add("w-full", "aspect-video");
  video.controls = true;
  video.autoplay = true;

  playerContainer.append(closeButton, video);
  overlay.appendChild(playerContainer);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      video.pause();
      if (video.hlsInstance) video.hlsInstance.destroy();
      overlay.remove();
      activeVideoElement = null;
    }
  });

  document.body.appendChild(overlay);
  activeVideoElement = video;

  const hlsUrl = result.videoDetail.hls.videoUrl;
  const startTime = result.start || 0;

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.currentTime = startTime;
      video.play();
    });
    video.hlsInstance = hls;
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = hlsUrl;
    video.addEventListener("loadedmetadata", () => {
      video.currentTime = startTime;
      video.play();
    });
  }
}

function createResultDetails(result) {
  const resultDetails = document.createElement("div");
  resultDetails.classList.add("flex", "items-center", "justify-between", "text-xs");

  const timeText = document.createElement("span");
  timeText.classList.add("text-text-secondary");
  timeText.textContent = `${Math.floor(result.start / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(result.start % 60)
    .toString()
    .padStart(2, "0")} - ${Math.floor(result.end / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(result.end % 60)
    .toString()
    .padStart(2, "0")}`;

  const confidenceSpan = document.createElement("span");
  confidenceSpan.textContent = result.confidence;
  confidenceSpan.classList.add(
    ...addConfidenceClass(result.confidence)
  );

  resultDetails.append(timeText, confidenceSpan);
  return resultDetails;
}

function createShowMoreButton() {
  removeExistingButton();

  const showMoreButtonContainer = document.createElement("div");
  showMoreButtonContainer.id = "show-more-button";
  showMoreButtonContainer.classList.add("flex", "justify-center", "my-6");

  const showMoreButton = document.createElement("button");
  showMoreButton.classList.add(
    "bg-brand-charcoal",
    "text-text-inverse",
    "hover:bg-gray-600",
    "px-6",
    "py-2.5",
    "rounded-xl",
    "text-sm",
    "font-medium",
    "transition"
  );
  showMoreButton.innerHTML =
    '<i class="fa-solid fa-chevron-down mr-1"></i> Show More';

  showMoreButton.addEventListener("click", async () => {
    const loadingSpinnerContainer = createLoadingSpinner();
    searchResultContainer.appendChild(loadingSpinnerContainer);

    const nextPageResults = await getNextSearchResults(nextPageToken);

    searchResultContainer.removeChild(loadingSpinnerContainer);

    showSearchResults(nextPageResults.searchResults);
    nextPageToken = nextPageResults.pageInfo.nextPageToken || null;
  });
  showMoreButtonContainer.appendChild(showMoreButton);
  searchResultContainer.appendChild(showMoreButtonContainer);
}

function removeExistingButton() {
  const existingButton = document.getElementById("show-more-button");
  if (existingButton) {
    existingButton.remove();
  }
}

function appendBackToHomeButton() {
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("flex", "justify-center", "my-6");

  const backToHomeButton = createBackToHomeButton();
  buttonContainer.appendChild(backToHomeButton);

  searchResultContainer.appendChild(buttonContainer);
}

function addConfidenceClass(confidence) {
  const confidenceClasses = {
    high: [
      "bg-success",
      "text-white",
      "px-2",
      "py-0.5",
      "rounded-full",
      "text-xs",
      "font-medium",
      "capitalize",
    ],
    medium: [
      "bg-warning",
      "text-white",
      "px-2",
      "py-0.5",
      "rounded-full",
      "text-xs",
      "font-medium",
      "capitalize",
    ],
    low: [
      "bg-gray-400",
      "text-white",
      "px-2",
      "py-0.5",
      "rounded-full",
      "text-xs",
      "font-medium",
      "capitalize",
    ],
    default: [
      "bg-gray-500",
      "text-white",
      "px-2",
      "py-0.5",
      "rounded-full",
      "text-xs",
      "font-medium",
    ],
  };
  return confidenceClasses[confidence] || confidenceClasses.default;
}

function createBackToHomeButton() {
  const backToHomeButton = document.createElement("button");
  backToHomeButton.classList.add(
    "bg-surface",
    "border",
    "border-border-light",
    "hover:border-border",
    "px-6",
    "py-2.5",
    "rounded-xl",
    "text-sm",
    "font-medium",
    "transition"
  );
  backToHomeButton.innerHTML =
    '<i class="fa-solid fa-rotate-left mr-1"></i> Back to Home';
  backToHomeButton.addEventListener("click", () => {
    searchResultContainer.classList.add("hidden");
    videoListContainer.classList.remove("hidden");
    showVideos();
  });
  return backToHomeButton;
}

/********************** Server requests ***********************/
async function fetchFromServer(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

async function getVideos(page = 1) {
  return fetchFromServer(
    `${SERVER}videos?page_limit=${VIDEO_PAGE_LIMIT}&page=${page}`
  );
}

async function getVideo(videoId) {
  if (videoCache.has(videoId)) {
    return videoCache.get(videoId);
  }
  const videoDetail = await fetchFromServer(`${SERVER}videos/${videoId}`);
  videoCache.set(videoId, videoDetail);
  return videoDetail;
}

async function searchByImage() {
  const imageSrc = carouselImg.src.split("/").pop();
  const data = await fetchFromServer(
    `${SERVER}search?imageSrc=${encodeURIComponent(
      imageSrc
    )}&pageLimit=${SEARCH_PAGE_LIMIT}`
  );
  if (data) {
    nextPageToken = data.pageInfo.nextPageToken;
    return data;
  }
  return { searchResults: [], pageInfo: {} };
}

async function getNextSearchResults(nextPageToken) {
  return fetchFromServer(`${SERVER}search/${nextPageToken}`);
}

/********************** Initial updates ***********************/
function updateCarousel() {
  carouselImg.src = images[currImgIndex].src;
  colorLabel.textContent = images[currImgIndex].label;
}

async function showVideos(page = 1) {
  videoList.innerHTML = "";

  videoListLoading.classList.add("min-h-[300px]");

  const loadingSpinnerContainer = createLoadingSpinner();
  videoListLoading.append(loadingSpinnerContainer);

  try {
    const { videosDetail, pageInfo } = await getVideoOfVideos(page);

    videoListLoading.removeChild(loadingSpinnerContainer);

    if (videosDetail) {
      videosDetail.forEach((video) => {
        const videoContainer = createVideoContainer(video);
        videoList.appendChild(videoContainer);
      });

      videoListLoading.classList.remove("min-h-[300px]");

      createPaginationButtons(pageInfo, page);
    }
  } catch (error) {
    console.error("Error fetching videos:", error);
  }
}

function createVideoContainer(video) {
  const videoContainer = document.createElement("div");
  videoContainer.classList.add(
    "bg-surface",
    "rounded-2xl",
    "overflow-hidden",
    "border",
    "border-border-light",
    "hover:border-border",
    "transition",
    "cursor-pointer"
  );

  const thumbnailContainer = document.createElement("div");
  thumbnailContainer.classList.add("relative", "group");

  const thumbnailImage = document.createElement("img");
  const thumbnailUrl = video.hls?.thumbnailUrls?.[0];
  if (thumbnailUrl) {
    thumbnailImage.src = thumbnailUrl;
  }
  thumbnailImage.alt = video.metadata?.filename || "Video thumbnail";
  thumbnailImage.classList.add("w-full", "aspect-video", "object-cover", "bg-card");

  const playOverlay = document.createElement("div");
  playOverlay.classList.add(
    "absolute",
    "inset-0",
    "flex",
    "items-center",
    "justify-center",
    "bg-black/20",
    "opacity-0",
    "group-hover:opacity-100",
    "transition"
  );
  playOverlay.innerHTML =
    '<i class="fa-solid fa-play text-white text-2xl"></i>';

  thumbnailContainer.append(thumbnailImage, playOverlay);

  const videoTitle = document.createElement("div");
  videoTitle.classList.add("p-3");
  videoTitle.innerHTML = `<p class="text-xs font-medium truncate">${video.metadata?.filename || "Untitled"}</p>`;

  videoContainer.append(thumbnailContainer, videoTitle);

  videoContainer.addEventListener("click", () => {
    openVideoPlayer({
      start: 0,
      videoDetail: video,
    });
  });

  return videoContainer;
}

function createPaginationButtons(pageInfo, currentPage) {
  videoListPagination.innerHTML = "";
  for (let i = 1; i <= pageInfo.totalPage; i++) {
    const pageButton = createPageButton(i, currentPage);
    videoListPagination.appendChild(pageButton);
  }
}

function createPageButton(pageNumber, currentPage) {
  const pageButton = document.createElement("button");
  pageButton.textContent = pageNumber;
  pageButton.classList.add(
    "w-8",
    "h-8",
    "rounded-full",
    "text-sm",
    "transition"
  );

  if (pageNumber === currentPage) {
    pageButton.classList.add("bg-brand-charcoal", "text-text-inverse", "font-medium");
    pageButton.disabled = true;
  } else {
    pageButton.classList.add(
      "bg-surface",
      "border",
      "border-border-light",
      "hover:border-border"
    );
    pageButton.addEventListener("click", () => showVideos(pageNumber));
  }

  return pageButton;
}

async function getVideoOfVideos(page = 1) {
  const videosResponse = await getVideos(page);

  if (videosResponse.videos.length > 0) {
    const videosDetail = await Promise.all(
      videosResponse.videos.map((video) => getVideo(video.id))
    );

    return { videosDetail, pageInfo: videosResponse.page_info };
  }
}

updateCarousel();
showVideos();
