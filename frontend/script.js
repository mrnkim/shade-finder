const images = [
  { src: "./images/berry.jpg", label: "Berry Shades" },
  { src: "./images/orange.png", label: "Orange Shades" },
  { src: "./images/blue.png", label: "Blue Shades" },
  { src: "./images/green.png", label: "Green Shades" },
  { src: "./images/pink.png", label: "Pink Shades" },
  { src: "./images/brown.png", label: "Brown Shades" },
];

let currImgIndex = 0;
let nextPageToken;
const videoCache = new Map();

const carouselImg = document.getElementById("carousel-image");
const colorLabel = document.getElementById("color-label");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const videoList = document.getElementById("video-list");
const videoListPagination = document.getElementById("video-list-pagination");
const searchResultPagination = document.getElementById(
  "search-result-pagination"
);
const searchButton = document.getElementById("search");
const videoListContainer = document.getElementById("video-list-container");
const searchResultContainer = document.getElementById(
  "search-result-container"
);
const searchResultList = document.getElementById("search-result-list");

function updateCarousel() {
  carouselImg.src = images[currImgIndex].src;
  colorLabel.textContent = images[currImgIndex].label;
}

prevButton.addEventListener("click", () => {
  currImgIndex = currImgIndex === 0 ? images.length - 1 : currImgIndex - 1;
  updateCarousel();
});

nextButton.addEventListener("click", () => {
  currImgIndex = currImgIndex === images.length - 1 ? 0 : currImgIndex + 1;
  updateCarousel();
});

const SERVER = "http://localhost:5001/";
const PAGE_LIMIT = 12;

