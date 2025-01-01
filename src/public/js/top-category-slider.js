document.addEventListener("DOMContentLoaded", () => {
  const containers = document.querySelectorAll(
    ".top-category-slider-container"
  );

  if (containers.length > 0) {
    containers.forEach((container) => {
      const slider = container.querySelector(".top-category-slider");
      if (!slider) {
        console.error("Slider element not found inside container:", container);
        return; // Skip this container if no slider is found
      }

      const slides = slider.querySelectorAll(".flex-shrink-0 > a");
      if (slides.length === 0) {
        console.error("No slides found in the slider:", slider);
        return;
      }

      const prevButton = container.querySelector(".top-category-prev");
      const nextButton = container.querySelector(".top-category-next");

      if (!prevButton || !nextButton) {
        console.error("Previous or next buttons are missing.");
        return;
      }

      let currentIndex = 0;
      const slideWidth = slides[0].offsetWidth; // Use offsetWidth to include padding and border

      // Initial button states
      prevButton.classList.add("bg-gray-300");
      nextButton.classList.add("bg-gray-400");

      const updateButtonStates = () => {
        // Update prev button
        if (currentIndex === 0) {
          prevButton.classList.replace("bg-gray-400", "bg-gray-300");
          prevButton.style.cursor = "default";
          prevButton.style.pointerEvents = "none";
        } else {
          prevButton.classList.replace("bg-gray-300", "bg-gray-400");
          prevButton.style.cursor = "pointer";
          prevButton.style.pointerEvents = "auto";
        }

        // Update next button
        if (currentIndex === slides.length - 5) {
          nextButton.classList.replace("bg-gray-400", "bg-gray-300");
          nextButton.style.cursor = "default";
          nextButton.style.pointerEvents = "none";
        } else {
          nextButton.classList.replace("bg-gray-300", "bg-gray-400");
          nextButton.style.cursor = "pointer";
          nextButton.style.pointerEvents = "auto";
        }
      };

      nextButton.addEventListener("click", () => {
        if (currentIndex < slides.length - 5) {
          currentIndex++;
          slider.scrollTo({
            left: currentIndex * (slideWidth + 8),
            behavior: "smooth",
          });
          updateButtonStates();
        }
      });

      prevButton.addEventListener("click", () => {
        if (currentIndex > 0) {
          currentIndex--;
          slider.scrollTo({
            left: currentIndex * (slideWidth + 8),
            behavior: "smooth",
          });
          updateButtonStates();
        }
      });
    });
  } else {
    console.error("No slider containers found.");
  }
});
