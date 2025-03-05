import useLocalStorage, {
  getStorageValue,
  setStorageValue,
} from "./hooks/useLocalStorage";

// Global error handler
window.addEventListener("error", (event) => {
  console.error("Content script error:", event.error);

  // Send error to background script for logging
  chrome.runtime.sendMessage({
    action: "log_error",
    error: {
      message: event.error.message,
      stack: event.error.stack,
      source: "content_script",
    },
  });
});

// Function to create and inject the image overlay button
function createImageOverlay(image) {
  try {
    // Skip small images
    if (image.width < 130 || image.height < 130) return;

    // Create overlay container
    const overlay = document.createElement("div");
    overlay.className = "pixel-insight-overlay";

    // Create the main button
    const button = document.createElement("button");
    button.className = "pixel-insight-button";
    button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="19" cy="12" r="1"></circle>
          <circle cx="5" cy="12" r="1"></circle>
        </svg>
      `;

    // Create the menu
    const menu = document.createElement("div");
    menu.className = "pixel-insight-menu";
    menu.innerHTML = `
        <div class="pixel-insight-menu-header">
          <div class="pixel-insight-user-info">
            <div class="pixel-insight-avatar" id="menu-avatar"></div>
            <div class="pixel-insight-user-details">
              <div class="pixel-insight-username" id="menu-username">User</div>
              <div class="pixel-insight-email" id="menu-email">user@example.com</div>
            </div>
          </div>
          <div class="pixel-insight-credits" id="menu-credits">100 Credits</div>
        </div>
        <div class="pixel-insight-menu-divider"></div>
        <button class="pixel-insight-menu-item" data-action="extract">
       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wand-sparkles"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
          Extract (Data + Chart)
        </button>
        <button class="pixel-insight-menu-item" data-action="analyze disabled">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          Analyze Image
        </button>
      `;

    // Add event listeners
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("show");

      // Update user info in menu
      updateMenuUserInfo();
    });

    // Close menu when clicking outside
    document.addEventListener("click", () => {
      menu.classList.remove("show");
    });

    // Handle menu item clicks
    menu.querySelectorAll(".pixel-insight-menu-item").forEach((item) => {
      item.addEventListener("click", async (e) => {
        e.stopPropagation();

        const token = await getStorageValue("user_token", "");
        const status = await getStorageValue("isLogin", false);
        // Check if user is logged in

        if (!status || !token) {
          showNotification(
            "Authentication Required",
            "Please log in to use this feature",
            "warning",
          );
          return;
        }

        const menu = item.closest(".pixel-insight-menu");

        // Call processImage with menu as the second argument
        processImage(image, menu, token);

        showNotification(
          "Processing Started",
          `AI magic has started. You will be notified when it's complete.`,
          "success",
        );
      });
    });

    // Append elements
    overlay.appendChild(button);
    overlay.appendChild(menu);

    // Position the overlay
    const rect = image.getBoundingClientRect();
    overlay.style.position = "absolute";
    overlay.style.top = `${window.scrollY + rect.top + 10}px`;
    overlay.style.left = `${window.scrollX + rect.right - 40}px`;
    overlay.style.zIndex = "9999";

    // Append to body
    document.body.appendChild(overlay);

    // Update position on scroll and resize
    const updatePosition = () => {
      const newRect = image.getBoundingClientRect();
      overlay.style.top = `${window.scrollY + newRect.top + 10}px`;
      overlay.style.left = `${window.scrollX + newRect.right - 40}px`;
    };

    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    // Remove overlay when image is removed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.removedNodes.length) {
          for (let i = 0; i < mutation.removedNodes.length; i++) {
            const node = mutation.removedNodes[i];
            if (node === image || node.contains(image)) {
              overlay.remove();
              observer.disconnect();
              window.removeEventListener("scroll", updatePosition);
              window.removeEventListener("resize", updatePosition);
            }
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  } catch (error) {
    console.error("Error creating image overlay:", error);
    chrome.runtime.sendMessage({
      action: "log_error",
      error: {
        message: error.message,
        stack: error.stack,
        source: "create_image_overlay",
      },
    });
  }
}

