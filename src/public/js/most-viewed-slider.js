document.addEventListener("DOMContentLoaded", () => {
  const containers = document.querySelectorAll(".slider-container");

  if (containers.length > 0) {
    containers.forEach((container) => {
      const slider = container.querySelector(".most-viewed-slider");
      if (!slider) {
        console.error("Slider element not found inside container:", container);
        return; // Skip this container if no slider is found
      }

      const slides = slider.querySelectorAll(".flex-shrink-0 > div");
      if (slides.length === 0) {
        console.error("No slides found in the slider:", slider);
        return;
      }

      const prevButton = container.querySelector(".prev");
      const nextButton = container.querySelector(".next");

      if (!prevButton || !nextButton) {
        console.error("Previous or next buttons are missing.");
        return;
      }

      let currentIndex = 0;
      const slideWidth = slides[0].offsetWidth; // Use offsetWidth to include padding and border
      console.log("slideWidth: ", slideWidth);

      nextButton.addEventListener("click", () => {
        if (currentIndex < slides.length - 1) {
          currentIndex++;
          slider.scrollTo({
            left: currentIndex * (slideWidth + 16),
            behavior: "smooth",
          });
        }
        console.log("left: ", currentIndex * slideWidth + 16 * currentIndex);
      });

      prevButton.addEventListener("click", () => {
        if (currentIndex > 0) {
          currentIndex--;
          slider.scrollTo({
            left: currentIndex * (slideWidth + 16),
            behavior: "smooth",
          });
        }
      });
    });
  } else {
    console.error("No slider containers found.");
  }
});
