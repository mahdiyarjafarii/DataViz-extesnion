import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart,
  ChartColumn,
  FileOutput,
  FileText,
  Shell,
  WandSparkles,
} from "lucide-react";
import { usePopper } from "react-popper";
import { getStorageValue } from "./hooks/useLocalStorage";
import { SETTINGS } from "./constants";

const AIButton: React.FC<{ imgElement: HTMLImageElement }> = ({
  imgElement,
}) => {
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewLink, setPreviewLink] = useState("");
  const [csvLink, setCsvLink] = useState("");
  const [shareLink, setShareLink] = useState("");

  const { styles, attributes } = usePopper(buttonRef.current, popperElement, {
    placement: "left-start", // Position the popover to the right of the button
    modifiers: [
      { name: "offset", options: { offset: [0, 10] } }, // Add some spacing
      { name: "flip", options: { fallbackPlacements: ["left", "bottom"] } }, // Fallback placements
    ],
  });

  const handleGenarteWithImage = async () => {
    try {
      const token = await getStorageValue(SETTINGS.USERTOKEN, "");
      const status = await getStorageValue(SETTINGS.ISLOGGEDIN, false);
      if (!token || !status) {
        alert("Please log in in extenion");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      const imageResponse = await fetch(imgElement.src);
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

      if (!response.ok) throw new Error("Failed to upload image");
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

      if (!chartResponse.ok) throw new Error("Failed to upload image");
      const projectDataId = await chartResponse.json();
      const id = projectDataId.projectId;
      const editUrl = `https://plotset.com/ai/edit-data/${id}`;
      setPreviewLink(editUrl);

      const projectApi = `https://plotset.com/api/project/get/${id}`;
      const projectResponse = await fetch(projectApi, {
        method: "GET",
        headers: {
          Authorization: `${token}`,
        },
      });
      if (!projectResponse.ok)
        throw new Error("Failed to fetch project details");

      const projectData = await projectResponse.json();
      const datasetUrl = projectData?.data?.dataset?.url;
      if (!datasetUrl) throw new Error("Dataset URL not found");

      // Step 3: Construct full URL and download the file
      const fullDownloadUrl = `https://plotset.com/api/${datasetUrl}`;
      setCsvLink(fullDownloadUrl);

      const embedApi = "https://plotset.com/api/embed/create";
      const embedResponse = await fetch(embedApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({ id: id }),
      });

      if (!embedResponse.ok) throw new Error("Failed to create embed");

      const embedData = await embedResponse.json();
      const shareUrl = `https://plotset.com/share/${embedData.shareId}`;
      setShareLink(shareUrl);
    } catch (error) {
      console.error("Error extracting data:", error);
      alert("Failed to extract data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsPopoverVisible((prev) => !prev);
    await handleGenarteWithImage();
  };
  const handleDownLoad = () => {
    const link = document.createElement("a");
    link.href = csvLink;
    link.setAttribute("download", "dataset.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleShare = () => {
    if (shareLink) {
      window.open(shareLink, "_blank");
    } else {
      alert("Share link is not available.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popperElement &&
        !popperElement.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsPopoverVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popperElement]);

  return (
    <>
      <button
        ref={buttonRef}
        className="bg-black !important cursor-pointer text-[12px] text-white flex items-center gap-2 px-3 py-1 rounded-md shadow-md"
        onClick={handleClick}
        style={{ background: "black" }}
      >
        <WandSparkles className="h-3 w-3" />
        Extract (Data + Chart)
      </button>

      {isPopoverVisible && (
        <div
          ref={setPopperElement}
          className="z-[999999] bg-black bg-opacity-90 shadow-lg backdrop-blur px-4 py-4 border border-[#3d3d42] rounded-xl w-[300px] font-inter text-white text-sm transition-opacity duration-300 popover"
          style={styles.popper}
          {...attributes.popper}
        >
          <button
            className="top-2 right-2 absolute bg-transparent hover:bg-white/10 p-1 border-none rounded-full w-6 h-6 text-white/60 hover:text-white text-xl transition-all ease-in-out cursor-pointer"
            // onClick={onClose}
          >
            ×
          </button>
          <div className="flex flex-col gap-4 px-6">
            <div className="font-semibold text-white">Plotset</div>

            {isLoading ? (
              <>
                <div className="mt-4">
                  <Shell className="animate-spin" />
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-4 mt-4">
                  <button
                    className="!important hover:bg-blue-950 p-2 rounded-full text-white transition-colors flex gap-2 justify-center items-center cursor-pointer"
                    onClick={handleDownLoad}
                    style={{ background: "#193cb8" }}
                  >
                    <FileOutput />
                    Extract Data (CSV)
                  </button>
                  <button
                    className=" hover:bg-blue-950 p-2 rounded-full text-white transition-colors flex gap-2 justify-center items-center cursor-pointer"
                    onClick={handleShare}
                    style={{ background: "#193cb8" }}
                  >
                    <ChartColumn />
                    Create Chart
                  </button>
                </div>
                {previewLink && (
                  <div className="mt-2">
                    <p>You can see more details:</p>
                    <a
                      href={previewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white underline"
                    >
                      {previewLink}
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const seenImages = new Set<string>();

const isElementVisible = (element: HTMLImageElement) => {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth &&
    computedStyle.display !== "none" &&
    computedStyle.visibility !== "hidden" &&
    parseFloat(computedStyle.opacity) > 0
  );
};

const isProgressiveImage = (img: HTMLImageElement) => {
  // Check if the image is a placeholder (data URL or SVG) before loading the real image.
  return (
    img.src.startsWith("data:image/svg+xml") ||
    img.src.startsWith("data:image/png")
  );
};

const isValidImage = (img: HTMLImageElement) => {
  return (
    img.src &&
    img.naturalWidth > 0 &&
    img.naturalHeight > 0 &&
    !img.src.includes("placeholder") &&
    !img.src.includes("spinner") &&
    !img.src.includes("loading")
  );
};

const isMostlyTransparent = async (img: HTMLImageElement) => {
  return new Promise<boolean>((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(false);

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
    let transparentPixels = 0;
    let totalPixels = img.width * img.height;

    for (let i = 3; i < imageData.length; i += 4) {
      if (imageData[i] < 50) transparentPixels++;
    }

    resolve(transparentPixels / totalPixels > 0.6);
  });
};

const addImageButtons = async () => {
  document.querySelectorAll("img").forEach(async (img) => {
    if (isProgressiveImage(img)) return;
    if (img.dataset.hasButton) return;

    if (
      !isElementVisible(img) ||
      !isValidImage(img) ||
      seenImages.has(img.src)
    ) {
      return;
    }

    if (await isMostlyTransparent(img)) return;
    seenImages.add(img.src);

    const wrapper = document.createElement("div");
    wrapper.className = "relative inline-block group";
    wrapper.style.width = `${img.width}px`;
    wrapper.style.height = `${img.height}px`;

    const buttonContainer = document.createElement("div");
    buttonContainer.className =
      "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity";
    const root = createRoot(buttonContainer);
    root.render(<AIButton imgElement={img as HTMLImageElement} />);

    img.parentNode?.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.appendChild(buttonContainer);

    img.dataset.hasButton = "true";
  });
};

window.addEventListener("load", addImageButtons);
window.addEventListener("scroll", addImageButtons);
