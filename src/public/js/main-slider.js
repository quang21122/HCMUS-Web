document.querySelectorAll(".main-slider-container").forEach((container) => {
  const slider = container.querySelector(".main-slider");
  const prevButton = container.querySelector(".main-prev");
  const nextButton = container.querySelector(".main-next");

  // Get all slides within the slider
  const slides = Array.from(slider.children);

  let currentIndex = 0;
  let slideWidth = slides[0].offsetWidth; // Initial slide width

  // Initial button states
  prevButton.classList.add("text-gray-300");
  nextButton.classList.add("text-gray-400");

  const updateButtonStates = () => {
    // Update prev button
    if (currentIndex === 0) {
      prevButton.classList.replace("text-gray-400", "text-gray-300");
      prevButton.style.cursor = "default";
      prevButton.style.pointerEvents = "none";
    } else {
      prevButton.classList.replace("text-gray-300", "text-gray-400");
      prevButton.style.cursor = "pointer";
      prevButton.style.pointerEvents = "auto";
    }

    // Update next button
    if (currentIndex === slides.length - 1) {
      nextButton.classList.replace("text-gray-400", "text-gray-300");
      nextButton.style.cursor = "default";
      nextButton.style.pointerEvents = "none";
    } else {
      nextButton.classList.replace("text-gray-300", "text-gray-400");
      nextButton.style.cursor = "pointer";
      nextButton.style.pointerEvents = "auto";
    }
  };

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
        left: currentIndex * adjustedWidth,
        behavior: "smooth",
      });
      updateButtonStates();
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
      updateButtonStates();
    }
  });

  // Listen to window resize events
  window.addEventListener("resize", updateSlideWidth);
});
