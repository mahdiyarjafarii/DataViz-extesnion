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
    if (image.width < 100 || image.height < 100) return;

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
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
          </svg>
          Extract Data
        </button>
        <button class="pixel-insight-menu-item" data-action="chart">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
            <line x1="2" y1="20" x2="22" y2="20"></line>
          </svg>
          Make Chart
        </button>
        <button class="pixel-insight-menu-item" data-action="analyze">
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
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = e.currentTarget.getAttribute("data-action");

        // Check if user is logged in
        chrome.storage.local.get(["isLoggedIn", "user"], (result) => {
          if (chrome.runtime.lastError) {
            showNotification(
              "Error",
              chrome.runtime.lastError.message,
              "error",
            );
            return;
          }

          if (!result.isLoggedIn) {
            showNotification(
              "Authentication Required",
              "Please log in to use this feature",
              "warning",
            );
            return;
          }

          if (result.user.credits <= 0) {
            showNotification(
              "No Credits",
              "You have no credits left. Please purchase more credits.",
              "warning",
            );
            return;
          }

          // Process the image based on the action
          processImage(image, action);

          // Deduct credits
          const newCredits = result.user.credits - 1;
          chrome.storage.local.set(
            {
              user: { ...result.user, credits: newCredits },
            },
            () => {
              if (chrome.runtime.lastError) {
                showNotification(
                  "Error",
                  chrome.runtime.lastError.message,
                  "error",
                );
                return;
              }

              // Update credits display
              document.getElementById("menu-credits").textContent =
                `${newCredits} Credits`;
            },
          );

          // Add to activity
          addActivity(action, image.src);

          menu.classList.remove("show");

          // Show success notification
          const actionName =
            action === "extract"
              ? "Data Extraction"
              : action === "chart"
                ? "Chart Creation"
                : "Image Analysis";
          showNotification(
            "Processing Started",
            `${actionName} has started. You will be notified when it's complete.`,
            "success",
          );
        });
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
function processImage(image, action) {
  try {
    // Send message to background script
    chrome.runtime.sendMessage(
      {
        action: action,
        imageUrl: image.src,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          showNotification("Error", chrome.runtime.lastError.message, "error");
          console.error("Error sending message:", chrome.runtime.lastError);
        }
      },
    );
  } catch (error) {
    showNotification(
      "Error",
      `Failed to process image: ${error.message}`,
      "error",
    );
    console.error("Error processing image:", error);
  }
}

// Add activity to storage
function addActivity(action, imageUrl) {
  try {
    const activity = {
      action,
      imageUrl,
      timestamp: new Date().toISOString(),
      status: "processing",
    };

    chrome.storage.local.get(["activities"], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting activities:", chrome.runtime.lastError);
        return;
      }

      const activities = result.activities || [];
      activities.unshift(activity);

      // Keep only the last 20 activities
      if (activities.length > 20) {
        activities.pop();
      }

      chrome.storage.local.set({ activities }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving activities:", chrome.runtime.lastError);
        }
      });
    });
  } catch (error) {
    console.error("Error adding activity:", error);
  }
}

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
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(99, 102, 241, 0.3);
          transition: all 0.2s ease;
          z-index: 10000;
        }
        
        .pixel-insight-button:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
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
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
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
          color: #6366f1;
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
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .pixel-insight-menu {
            background-color: #1f2937;
            border: 1px solid #374151;
          }
          
          .pixel-insight-menu-header {
            background-color: #111827;
            border-bottom: 1px solid #374151;
          }
          
          .pixel-insight-username {
            color: #f9fafb;
          }
          
          .pixel-insight-email {
            color: #9ca3af;
          }
          
          .pixel-insight-credits {
            background-color: rgba(99, 102, 241, 0.2);
          }
          
          .pixel-insight-menu-divider {
            background-color: #374151;
          }
          
          .pixel-insight-menu-item {
            color: #e5e7eb;
          }
          
          .pixel-insight-menu-item:hover {
            background-color: #374151;
          }
          
          .pixel-insight-notification {
            background-color: #1f2937;
            border: 1px solid #374151;
          }
          
          .pixel-insight-notification-title {
            color: #f9fafb;
          }
          
          .pixel-insight-notification-message {
            color: #9ca3af;
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