async function getVideos(page = 1) {
  try {
    const response = await fetch(
      `${SERVER}videos?page_limit=${PAGE_LIMIT}&page=${page}`
    );
    if (!response.ok) {
      throw new Error("Network response was not ok" + response.statusText);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching videos:", error);
    return error;
  }
}

async function getVideo(videoId) {
  if (videoCache.has(videoId)) {
    return videoCache.get(videoId);
  }

  try {
    const response = await fetch(`${SERVER}videos/${videoId}`);
    if (!response.ok) {
      throw new Error("Network response was not ok" + response.statusText);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching videos:", error);
    return error;
  }
}

async function getVideoOfVideos(page = 1) {
  const videosResponse = await getVideos(page);

  if (videosResponse.videos.length > 0) {
    const videosDetail = await Promise.all(
      videosResponse.videos.map((video) => {
        return getVideo(video.id);
      })
    );

    return { videosDetail, pageInfo: videosResponse.page_info };
  }
}

async function searchByImage() {
  const imageSrc = carouselImg.src.split("/").pop();

  try {
    const response = await fetch(
      `${SERVER}search?imageSrc=${encodeURIComponent(imageSrc)}`
    );
    if (!response.ok) {
      throw new Error("Network response was not ok" + response.statusText);
    }
    const data = await response.json();
    console.log("🚀 > searchByImage > data=", data);
    nextPageToken = data.pageInfo.nextPageToken;
    return data;
  } catch (error) {
    console.error("Error searching videos:", error);
    return error;
  }
}

function showLoadingSpinner() {
  const loadingSpinnerContainer = document.createElement("div");
  loadingSpinnerContainer.classList.add(
    "flex",
    "justify-center",
    "items-center"
  );
  const loadingSpinner = document.createElement("img");
  loadingSpinner.src = "./LoadingSpinner.svg";
  loadingSpinner.alt = "loading spinner";
  loadingSpinner.classList.add("animate-spin", "h-8", "w-8"); // Adjust size as needed
  loadingSpinnerContainer.appendChild(loadingSpinner);
  return loadingSpinnerContainer;
}

searchButton.addEventListener("click", async () => {
  searchButton.disabled = true;
  prevButton.disabled = true;
  nextButton.disabled = true;

  nextPageToken = null;
  searchResultPagination.innerHTML = "";

  videoListContainer.classList.add("hidden");
  searchResultContainer.classList.remove("hidden");

  searchResultList.innerHTML = "";

  const loadingSpinnerContainer = showLoadingSpinner();

  searchResultContainer.appendChild(loadingSpinnerContainer);

  try {
    const { searchResults } = await searchByImage();

    searchResultContainer.removeChild(loadingSpinnerContainer);

    if (searchResults) {
      showSearchResults(searchResults);
    } else {
      const noResultsMessage = document.createElement("p");
      noResultsMessage.textContent = "No search results found.";
      searchResultContainer.appendChild(noResultsMessage);
    }
  } catch (error) {
    console.error("Error fetching search results:", error);
    // Handle error (e.g., show an error message to the user)
  } finally {
    // Re-enable the search button
    searchButton.disabled = false;
    prevButton.disabled = false;
    nextButton.disabled = false;
  }
});

async function showSearchResults(searchResults) {
  searchResultPagination.innerHTML = "";

  // Fetch video details for each search result and store them
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

  searchResults.forEach((result) => {
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

    const videoTitle = document.createElement("div");
    videoTitle.classList.add(
      "w-full",
      "overflow-hidden",
      "whitespace-nowrap",
      "text-ellipsis"
    );
    videoTitle.innerHTML = `<p class="text-center mb-2 text-xs truncate">${result.videoDetail.metadata.filename}</p>`;

    // Create a container for the thumbnail
    const thumbnailContainer = document.createElement("div");

    // Create an image element for the thumbnail
    const thumbnailImage = document.createElement("img");
    thumbnailImage.src = result.thumbnailUrl;
    thumbnailImage.alt = "Video Thumbnail";
    thumbnailImage.style.maxWidth = "100%";
    thumbnailImage.style.maxHeight = "100%";
    thumbnailImage.style.cursor = "pointer"; // Optional: Add cursor pointer for interaction

    // Append the thumbnail image to its container
    thumbnailContainer.appendChild(thumbnailImage);

    // Create a container for the iframe element (video player)
    const iframeContainer = document.createElement("div");
    iframeContainer.style.display = "none"; // Initially hide the iframe

    const iframeElement = document.createElement("iframe");
    iframeElement.width = 220;
    iframeElement.height = 140;

    const startSeconds = Math.round(result.start);
    const endSeconds = Math.round(result.end);

    iframeElement.src = `${result.videoDetail.source.url.replace(
      "watch?v=",
      "embed/"
    )}?start=${startSeconds}&end=${endSeconds}`;
    iframeElement.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframeElement.allowFullscreen = true;
    iframeContainer.appendChild(iframeElement);

    const resultDetails = document.createElement("div");
    resultDetails.classList.add("text-center", "text-xs"); // Center align the text

    const confidenceSpan = document.createElement("span");
    confidenceSpan.innerText = result.confidence;

    switch (result.confidence) {
      case "high":
        confidenceSpan.classList.add(
          "bg-teal-400",
          "text-white",
          "p-1",
          "rounded",
          "text-xs",
          "capitalize"
        );
        break;
      case "medium":
        confidenceSpan.classList.add(
          "bg-yellow-400",
          "text-white",
          "p-1",
          "rounded",
          "text-xs",
          "capitalize"
        );
        break;
      case "low":
        confidenceSpan.classList.add(
          "bg-zinc-400",
          "text-white",
          "p-1",
          "rounded",
          "text-xs",
          "capitalize"
        );
        break;
      default:
        confidenceSpan.classList.add(
          "bg-gray-500",
          "text-white",
          "p-1",
          "rounded",
          "text-xs"
        );
        break;
    }

    const detailsText = document.createElement("p");
    detailsText.innerText = `start: ${startSeconds}, end: ${endSeconds} | `;
    detailsText.appendChild(confidenceSpan);
    resultDetails.appendChild(detailsText);

    videoContainer.appendChild(videoTitle);
    videoContainer.appendChild(thumbnailContainer);
    videoContainer.appendChild(iframeContainer);
    videoContainer.appendChild(resultDetails);

    // Add event listener to toggle visibility of thumbnail and iframe on click
    thumbnailImage.addEventListener("click", () => {
      thumbnailContainer.style.display = "none";
      iframeContainer.style.display = "block";
      iframeElement.src += "&autoplay=1";
    });

    searchResultList.appendChild(videoContainer);
  });

  /** Add pagination buttons */

  if (nextPageToken) {
    const pageButton = document.createElement("button");
    pageButton.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Show More';
    // pageButton.classList.add("bg-lime-100", "px-3", "py-1", "rounded");
    pageButton.addEventListener("click", async () => {
      const loadingSpinnerContainer = showLoadingSpinner();
      searchResultContainer.appendChild(loadingSpinnerContainer);

      const nextPageResults = await getNextSearchResults(nextPageToken);

      searchResultContainer.removeChild(loadingSpinnerContainer);

      showSearchResults(nextPageResults.searchResults);
      nextPageToken = nextPageResults.pageInfo.nextPageToken || null;
      if (!nextPageToken) {
        searchResultPagination.innerHTML = "";
        const backToTopButton = document.createElement("button");
        backToTopButton.textContent = "Back to Top";
        backToTopButton.classList.add("bg-lime-100", "px-3", "py-1", "rounded");
        backToTopButton.addEventListener("click", async () => {
          searchButton.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        searchResultPagination.appendChild(backToTopButton);
      }
    });

    searchResultPagination.appendChild(pageButton);
  }
}

async function getNextSearchResults(nextPageToken) {
  try {
    const response = await fetch(`${SERVER}search/${nextPageToken}`);
    if (!response.ok) {
      throw new Error("Network response was not ok" + response.statusText);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching videos:", error);
    return error;
  }
}

async function showVideos(page = 1) {
  const { videosDetail, pageInfo } = await getVideoOfVideos(page);

  if (videosDetail) {
    videoList.innerHTML = ""; // Clear the current videos

    videosDetail.forEach((video) => {
      const videoContainer = document.createElement("div");
      videoContainer.classList.add(
        "flex-col",
        "justify-center",
        "items-center",
        "p-3"
      );

      const iframeElement = document.createElement("iframe");
      iframeElement.width = 220;
      iframeElement.height = 140;
      iframeElement.src = video.source.url.replace("watch?v=", "embed/");
      iframeElement.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframeElement.allowFullscreen = true;

      videoContainer.appendChild(iframeElement);

      const videoTitle = document.createElement("div");
      videoTitle.innerHTML = `<p class="mb-2 text-xs">${video.metadata.filename}</p>`;
      videoContainer.appendChild(videoTitle);

      videoList.appendChild(videoContainer);
    });

    /** Add pagination buttons */
    videoListPagination.innerHTML = "";
    for (let i = 1; i <= pageInfo.totalPage; i++) {
      const pageButton = document.createElement("button");
      pageButton.textContent = i;
      pageButton.classList.add(
        "bg-lime-100",
        "px-3",
        "py-1",
        "rounded-full",
        "hover:border",
        "hover:border-slate-200",
        "transition",
        "duration-200"
      );
      if (i === page) {
        pageButton.classList.add("bg-slate-200", "font-medium");
        pageButton.disabled = true;
      } else {
        pageButton.classList.add("bg-transparent");
      }
      pageButton.addEventListener("click", () => showVideos(i));
      videoListPagination.appendChild(pageButton);
    }
  }
}

/** Initial update */
updateCarousel();
showVideos();
