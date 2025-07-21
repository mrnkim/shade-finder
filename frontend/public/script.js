"use strict";

let currImgIndex = 0;
let nextPageToken;
const videoCache = new Map();
let activeIframe = null;

const SERVER = window.location.hostname?.includes("replit")
  ? `https://${window.location.hostname}/`
  : "http://localhost:5001/";

const VIDEO_PAGE_LIMIT = 12;
const THRESHOLD = "medium";
const SEARCH_PAGE_LIMIT = 12;
const CONFIDENCE_LEVEL = 0.6;

/********************** Images Data ***************************/
const images = [
  { src: "./images/berry.jpg", label: "Berry Shades" },
  { src: "./images/orange.png", label: "Orange Shades" },
  { src: "./images/blue.png", label: "Blue Shades" },
  { src: "./images/green.png", label: "Green Shades" },
  { src: "./images/pink.png", label: "Pink Shades" },
  { src: "./images/brown.png", label: "Brown Shades" },
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
    "items-center"
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
  noResultsContainer.classList.add("text-center", "my-4", "p-4");

  const noResultsMessage = document.createElement("p");
  noResultsMessage.textContent = "No search results found :(";
  noResultsMessage.classList.add("text-center", "my-4");

  const backToHomeButton = createBackToHomeButton();
  backToHomeButton.classList.add(
    "flex",
    "justify-center",
    "items-center",
    "my-4",
    "mx-auto",
    "p-4"
  );

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
    "flex",
    "flex-col",
    "justify-center",
    "items-center",
    "p-3",
    "gap-1",
    "my-4"
  );

  const videoTitle = createVideoTitle(result);
  const thumbnailContainer = createThumbnailContainer(result);
  const iframeContainer = createIframeContainer(result);
  const resultDetails = createResultDetails(result);

  videoContainer.append(
    videoTitle,
    thumbnailContainer,
    iframeContainer,
    resultDetails
  );
  searchResultList.appendChild(videoContainer);
  searchResultContainer.appendChild(searchResultList);

  thumbnailContainer.querySelector("img").addEventListener("click", () => {
    toggleThumbnailAndIframe(thumbnailContainer, iframeContainer, result);
  });
}

function createVideoTitle(result) {
  const videoTitle = document.createElement("div");
  videoTitle.classList.add(
    "w-full",
    "overflow-hidden",
    "whitespace-nowrap",
    "text-ellipsis"
  );
  videoTitle.innerHTML = `<p class="text-center mb-2 text-xs truncate">${result.videoDetail.metadata.filename}</p>`;
  return videoTitle;
}

function createThumbnailContainer(result) {
  const thumbnailContainer = document.createElement("div");
  const thumbnailImage = document.createElement("img");
  thumbnailImage.src = result.thumbnailUrl;
  thumbnailImage.alt = "Video Thumbnail";
  thumbnailImage.style.maxWidth = "100%";
  thumbnailImage.style.maxHeight = "100%";
  thumbnailImage.style.cursor = "pointer";
  thumbnailContainer.appendChild(thumbnailImage);
  return thumbnailContainer;
}

function createIframeContainer(result) {
  const iframeContainer = document.createElement("div");
  iframeContainer.style.display = "none";
  const iframeElement = document.createElement("iframe");
  iframeElement.width = 220;
  iframeElement.height = 140;
  iframeElement.src = `${result.videoDetail.source.url.replace(
    "watch?v=",
    "embed/"
  )}?start=${Math.round(result.start)}&end=${Math.round(result.end)}`;
  iframeElement.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  iframeElement.allowFullscreen = true;
  iframeContainer.appendChild(iframeElement);
  return iframeContainer;
}

function createResultDetails(result) {
  const resultDetails = document.createElement("div");
  resultDetails.classList.add("text-center", "text-xs");

  const confidenceSpan = document.createElement("span");
  confidenceSpan.innerText = result.confidence;
  confidenceSpan.classList.add(
    ...addConfidenceClass(result.confidence),
    "ml-2"
  );
  confidenceSpan.style.display = "inline-block";

  const detailsText = document.createElement("p");
  detailsText.innerText = `${Math.floor(result.start / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(result.start % 60)
    .toString()
    .padStart(2, "0")}~${Math.floor(result.end / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(result.end % 60)
    .toString()
    .padStart(2, "0")}`;
  detailsText.appendChild(confidenceSpan);
  resultDetails.appendChild(detailsText);

  return resultDetails;
}

