const images = [
  { src: "./berry.jpg", label: "Berry Colors" },
  { src: "./orange.png", label: "Orange Colors" },
  { src: "./blue.png", label: "Blue Colors" },
  { src: "./green.png", label: "Green Colors" },
];

let currImgIndex = 0;

//elements
const carouselImg = document.getElementById("carousel-image");
const colorLabel = document.getElementById("color-label");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");

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

// Initial update
updateCarousel();
