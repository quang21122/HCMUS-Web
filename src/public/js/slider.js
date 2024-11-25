const slider = document.getElementById("slider");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");

const slideWidth = document.querySelector(".flex-shrink-0").offsetWidth;
let offset = 0;

nextButton.addEventListener("click", () => {
  if (offset < slider.scrollWidth - slider.offsetWidth) {
    offset += slideWidth;
    slider.scrollTo({ left: offset, behavior: "smooth" });
  }
});

prevButton.addEventListener("click", () => {
  if (offset > 0) {
    offset -= slideWidth;
    slider.scrollTo({ left: offset, behavior: "smooth" });
  }
});
