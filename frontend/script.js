const images = [
  { src: "./images/berry.jpg", label: "Berry Shades" },
  { src: "./images/orange.png", label: "Orange Shades" },
  { src: "./images/blue.png", label: "Blue Shades" },
  { src: "./images/green.png", label: "Green Shades" },
];

let currImgIndex = 0;

const carouselImg = document.getElementById("carousel-image");
const colorLabel = document.getElementById("color-label");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const videoList = document.getElementById("video-list");
const pagination = document.getElementsByClassName("pagination");
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
    console.log("🚀 > searchByImage > data=", data);
    return data;
  } catch (error) {
    console.error("Error searching videos:", error);
    return error;
  }
}

searchButton.addEventListener("click", async () => {
  videoListContainer.classList.add("hidden");
  searchResultContainer.classList.remove("hidden");
  searchResultContainer.classList.add("visible");

  showSearchResults();
});

async function showSearchResults(page = 1) {
  const { searchResults, pageInfo } = await searchByImage(page);
  console.log("🚀 > showSearchResults > pageInfo=", pageInfo);
  console.log("🚀 > showSearchResults > searchResults=", searchResults);

  if (searchResults) {
    searchResultList.innerHTML = ""; // Clear the current videos

    searchResults.forEach((result) => {
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
      iframeElement.srcdoc = `
      <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100%; }
        img { max-width: 100%; max-height: 100%; }
      </style>
      <img src="${result.thumbnailUrl}" alt="Video Thumbnail" />
    `; // iframeElement.src = result.source.url.replace("watch?v=", "embed/");
      iframeElement.frameBorder = 0;
      iframeElement.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframeElement.allowFullscreen = true;

      videoContainer.appendChild(iframeElement);

      const videoTitle = document.createElement("div");
      // videoTitle.innerHTML = `<p class="text-center mb-2 text-xs">${result.metadata.filename}</p>`;
      videoContainer.appendChild(videoTitle);

      searchResultList.appendChild(videoContainer);
    });

    /** Add pagination buttons */
    // pagination.innerHTML = "";
    // if (pageInfo.nextPageToken) {
    //   const pageButton = document.createElement("button");
    //   pageButton.textContent = "Show More";
    //   pageButton.classList.add("bg-lime-100", "px-3", "py-1", "rounded");
    //   // pageButton.addEventListener("click", () => showVideos(i));
    //   pagination.appendChild(pageButton);
    // }
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
    pagination.innerHTML = "";
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
      pagination.appendChild(pageButton);
    }
  }
}

/** Initial update */
updateCarousel();
showVideos();
