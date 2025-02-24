import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BarChart, FileText, WandSparkles } from "lucide-react";

const AIButton: React.FC<{ imgElement: HTMLImageElement }> = ({ imgElement }) => {
  
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    
  };

  useEffect(() => {

  }, []);

  return (
    <>
      <button
        className="bg-black !important cursor-pointer text-[12px] text-white flex items-center gap-2 px-3 py-1 rounded-md shadow-md"
        onClick={handleClick}
        style={{background:"black"}}
      >
        <WandSparkles className="h-3 w-3" />
        Extract (Data + Chart) 
      </button>

    
    </>
  );
};

// Function to add buttons over all valid images
const addImageButtons = () => {
  document.querySelectorAll("img").forEach((img) => {
    if (img.dataset.hasButton) return;

    // **Filtering Conditions**
    const isSmall = img.width < 50 || img.height < 50;
    const isLogoOrIcon =
      img.classList.contains("logo") ||
      img.classList.contains("icon") ||
      img.id.includes("logo") ||
      img.id.includes("icon");

    const srcLower = img.src.toLowerCase();
    const isKnownIcon =
      srcLower.includes("logo") ||
      srcLower.includes("favicon") ||
      srcLower.includes("icon") ||
      srcLower.endsWith(".ico") ||
      srcLower.endsWith(".svg");

    if (isSmall || isLogoOrIcon || isKnownIcon) return;

    // Create a wrapper div
    const wrapper = document.createElement("div");
    wrapper.className = "relative inline-block group"; 
    wrapper.style.width = `${img.width}px`;
    wrapper.style.height = `${img.height}px`;

    // Create a container for the button
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity";
    const root = createRoot(buttonContainer);
    root.render(<AIButton imgElement={img as HTMLImageElement} />);

    // Wrap image with container
    img.parentNode?.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.appendChild(buttonContainer);

    img.dataset.hasButton = "true";
  });
};

// Run function when DOM is ready
window.addEventListener("load", addImageButtons);
window.addEventListener("scroll", addImageButtons);
