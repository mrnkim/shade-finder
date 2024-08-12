"use strict";

let currImgIndex = 0;
let nextPageToken;
const videoCache = new Map();

const SERVER = window.location.hostname?.includes("replit")
  ? `https://${window.location.hostname}/`
  : "http://localhost:5001/";
const PAGE_LIMIT = 12;

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

  const loadingSpinnerContainer = showLoadingSpinner();
  searchResultContainer.appendChild(loadingSpinnerContainer);

  try {
    const { searchResults } = await searchByImage();
    console.log("🚀 > handleSearchButtonClick > searchResults=", searchResults);

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

function showLoadingSpinner() {
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

  const backToStartButton = createBackToStartButton();
  backToStartButton.classList.add(
    "flex",
    "justify-center",
    "items-center",
    "my-4",
    "mx-auto",
    "p-4"
  );

  noResultsContainer.appendChild(noResultsMessage);
  noResultsContainer.appendChild(backToStartButton);

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
    console.log("🚀 > showSearchResults > nextPageToken=", nextPageToken);
    addPaginationButton();
  } else {
    removeExistingButton();
    appendFinalButtons();
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
  confidenceSpan.classList.add(...addConfidenceClass(result.confidence));

  const detailsText = document.createElement("p");
  detailsText.innerText = `start: ${Math.round(
    result.start
  )}, end: ${Math.round(result.end)} | `;
  detailsText.appendChild(confidenceSpan);
  resultDetails.appendChild(detailsText);

  return resultDetails;
}

function toggleThumbnailAndIframe(thumbnailContainer, iframeContainer, result) {
  thumbnailContainer.style.display = "none";
  iframeContainer.style.display = "block";
  iframeContainer.querySelector("iframe").src += "&autoplay=1";
}

function addPaginationButton() {
  removeExistingButton();

  const pageButtonContainer = document.createElement("div");
  pageButtonContainer.id = "show-more-button";
  pageButtonContainer.classList.add("flex", "justify-center", "my-4");

  const pageButton = document.createElement("button");
  pageButton.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Show More';
  pageButton.classList.add("show-more-btn");

  pageButton.addEventListener("click", async () => {
    const loadingSpinnerContainer = showLoadingSpinner();
    searchResultContainer.appendChild(loadingSpinnerContainer);

    const nextPageResults = await getNextSearchResults(nextPageToken);

    searchResultContainer.removeChild(loadingSpinnerContainer);

    showSearchResults(nextPageResults.searchResults);
    nextPageToken = nextPageResults.pageInfo.nextPageToken || null;
  });
  pageButtonContainer.appendChild(pageButton);
  searchResultContainer.appendChild(pageButtonContainer);
}

function removeExistingButton() {
  const existingButton = document.getElementById("show-more-button");
  if (existingButton) {
    existingButton.remove();
  }
}

function appendFinalButtons() {
  const buttonsContainer = document.createElement("div");
  buttonsContainer.classList.add("flex", "justify-center", "gap-12", "my-4");

  const backToTopButton = createBackToTopButton();
  const backToStartButton = createBackToStartButton();

  buttonsContainer.appendChild(backToTopButton);
  buttonsContainer.appendChild(backToStartButton);

  searchResultContainer.appendChild(buttonsContainer);
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

function createBackToTopButton() {
  const backToTopButton = document.createElement("button");
  backToTopButton.innerHTML =
    '<i class="fa-solid fa-angles-up"></i> Back to Top';
  backToTopButton.addEventListener("click", () => {
    searchButton.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  return backToTopButton;
}

function createBackToStartButton() {
  const backToStartButton = document.createElement("button");
  backToStartButton.innerHTML =
    '<i class="fa-solid fa-rotate-left"></i> Back to Start';
  backToStartButton.addEventListener("click", () => {
    searchResultContainer.classList.add("hidden");
    videoListContainer.classList.remove("hidden");
    showVideos();
  });
  return backToStartButton;
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
    `${SERVER}videos?page_limit=${PAGE_LIMIT}&page=${page}`
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
    `${SERVER}search?imageSrc=${encodeURIComponent(imageSrc)}`
  );
  if (data) {
    console.log("🚀 > searchByImage > data=", data);
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
  const { videosDetail, pageInfo } = await getVideoOfVideos(page);

  if (videosDetail) {
    videoList.innerHTML = "";

    videosDetail.forEach((video) => {
      const videoContainer = createVideoContainer(video);
      videoList.appendChild(videoContainer);
    });

    updatePaginationButtons(pageInfo, page);
  }
}

function createVideoContainer(video) {
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

  const iframeElement = document.createElement("iframe");
  iframeElement.width = 220;
  iframeElement.height = 140;
  iframeElement.src = video.source.url.replace("watch?v=", "embed/");
  iframeElement.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  iframeElement.allowFullscreen = true;

  const videoTitle = document.createElement("div");
  videoTitle.innerHTML = `<p class="mb-2 text-xs">${video.metadata.filename}</p>`;

  videoContainer.append(iframeElement, videoTitle);

  return videoContainer;
}

function updatePaginationButtons(pageInfo, currentPage) {
  videoListPagination.innerHTML = "";
  for (let i = 1; i <= pageInfo.totalPage; i++) {
    const pageButtonContainer = createPageButton(i, currentPage);
    videoListPagination.appendChild(pageButtonContainer);
  }
}

function createPageButton(pageNumber, currentPage) {
  const pageButtonContainer = document.createElement("button");
  pageButtonContainer.textContent = pageNumber;
  pageButtonContainer.classList.add(
    "bg-lime-100",
    "px-3",
    "py-1",
    "rounded-full",
    "hover:border",
    "hover:border-slate-200",
    "transition",
    "duration-200"
  );

  if (pageNumber === currentPage) {
    pageButtonContainer.classList.add("bg-slate-200", "font-medium");
    pageButtonContainer.disabled = true;
  } else {
    pageButtonContainer.classList.add("bg-transparent");
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
