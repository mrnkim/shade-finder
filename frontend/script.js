const images = [
  { src: "./images/berry.jpg", label: "Berry Shades" },
  { src: "./images/orange.png", label: "Orange Shades" },
  { src: "./images/blue.png", label: "Blue Shades" },
  { src: "./images/green.png", label: "Green Shades" },
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
  console.log(`Searching for image: ${imageSrc}`); // Log the image source

  try {
    const response = await fetch(
      `${SERVER}search?imageSrc=${encodeURIComponent(imageSrc)}`
    );
    if (!response.ok) {
      throw new Error("Network response was not ok" + response.statusText);
    }
    const data = await response.json();
    nextPageToken = data.pageInfo.nextPageToken;
    return data;
  } catch (error) {
    console.error("Error searching videos:", error);
    return error;
  }
}

searchButton.addEventListener("click", async () => {
  videoListContainer.classList.add("hidden");
  searchResultContainer.classList.remove("hidden");
  // searchResultContainer.classList.add("visible");
  const { searchResults } = await searchByImage();
  if (searchResults) {
    showSearchResults(searchResults);
  }
});

async function showSearchResults(searchResults) {
  console.log("🚀 > showSearchResults > searchResults=", searchResults);
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

  console.log("🚀 > searchResults.forEach > searchResults=", searchResults);

  searchResults.forEach((result) => {
    const videoContainer = document.createElement("div");
    videoContainer.classList.add(
      "flex-col",
      "justify-center",
      "items-center",
      "p-3",
      "border"
    );

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

    // Append the thumbnail container to the main video container
    videoContainer.appendChild(thumbnailContainer);

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
    iframeElement.frameBorder = 0;
    iframeElement.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframeElement.allowFullscreen = true;
    iframeContainer.appendChild(iframeElement);
    videoContainer.appendChild(iframeContainer);

    // Add event listener to toggle visibility of thumbnail and iframe on click
    thumbnailImage.addEventListener("click", () => {
      thumbnailContainer.style.display = "none";
      iframeContainer.style.display = "block";
      iframeElement.src += "&autoplay=1";
    });

    searchResultList.appendChild(videoContainer);

    const videoTitle = document.createElement("div");
    videoTitle.innerHTML = `<p class="text-center mb-2 text-xs">${result.videoDetail.metadata.filename}</p>`;
    videoContainer.appendChild(videoTitle);
  });

  /** Add pagination buttons */

  if (nextPageToken) {
    const pageButton = document.createElement("button");
    pageButton.textContent = "Show More";
    pageButton.classList.add("bg-lime-100", "px-3", "py-1", "rounded");
    pageButton.addEventListener("click", async () => {
      const nextPageResults = await getNextSearchResults(nextPageToken);

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
        "p-3",
        "border"
      );

      const iframeElement = document.createElement("iframe");
      iframeElement.width = 220;
      iframeElement.height = 140;
      iframeElement.src = video.source.url.replace("watch?v=", "embed/");
      iframeElement.frameBorder = 0;
      iframeElement.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframeElement.allowFullscreen = true;

      videoContainer.appendChild(iframeElement);

      const videoTitle = document.createElement("div");
      videoTitle.innerHTML = `<p class="text-center mb-2 text-xs">${video.metadata.filename}</p>`;
      videoContainer.appendChild(videoTitle);

      videoList.appendChild(videoContainer);
    });

    /** Add pagination buttons */
    videoListPagination.innerHTML = "";
    for (let i = 1; i <= pageInfo.totalPage; i++) {
      const pageButton = document.createElement("button");
      pageButton.textContent = i;
      pageButton.classList.add("bg-lime-100", "px-3", "py-1", "rounded");
      if (i === page) {
        pageButton.classList.remove("bg-lime-100");
        pageButton.classList.add("bg-lime-400");
        pageButton.disabled = true;
      }
      pageButton.addEventListener("click", () => showVideos(i));
      videoListPagination.appendChild(pageButton);
    }
  }
}

/** Initial update */
updateCarousel();
showVideos();