// Update user info in menu
function updateMenuUserInfo() {
  try {
    chrome.storage.local.get(["user"], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting user data:", chrome.runtime.lastError);
        return;
      }

      if (result.user) {
        const avatarElements = document.querySelectorAll(
          ".pixel-insight-avatar",
        );
        const usernameElements = document.querySelectorAll(
          ".pixel-insight-username",
        );
        const emailElements = document.querySelectorAll(".pixel-insight-email");
        const creditsElements = document.querySelectorAll(
          ".pixel-insight-credits",
        );

        // Get initials for avatar
        const initials = result.user.name
          ? result.user.name
              .split(" ")
              .map((part) => part.charAt(0))
              .join("")
              .toUpperCase()
              .substring(0, 2)
          : "U";

        // Update all instances
        avatarElements.forEach((el) => {
          el.textContent = initials;
        });
        usernameElements.forEach((el) => {
          el.textContent = result.user.name || "User";
        });
        emailElements.forEach((el) => {
          el.textContent = result.user.email || "user@example.com";
        });
        creditsElements.forEach((el) => {
          el.textContent = `${result.user.credits} Credits`;
        });
      }
    });
  } catch (error) {
    console.error("Error updating menu user info:", error);
  }
}

// Process image based on action

function updateMenuContent(menu, content) {
  menu.innerHTML = content;
}

// Function to show loading state in the menu
function showLoadingState(menu) {
  const loadingContent = `
    <div class="pixel-insight-loading">
      <div class="pixel-insight-progress-container">
        <div class="pixel-insight-progress-text">
          <span>Processing image...</span>
          <span class="pixel-insight-progress-percentage">Please wait</span>
        </div>
        <div class="pixel-insight-progress-bar-bg">
          <div class="pixel-insight-progress-bar-fill"></div>
        </div>
        <div class="pixel-insight-progress-dots">
          <div class="pixel-insight-progress-dot"></div>
          <div class="pixel-insight-progress-dot"></div>
          <div class="pixel-insight-progress-dot"></div>
        </div>
      </div>
    </div>
  `;
  // Assuming updateMenuContent is a function defined elsewhere,  if not define it here.
  function updateMenuContent(menu, content) {
    menu.innerHTML = content;
  }
  updateMenuContent(menu, loadingContent);

  // Start the animation for indeterminate progress
  const progressBar = menu.querySelector(".pixel-insight-progress-bar-fill");
  if (progressBar) {
    let width = 0;
    const simulateProgress = setInterval(() => {
      if (width >= 95) {
        clearInterval(simulateProgress);
      } else {
        width += (95 - width) * 0.1;
        progressBar.style.width = width + "%";
      }
    }, 300);

    // Store the interval ID on the menu element so it can be cleared if needed
    menu.dataset.progressInterval = simulateProgress;
  }
}

function showSuccessMessage(menu, message) {
  const successContent = `
    <div class="pixel-insight-success">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <div class="pixel-insight-success-text">${message}</div>
    </div>
  `;
  menu.innerHTML = successContent;
}

// Optional: Function to update progress if you have actual progress data
function processImage(image, menu, token) {
  try {
    showLoadingState(menu);
    handleGenarteWithImage(image, token)
      .then(() => {
        showNotification("Success", "Image processed successfully!", "success");
        showSuccessMessage(
          menu,
          "Image processed successfully! Click to view the chart.",
        );
      })
      .catch((error) => {
        showNotification(
          "Error",
          `Failed to process image: ${error.message}`,
          "error",
        );
        console.error("Error processing image:", error);
      });
  } catch (error) {
    showNotification(
      "Error",
      `Failed to process image: ${error.message}`,
      "error",
    );
    console.error("Error processing image:", error);
  }
}

