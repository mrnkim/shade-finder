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
const VideoList = document.getElementById("video-list");

function updateCarousel() {
  carouselImg.src = images[currImgIndex].src;
  colorLabel.textContent = images[currImgIndex].label;
}

prevButton.addEventListener("click", () => {
  console.log("prev button clicked");
  currImgIndex = currImgIndex === 0 ? images.length - 1 : currImgIndex - 1;
  updateCarousel();
});

nextButton.addEventListener("click", () => {
  currImgIndex = currImgIndex === images.length - 1 ? 0 : currImgIndex + 1;
  updateCarousel();
});

const SERVER = "http://localhost:5001/";
const PAGE_LIMIT = 1;

async function getVideos() {
  console.log("GET VIDEOS!");
  try {
    const response = await fetch(`${SERVER}videos?page_limit=${PAGE_LIMIT}`);
    if (!response.ok) {
      throw new Error("Network response was not ok" + response.statusText);
    }
    const data = await response.json();
    console.log("🚀 > getVideos > data=", data);
    return data;
  } catch (error) {
    console.error("Error fetching videos:", error);
    return error;
  }
}

async function getVideo(videoId) {
  console.log("GET VIDEO!");
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

async function getVideosDetails() {
  const videos = await getVideos();
  console.log("🚀 > getVideosDetails > videos=", videos);

  if (videos) {
    const videosDetail = await Promise.all(
      videos.data.map((video) => {
        return getVideo(video._id);
      })
    );
    console.log("🚀 > getVideosDetails > videosDetail=", videosDetail)
  }
}

/** Initial update */
updateCarousel();
getVideosDetails();
