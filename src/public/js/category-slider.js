document.querySelectorAll(".category-slider-container").forEach((container) => {
  const slider = container.querySelector(".category-slider");
  const prevButton = container.querySelector(".category-prev");
  const nextButton = container.querySelector(".category-next");

  // Get all slides within the slider
  const slides = Array.from(slider.children);

  let currentIndex = 0;
  let slideWidth = slides[0].offsetWidth; // Initial slide width

  // Function to update the slider position
  const updateSliderPosition = () => {
    slider.scrollTo({ left: currentIndex * slideWidth, behavior: "smooth" });
  };

  // Function to update slide width on window resize
  const updateSlideWidth = () => {
    slideWidth = slides[0].offsetWidth; // Recalculate slide width
    updateSliderPosition(); // Adjust position to prevent layout shifts
  };

  // Add event listeners for navigation buttons
  nextButton.addEventListener("click", () => {
    if (currentIndex < slides.length - 1) {
      currentIndex++;
      const adjustedWidth = slides[currentIndex].offsetWidth; // Use offsetWidth here
      slider.scrollTo({
        left: currentIndex * adjustedWidth + 16 * currentIndex,
        behavior: "smooth",
      });
    }
  });

  prevButton.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      const adjustedWidth = slides[currentIndex].offsetWidth; // Use offsetWidth here
      slider.scrollTo({
        left: currentIndex * adjustedWidth,
        behavior: "smooth",
      });
    }
  });

  // Listen to window resize events
  window.addEventListener("resize", updateSlideWidth);
});