const handleGenarteWithImage = async (image, token) => {
  let informationGenerated = {};
  try {
    const imageResponse = await fetch(image.src);
    if (!imageResponse.ok) throw new Error("Failed to fetch image");
    const imageBlob = await imageResponse.blob();

    const apiEndpoint = "https://plotset.com/api/snap/image";
    const bodyFormData = new FormData();
    bodyFormData.append("file", imageBlob);

    const response = await fetch(apiEndpoint, {
      method: "POST",
      body: bodyFormData,
      headers: {
        Authorization: `${token}`,
      },
    });

    if (!response.ok) {
      showNotification(
        "Error",
        `Failed to process image: Failed to upload image`,
        "error",
      );
      throw new Error("Failed to upload image");
    }
      
    const fileData = await response.json();

    const createChartEndpoint = "https://plotset.com/api/snap/charts";
    const chartResponse = await fetch(createChartEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify(fileData),
    });

    if (!chartResponse.ok){
      showNotification(
        "Error",
        `Failed to process image: Failed to create chart`,
        "error",
      );
      throw new Error("Failed to create chart");
    };
    const projectDataId = await chartResponse.json();
    const id = projectDataId.projectId;
    const editUrl = `https://plotset.com/ai/edit-data/${id}`;
    informationGenerated["PreviewLink"] = editUrl;

    const projectApi = `https://plotset.com/api/project/get/${id}`;
    const projectResponse = await fetch(projectApi, {
      method: "GET",
      headers: {
        Authorization: `${token}`,
      },
    });
    if (!projectResponse.ok){
      showNotification(
        "Error",
        `Failed to process image:Failed to fetch project details`,
        "error",
      );
      throw new Error("Failed to fetch project details");

    } 

    const projectData = await projectResponse.json();
    const datasetUrl = projectData?.data?.dataset?.url;
    if (!datasetUrl) {
      showNotification(
        "Error",
        `Failed to process image: Dataset URL not found`,
        "error",
      );
      throw new Error("Dataset URL not found");
    } 

    // Step 3: Construct full URL and download the file
    const fullDownloadUrl = `https://plotset.com/api/${datasetUrl}`;
    informationGenerated["fullDownloadUrl"] = fullDownloadUrl;

    const embedApi = "https://plotset.com/api/embed/create";
    const embedResponse = await fetch(embedApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify({ id: id }),
    });

    if (!embedResponse.ok){

      showNotification(
        "Error",
        `Failed to process image: Failed to create embed`,
        "error",
      );
      throw new Error("Failed to create embed");
    };

    const embedData = await embedResponse.json();
    const shareUrl = `https://plotset.com/share/${embedData.shareId}`;
    informationGenerated["shareUrl"] = shareUrl;

    return informationGenerated;
  } catch (error) {
    console.error("Error extracting data:", error);
    throw error;
  }
};

