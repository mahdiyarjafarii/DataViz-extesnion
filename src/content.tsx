import React, { useEffect, useState, useRef } from "react";
import browser from "webextension-polyfill";
import { usePopper } from "react-popper";
import { createRoot } from "react-dom/client";
import { getStyles } from "./utils/styles";
import {
  Shell,
  Copy,
  Check,
  FileOutput,
  ChartColumn,
  WandSparkles,
} from "lucide-react";
import { getStorageValue, setStorageValue } from "./hooks/useLocalStorage";
import { SETTINGS } from "./constants";
import "./content.css";

interface TextTransformerProps {
  onClose: () => void;
  selectedText: string;
  referenceElement: HTMLElement | null;
}

let sliderLabels: string[] = [];
getStyles().then((styles) => {
  sliderLabels = [...Object.keys(styles), "Original"];
});

const Popover: React.FC<TextTransformerProps> = ({
  onClose,
  selectedText,
  referenceElement,
}) => {
  const [sliderValue, setSliderValue] = useState(sliderLabels.length - 1);
  const [transformedText, setTransformedText] = useState("");
  const [previewLink, setPreviewLink] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [csvLink, setCsvLink] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccses, setIsSuccses] = useState(false);
  const [isRTL, setIsRTL] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const popperRef = useRef<HTMLDivElement>(null);

  const { styles, attributes } = usePopper(
    referenceElement,
    popperRef.current,
    {
      strategy: "absolute",
      modifiers: [
        { name: "offset", options: { offset: [0, 10] } },
        { name: "flip", options: { fallbackPlacements: ["top", "bottom"] } },
        { name: "preventOverflow", options: { padding: 8 } },
      ],
    },
  );

  // Function to detect if text is RTL
  const isTextRTL = (text: string) => {
    const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    return rtlRegex.test(text);
  };

  // Handle initial style processing and RTL detection
  useEffect(() => {
    const initDefaultStyle = async () => {
      const defaultStyle = await getStorageValue(SETTINGS.DEFAULT_STYLE, "");
      const defaultIndex = sliderLabels.indexOf(defaultStyle);

      if (defaultIndex !== -1 && defaultIndex !== sliderLabels.length - 1) {
        setSliderValue(defaultIndex);
        setIsLoading(true);
        const response = await browser.runtime.sendMessage({
          originalSelectedText: selectedText,
          text: selectedText,
          summaryLengthName: sliderLabels[defaultIndex],
        });
        setTransformedText(response);
        setIsRTL(isTextRTL(response));
        setIsLoading(false);
      } else {
        setTransformedText(selectedText);
        setIsRTL(isTextRTL(selectedText));
      }
    };
    initDefaultStyle();
  }, [selectedText]);

  const handleSliderChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newValue = parseInt(event.target.value);
    setSliderValue(newValue);
    const summaryLengthName = sliderLabels[newValue];

    await setStorageValue(SETTINGS.DEFAULT_STYLE, summaryLengthName);

    if (newValue === sliderLabels.length - 1) {
      setTransformedText(selectedText);
      setIsRTL(isTextRTL(selectedText));
      return;
    }

    setIsLoading(true);
    const response = await browser.runtime.sendMessage({
      originalSelectedText: selectedText,
      text: selectedText,
      summaryLengthName,
    });
    setTransformedText(response);
    setIsRTL(isTextRTL(response));
    setIsLoading(false);
  };
  const handleGenarteWithText = async () => {
    const token = await getStorageValue(SETTINGS.USERTOKEN, "");
    const status = await getStorageValue(SETTINGS.ISLOGGEDIN, false);
    if (!token || !status) {
      alert("Please log in in extenion");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const apiEndpoint = "https://plotset.com/api/snap/text";
      const textBlob = new Blob([selectedText], { type: "text/plain" });
      const bodyFormData = new FormData();
      bodyFormData.append("file", textBlob, "content.txt");

      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: bodyFormData,
        headers: {
          Authorization: `${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to upload text");

      const data = await response.json();
      const id = data.projectId;
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
      const imageUrl = projectData?.data?.thumbnail;
      if (!datasetUrl) throw new Error("Dataset URL not found");

      // Step 3: Construct full URL and download the file
      const fullDownloadUrl = `https://plotset.com/api/${datasetUrl}`;
      setCsvLink(fullDownloadUrl);

      const fullImageUrl = `https://plotset.com/api/${imageUrl}`;
      setImageLink(fullImageUrl);

      // Step 4: Create Embed & Get Share Link
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
      console.log("Share URL:", shareUrl);
      setIsSuccses(true);
    } catch (error) {
      setIsSuccses(false);
      console.error("Error extracting data:", error);
      alert("Failed to extract data.");
    } finally {
      setIsLoading(false);
    }
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

  const handleCopy = (isSuccses:any) => {
    if(isSuccses){
      navigator.clipboard.writeText(previewLink);
    }else{
      navigator.clipboard.writeText(transformedText);
    }
    
    setShowCheck(true);
    // Show check for 1 second then revert to copy icon
    setTimeout(() => {
      setShowCheck(false);
    }, 1000);
  };

  return (
    <div
      ref={popperRef}
      style={{
        ...styles.popper,
        zIndex: 999999,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(10px)",
        padding: "16px",
        border: "1px solid #3d3d42",
        borderRadius: "12px",
        width: "400px",
        fontFamily: "Inter, sans-serif",
        color: "white",
        fontSize: "14px",
        transition: "opacity 300ms",
      }}
      {...attributes.popper}
    >
      <button
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "transparent",
          padding: "4px",
          border: "none",
          borderRadius: "50%",
          width: "24px",
          height: "24px",
          color: "rgba(255, 255, 255, 0.6)",
          fontSize: "20px",
          transition: "all 0.2s ease-in-out",
          cursor: "pointer",
        }}
        onClick={onClose}
        onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)")
        }
      >
        ×
      </button>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "0 24px",
        }}
      >
        <div style={{ fontWeight: "600", color: "white" }}>Plotset</div>

        {!isSuccses ? (
          <>
            <div style={{ marginTop: "16px" }}>
              <button
                style={{
                  width: "100%",
                  background: "#193cb8",
                  padding: "8px",
                  borderRadius: "9999px",
                  color: "white",
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                }}
                onClick={handleGenarteWithText}
                onMouseEnter={(e) =>
                  !isLoading && (e.currentTarget.style.background = "#172a8e")
                }
                onMouseLeave={(e) =>
                  !isLoading && (e.currentTarget.style.background = "#193cb8")
                }
                disabled={isLoading}
              >
                {isLoading ? (
                  <>We are analyzing ...</>
                ) : (
                  <>
                    <WandSparkles />
                    Extract (Data + Chart)
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <button
                onClick={handleDownLoad}
                style={{
                  background: "#193cb8",
                  padding: "0.5rem",
                  borderRadius: "9999px",
                  color: "white",
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  width: "100%",
                  fontSize: "12px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#1e3a8a")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#193cb8")
                }
              >
                <FileOutput />
                Extract Data (CSV)
              </button>
              <button
                onClick={handleShare}
                style={{
                  background: "#193cb8",
                  padding: "0.5rem",
                  borderRadius: "9999px",
                  color: "white",
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  width: "100%",
                  fontSize: "12px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#1e3a8a")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#193cb8")
                }
              >
                <ChartColumn />
                Create Chart
              </button>
            </div>
          </>
        )}

        <div className="flex flex-col justify-center items-center mt-4 max-h-[400px] overflow-y-auto text-white">
          {isLoading ? (
            <div style={{ height: "32px" }}>
              <Shell className="animate-spin" />
            </div>
          ) : isSuccses && imageLink ? (
            <img src={imageLink} alt="Success" />
          ) : (
            <span
              className={`font-semibold ${isRTL ? "text-right direction-rtl" : "text-left"}`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {transformedText}
            </span>
          )}
          {isSuccses && previewLink && (
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
          {!isLoading && transformedText && (
            <button
              style={{marginTop:"12px"}}
              className="bg-teal-500 hover:bg-teal-600  p-1 rounded-full text-white transition-colors mt-2.5"
              onClick={()=>{handleCopy(isSuccses)}}
              title={showCheck ? "Copied!" : "Copy to clipboard"}
            >
              {showCheck ? <Check size={16} /> : <Copy size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const TextTransformerApp: React.FC = () => {
  const [selection, setSelection] = useState<{
    text: string;
    referenceElement: HTMLElement | null;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = async (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        popoverRef.current?.contains(event.target)
      ) {
        return;
      }

      const isEnabled = await getStorageValue(SETTINGS.ENABLED, true);
      if (!isEnabled) return;

      const minWords = await getStorageValue(SETTINGS.MIN_WORDS, 5);
      const selectedText = window.getSelection()?.toString() || "";
      const wordCount = selectedText.trim().split(/\s+/).length;

      if (wordCount > minWords) {
        const selection = window.getSelection();
        if (!selection?.rangeCount) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const virtualEl = document.createElement("span");
        document.body.appendChild(virtualEl);
        virtualEl.style.position = "absolute";
        virtualEl.style.left = `${rect.left + rect.width / 2}px`;
        virtualEl.style.top = `${rect.bottom + window.scrollY}px`;
        virtualEl.style.width = "1px";
        virtualEl.style.height = "1px";

        setSelection({
          text: selectedText,
          referenceElement: virtualEl,
        });
        setIsVisible(true);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        selection &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selection]);

  const handleClose = () => {
    if (selection?.referenceElement) {
      selection.referenceElement.remove();
    }
  
    setSelection(null);
    setIsVisible(true);
    removeHighlight();
  };

  return (
    <>
      {selection && (
        <div
          ref={popoverRef}
          className={`transition-opacity duration-300 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {isVisible && (
            <Popover
              selectedText={selection.text}
              referenceElement={selection.referenceElement}
              onClose={handleClose}
            />
          )}
        </div>
      )}
    </>
  );
};

const removeHighlight = () => {
  const activeWrappers = document.querySelectorAll(
    ".shorter-ext-text-wrapper-active",
  );
  activeWrappers.forEach((wrapper) => {
    wrapper.classList.remove("shorter-ext-text-wrapper-active");
  });
};

const init = () => {
  const root = document.createElement("div");
  root.id = "text-transformer-root";
  document.body.appendChild(root);

  const reactRoot = createRoot(root);
  reactRoot.render(<TextTransformerApp />);
};

init();

export default TextTransformerApp;
