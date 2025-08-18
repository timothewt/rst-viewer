import { RstToHtmlCompiler } from "rst-compiler";

// Chrome extension API

// Load CSS stylesheet
const loadStylesheet = () => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = chrome.runtime.getURL("rst-styles.css");
  document.head.appendChild(link);
};

// Check if extension is disabled on current page
const isExtensionDisabled = async () => {
  try {
    const result = await chrome.storage.local.get(["disabledPages"]);
    const disabledPages = result.disabledPages || [];
    const url = window.location.href;
    const domain = window.location.hostname || "file";

    return disabledPages.some(
      (disabled) =>
        disabled === url ||
        disabled === domain ||
        (disabled.endsWith("/*") && url.startsWith(disabled.slice(0, -2))),
    );
  } catch (error) {
    console.error("Error checking extension status:", error);
    return false;
  }
};

// Preprocess RST content to remove problematic references
const preprocessRstContent = (content) => {
  return content
    // Convert :ref:`label <target>` to "label"
    .replace(/:ref:`([^<`]+)\s*<[^>]*>`/g, '"$1"')
    // Convert :ref:`target` to "target"
    .replace(/:ref:`([^`]+)`/g, '"$1"')
    // Convert :doc:`title <path>` to "title"
    .replace(/:doc:`([^<`]+)\s*<[^>]*>`/g, '"$1"')
    // Convert :doc:`path` to "path"
    .replace(/:doc:`([^`]+)`/g, '"$1"')
};

// Show error fallback
const showError = (originalContent, errorMessage = null) => {
  const escapedContent = originalContent
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  document.body.innerHTML = `
    <div style="padding: 20px; max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      ${
        errorMessage
          ? `
        <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin-bottom: 20px;">
          <h3 style="color: #721c24; margin: 0 0 10px 0;">⚠️ RST Processing Error</h3>
          <p style="color: #721c24; margin: 0;">${errorMessage}</p>
        </div>
      `
          : ""
      }
      <pre style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 15px; overflow-x: auto; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;">${escapedContent}</pre>
    </div>
  `;
};

// Show loading indicator
const showLoading = () => {
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #666;
    ">
      <div style="
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      "></div>
      <div style="font-size: 16px; font-weight: 500;">Processing RST file...</div>
      <div style="font-size: 14px; color: #999; margin-top: 8px;">RST Viewer is converting your document</div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
};

// Main RST processing function
const processRstFile = async () => {
  const preElement = document.querySelector("pre");
  if (!preElement) {
    console.log("No pre element found");
    return;
  }

  // Check if extension is disabled
  if (await isExtensionDisabled()) {
    console.log("RST Viewer is disabled on this page");
    return;
  }

  const rstContent = preElement.textContent || preElement.innerText;
  if (!rstContent?.trim()) {
    console.warn("No RST content found");
    return;
  }

  // Show loading indicator immediately
  showLoading();
  loadStylesheet();

  try {
    console.log("Processing RST content...");

    // Add a small delay to ensure loading indicator is visible
    await new Promise(resolve => setTimeout(resolve, 100));

    // Preprocess content to handle problematic references
    const preprocessedContent = preprocessRstContent(rstContent);

    const compiler = new RstToHtmlCompiler();
    const html = compiler.compile(preprocessedContent);

    if (!html?.body?.trim()) {
      console.warn("Compilation resulted in empty HTML");
      showError(rstContent, "RST compilation produced no output");
      return;
    }

    // Load stylesheet and render
    loadStylesheet();
    document.body.innerHTML = html.body;

    // Add header content if present (CSS, scripts, etc.)
    if (html.header?.trim()) {
      document.head.innerHTML += html.header;
    }

    console.log("RST file successfully processed and rendered");
  } catch (error) {
    console.error("Error compiling RST:", error);
    showError(rstContent, error.message);
  }
};

// Initialize when DOM is ready
console.log("RST Viewer content script loaded");
if (window.requestIdleCallback) {
  requestIdleCallback(() => processRstFile());
} else {
  setTimeout(() => processRstFile(), 0);
}