function toggleThumbnailAndIframe(thumbnailContainer, iframeContainer, result) {
  const iframeElement = iframeContainer.querySelector("iframe");

  // If there is an active iframe and it's not the same as the one being clicked
  if (activeIframe && activeIframe !== iframeElement) {
    const activeSrc = activeIframe.src;
    activeIframe.src = ""; // Stop the currently playing video

    activeIframe.parentNode.previousElementSibling.style.display = "block"; // Show the thumbnail
    activeIframe.parentNode.style.display = "none"; // Hide the iframe

    activeIframe.src = activeSrc.replace("&autoplay=1", ""); // Reset the src to stop autoplay
  }

  if (thumbnailContainer.style.display === "none") {
    // The iframe is currently visible, so switch back to the thumbnail
    thumbnailContainer.style.display = "block";
    iframeContainer.style.display = "none";
  } else {
    // The thumbnail is currently visible, so switch to the iframe
    thumbnailContainer.style.display = "none";
    iframeContainer.style.display = "block";

    // Only update the iframe src if it's not already set to autoplay
    if (!iframeElement.src.includes("autoplay=1")) {
      iframeElement.src += "&autoplay=1";
    }

    // Set this iframe as the active one
    activeIframe = iframeElement;
  }
}

function createShowMoreButton() {
  removeExistingButton();

  const showMoreButtonContainer = document.createElement("div");
  showMoreButtonContainer.id = "show-more-button";
  showMoreButtonContainer.classList.add("flex", "justify-center", "my-4");

  const showMoreButton = document.createElement("button");
  showMoreButton.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Show More';

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
  buttonContainer.classList.add("flex", "justify-center", "gap-12", "my-4");

  const backToHomeButton = createBackToHomeButton();
  buttonContainer.appendChild(backToHomeButton);

  searchResultContainer.appendChild(buttonContainer);
}

function addConfidenceClass(confidence) {
  const confidenceClasses = {
    high: [
      "bg-teal-400",
      "text-white",
      "p-1",
      "rounded",
      "text-xs",
      "capitalize",
    ],
    medium: [
      "bg-yellow-400",
      "text-white",
      "p-1",
      "rounded",
      "text-xs",
      "capitalize",
    ],
    low: [
      "bg-zinc-400",
      "text-white",
      "p-1",
      "rounded",
      "text-xs",
      "capitalize",
    ],
    default: ["bg-gray-500", "text-white", "p-1", "rounded", "text-xs"],
  };
  return confidenceClasses[confidence] || confidenceClasses.default;
}