// Show notification
function showNotification(title, message, type = "info") {
  try {
    // Create notification container if it doesn't exist
    let container = document.getElementById(
      "pixel-insight-notification-container",
    );
    if (!container) {
      container = document.createElement("div");
      container.id = "pixel-insight-notification-container";
      document.body.appendChild(container);
    }

    // Create notification
    const notification = document.createElement("div");
    notification.className = `pixel-insight-notification pixel-insight-notification-${type}`;

    // Icon based on type
    let icon = "";
    switch (type) {
      case "success":
        icon =
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        break;
      case "error":
        icon =
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        break;
      case "warning":
        icon =
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        break;
      default:
        icon =
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    notification.innerHTML = `
        <div class="pixel-insight-notification-icon">${icon}</div>
        <div class="pixel-insight-notification-content">
          <div class="pixel-insight-notification-title">${title}</div>
          <div class="pixel-insight-notification-message">${message}</div>
        </div>
        <button class="pixel-insight-notification-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

    // Add close button functionality
    const closeButton = notification.querySelector(
      ".pixel-insight-notification-close",
    );
    closeButton.addEventListener("click", () => {
      notification.classList.add("pixel-insight-notification-hiding");
      setTimeout(() => {
        notification.remove();
      }, 300);
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add("pixel-insight-notification-hiding");
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);

    // Add to container
    container.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
      notification.classList.add("pixel-insight-notification-show");
    }, 10);
  } catch (error) {
    console.error("Error showing notification:", error);
  }
}

// Process all images on the page
function processImages() {
  try {
    const images = document.querySelectorAll("img");
    images.forEach(createImageOverlay);

    // Observe for new images
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === "IMG") {
              createImageOverlay(node);
            } else if (node.querySelectorAll) {
              node.querySelectorAll("img").forEach(createImageOverlay);
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  } catch (error) {
    console.error("Error processing images:", error);
    chrome.runtime.sendMessage({
      action: "log_error",
      error: {
        message: error.message,
        stack: error.stack,
        source: "process_images",
      },
    });
  }
}

// Create and inject styles
function injectStyles() {
  try {
    const style = document.createElement("style");
    style.textContent = `
        /* Overlay button */
        .pixel-insight-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #295d9b, #3b78c2);
          color: white;
          border: none;
          cursor: pointer;
           box-shadow: 0 2px 10px rgba(41, 93, 155, 0.3); 
          transition: all 0.2s ease;
          z-index: 10000;
        }
        
        .pixel-insight-button:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(41, 93, 155, 0.4);
        }
        
        /* Menu */
        .pixel-insight-menu {
          position: absolute;
          top: 40px;
          right: 0;
          width: 220px;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          display: none;
          flex-direction: column;
          overflow: hidden;
          z-index: 10001;
          opacity: 0;
          transform: translateY(-10px) scale(0.95);
          transition: all 0.2s ease;
        }
        
        .pixel-insight-menu.show {
          display: flex;
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        
        /* Menu header with user info */
        .pixel-insight-menu-header {
          padding: 12px;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .pixel-insight-user-info {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .pixel-insight-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #295d9b, #3b78c2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          margin-right: 10px;
        }
        
        .pixel-insight-user-details {
          flex: 1;
          min-width: 0;
        }
        
        .pixel-insight-username {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .pixel-insight-email {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .pixel-insight-credits {
          font-size: 12px;
          font-weight: 600;
          color: #6366f1;
          background-color: #eff6ff;
          padding: 4px 8px;
          border-radius: 12px;
          display: inline-block;
        }
        
        .pixel-insight-menu-divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 0;
        }
        
        /* Menu items */
        .pixel-insight-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          font-size: 14px;
          color: #374151;
          transition: background-color 0.2s;
          width: 100%;
        }
        
        .pixel-insight-menu-item:hover {
          background-color: #f3f4f6;
        }
        
        .pixel-insight-menu-item svg {
          color: #0771ED;
        }
          .pixel-insight-menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f3f4f6;
  color: #9ca3af;
}

.pixel-insight-menu-item:disabled svg {
  color: #9ca3af;
}

.pixel-insight-menu-item:disabled:hover {
  background-color: #f3f4f6;
}
        
        /* Notifications */
        #pixel-insight-notification-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 320px;
        }
        
        .pixel-insight-notification {
          display: flex;
          align-items: flex-start;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 12px;
          margin-top: 10px;
          transform: translateX(120%);
          opacity: 0;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        .pixel-insight-notification-show {
          transform: translateX(0);
          opacity: 1;
        }
        
        .pixel-insight-notification-hiding {
          transform: translateX(120%);
          opacity: 0;
        }
        
        .pixel-insight-notification-icon {
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .pixel-insight-notification-success .pixel-insight-notification-icon {
          color: #10b981;
        }
        
        .pixel-insight-notification-error .pixel-insight-notification-icon {
          color: #ef4444;
        }
        
        .pixel-insight-notification-warning .pixel-insight-notification-icon {
          color: #f59e0b;
        }
        
        .pixel-insight-notification-info .pixel-insight-notification-icon {
          color: #3b82f6;
        }
        
        .pixel-insight-notification-content {
          flex: 1;
          min-width: 0;
        }
        
        .pixel-insight-notification-title {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
          margin-bottom: 2px;
        }
        
        .pixel-insight-notification-message {
          font-size: 12px;
          color: #6b7280;
        }
        
        .pixel-insight-notification-close {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
        }
        
        .pixel-insight-notification-close:hover {
          color: #6b7280;
        }
          .pixel-insight-loading {
          padding: 16px;
          width: 100%;
        }
        
        .pixel-insight-progress-container {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        
        .pixel-insight-progress-text {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
          color: #374151;
        }
        
        .pixel-insight-progress-percentage {
          font-weight: 500;
          color: #3b82f6;
        }
        
        .pixel-insight-progress-bar-bg {
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .pixel-insight-progress-bar-fill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          border-radius: 4px;
          transition: width 2s ease-out;
        }
        
        .pixel-insight-progress-dots {
          display: flex;
          justify-content: center;
          margin-top: 12px;
          gap: 4px;
        }
        
        .pixel-insight-progress-dot {
          width: 6px;
          height: 6px;
          background-color: #3b82f6;
          border-radius: 50%;
          animation: pixel-insight-bounce 1.4s infinite ease-in-out both;
        }
        
        .pixel-insight-progress-dot:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .pixel-insight-progress-dot:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes pixel-insight-bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        
      `;

    document.head.appendChild(style);
  } catch (error) {
    console.error("Error injecting styles:", error);
  }
}

// Initialize
try {
  injectStyles();

  // Initialize when DOM is fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", processImages);
  } else {
    processImages();
  }
} catch (error) {
  console.error("Initialization error:", error);
  chrome.runtime.sendMessage({
    action: "log_error",
    error: {
      message: error.message,
      stack: error.stack,
      source: "initialization",
    },
  });
}