function createBackToHomeButton() {
  const backToHomeButton = document.createElement("button");
  backToHomeButton.innerHTML =
    '<i class="fa-solid fa-rotate-left"></i> Back to Home';
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
  console.log("Requesting videos for page:", page);
  try {
    const response = await fetchFromServer(
      `${SERVER}videos?page_limit=${VIDEO_PAGE_LIMIT}&page=${page}`
    );
    console.log("Server response for page", page, ":", {
      videosCount: response.videos?.length,
      pageInfo: response.page_info,
      firstVideoId: response.videos?.[0]?.id,
    });
    return response;
  } catch (error) {
    console.error("Error fetching videos:", error);
    throw error;
  }
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
    )}&threshold=${THRESHOLD}&pageLimit=${SEARCH_PAGE_LIMIT}&adjustConfidenceLevel=${CONFIDENCE_LEVEL}`
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

async function getVideoOfVideos(page = 1) {
  try {
    console.log("Getting videos for page:", page);
    const videosResponse = await getVideos(page);
    console.log("Full videos response:", {
      hasVideos: !!videosResponse?.videos,
      videosCount: videosResponse?.videos?.length,
      pageInfo: videosResponse?.page_info,
    });

    if (!videosResponse?.videos?.length) {
      console.log("No videos found for page:", page);
      return {
        videosDetail: [],
        pageInfo: {
          page: page,
          page_limit: VIDEO_PAGE_LIMIT,
          total_count: 0,
          total_page: 0,
        },
      };
    }

    const result = {
      videosDetail: videosResponse.videos,
      pageInfo: videosResponse.page_info,
    };

    console.log("Processed video response:", {
      videosCount: result.videosDetail.length,
      pageInfo: result.pageInfo,
      currentPage: page,
      totalPages: result.pageInfo.total_page,
    });

    return result;
  } catch (error) {
    console.error("Error in getVideoOfVideos:", error);
    throw error;
  }
}

function createPageButton(pageNumber, currentPage) {
  console.log("Creating page button:", {
    pageNumber,
    currentPage,
    isActive: pageNumber === currentPage,
  });

  const pageButton = document.createElement("button");
  pageButton.textContent = pageNumber;
  pageButton.classList.add(
    "px-4", // 더 넓은 패딩
    "py-2", // 더 높은 패딩
    "rounded-lg", // 더 부드러운 모서리
    "transition",
    "duration-200",
    "mx-1",
    "min-w-[40px]", // 최소 너비 설정
    "text-lg" // 더 큰 글자 크기
  );

  if (pageNumber === parseInt(currentPage)) {
    pageButton.classList.add(
      "bg-lime-600", // 더 진한 배경색
      "text-white",
      "font-bold", // 더 굵은 글자
      "border-2",
      "border-lime-700",
      "shadow-lg", // 더 강한 그림자
      "scale-110" // 약간 더 크게
    );
    pageButton.disabled = true;
  } else {
    pageButton.classList.add(
      "bg-white",
      "hover:bg-lime-100",
      "hover:scale-105", // 호버 시 약간 확대
      "border-2", // 더 두꺼운 테두리
      "border-lime-300",
      "text-lime-700" // 라임색 텍스트
    );
    pageButton.addEventListener("click", () => showVideos(pageNumber));
  }

  return pageButton;
}

function createPaginationButtons(pageInfo, currentPage) {
  console.log("Creating pagination with:", {
    pageInfo,
    currentPage: parseInt(currentPage),
    totalPages: pageInfo?.total_page,
    totalCount: pageInfo?.total_count,
  });

  videoListPagination.innerHTML = "";

  if (!pageInfo?.total_page || pageInfo.total_page <= 1) {
    console.log("Skipping pagination - single page or no pages");
    return;
  }

  // Previous button
  if (currentPage > 1) {
    const prevButton = document.createElement("button");
    prevButton.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevButton.classList.add(
      "bg-white",
      "px-4",
      "py-2",
      "rounded-lg",
      "hover:bg-lime-100",
      "border-2",
      "border-lime-300",
      "text-lime-700",
      "transition",
      "duration-200",
      "hover:scale-105"
    );
    prevButton.addEventListener("click", () => {
      console.log("Navigating to previous page:", currentPage - 1);
      showVideos(currentPage - 1);
    });
    videoListPagination.appendChild(prevButton);
  }

  // Page buttons
  for (let i = 1; i <= pageInfo.total_page; i++) {
    const pageButton = createPageButton(i, currentPage);
    videoListPagination.appendChild(pageButton);
  }

  // Next button
  if (currentPage < pageInfo.total_page) {
    const nextButton = document.createElement("button");
    nextButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextButton.classList.add(
      "bg-white",
      "px-4",
      "py-2",
      "rounded-lg",
      "hover:bg-lime-100",
      "border-2",
      "border-lime-300",
      "text-lime-700",
      "transition",
      "duration-200",
      "hover:scale-105"
    );
    nextButton.addEventListener("click", () => {
      console.log("Navigating to next page:", currentPage + 1);
      showVideos(currentPage + 1);
    });
    videoListPagination.appendChild(nextButton);
  }

  console.log("Pagination buttons created:", {
    totalButtons: videoListPagination.children.length,
    hasNext: currentPage < pageInfo.total_page,
    hasPrev: currentPage > 1,
    currentPageNumber: currentPage,
  });
}

async function showVideos(page = 1) {
  console.log("Showing videos for page:", page);
  videoList.innerHTML = "";
  videoListLoading.classList.add("min-h-[300px]");

  const loadingSpinnerContainer = createLoadingSpinner();
  videoListLoading.append(loadingSpinnerContainer);

  try {
    const { videosDetail, pageInfo } = await getVideoOfVideos(page);
    console.log("Got videos response:", {
      videosCount: videosDetail?.length,
      pageInfo,
      currentPage: page,
    });

    videoListLoading.removeChild(loadingSpinnerContainer);

    if (videosDetail?.length > 0) {
      videosDetail.forEach((video) => {
        const videoContainer = createVideoContainer(video);
        videoList.appendChild(videoContainer);
      });

      videoListLoading.classList.remove("min-h-[300px]");

      if (pageInfo) {
        createPaginationButtons(pageInfo, page);
      }
    } else {
      videoList.innerHTML =
        '<div class="text-center text-gray-500">No videos found.</div>';
    }
  } catch (error) {
    console.error("Error showing videos:", error);
    videoListLoading.innerHTML = `
      <div class="text-center text-red-500">
        Error loading videos. Please try again later.
      </div>
    `;
  }
}

function createVideoContainer(video) {
  const template = document.getElementById("video-template");
  const videoContainer = template.content
    .cloneNode(true)
    .querySelector(".video-container");

  const titleElement = videoContainer.querySelector(".video-title");
  titleElement.textContent = video.metadata.filename;

  const videoElement = videoContainer.querySelector("video");
  const videoUrl = video.source.url;

  console.log("Setting up video with URL:", videoUrl);

  if (videoUrl) {
    if (Hls.isSupported() && videoUrl.includes(".m3u8")) {
      console.log("Using HLS.js for playback");
      const hls = new Hls({
        debug: true,
        enableWorker: true,
      });
      hls.loadSource(videoUrl);
      hls.attachMedia(videoElement);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest parsed, attempting playback");
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data);
      });
    } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
      console.log("Using native HLS playback");
      videoElement.src = videoUrl;
    } else {
      console.warn("HLS is not supported on this browser, URL:", videoUrl);
      videoElement.src = videoUrl;
    }

    videoElement.addEventListener("error", (e) => {
      console.error("Video error:", e.target.error);
    });
  }

  return videoContainer;
}

updateCarousel();
showVideos();
