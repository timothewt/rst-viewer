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

// Extract code block information from RST content
const extractCodeBlockInfo = (content) => {
  const patterns = [
    {
      type: "code-block",
      regex: /\.\.\s+code-block::\s*([^\n]*)\n((?:\s*\n|\s{3,}.*\n)*)/g,
      getMatch: (m) => ({
        language: m[1].trim() || "none",
        code: m[2].replace(/^\s{3,}/gm, (match) => match.slice(3)).trim(),
      }),
    },
    {
      type: "code",
      regex: /\.\.\s+code::\s*([^\n]*)\n((?:\s*\n|\s{3,}.*\n)*)/g,
      getMatch: (m) => ({
        language: m[1].trim() || "none",
        code: m[2].replace(/^\s{3,}/gm, (match) => match.slice(3)).trim(),
      }),
    },
    {
      type: "sourcecode",
      regex: /\.\.\s+sourcecode::\s*([^\n]*)\n((?:\s*\n|\s{3,}.*\n)*)/g,
      getMatch: (m) => ({
        language: m[1].trim() || "none",
        code: m[2].replace(/^\s{3,}/gm, (match) => match.slice(3)).trim(),
      }),
    },
    {
      type: "highlight",
      regex:
        /\.\.\s+highlight::\s*([^\n]*)\n[\s\S]*?::\s*\n((?:\s*\n|\s{3,}.*\n)*)/g,
      getMatch: (m) => ({
        language: m[1].trim() || "none",
        code: m[2].replace(/^\s{3,}/gm, (match) => match.slice(3)).trim(),
      }),
    },
    {
      type: "parsed-literal",
      regex: /\.\.\s+parsed-literal::\s*\n((?:\s*\n|\s{3,}.*\n)*)/g,
      getMatch: (m) => ({
        language: "none",
        code: m[1].replace(/^\s{3,}/gm, (match) => match.slice(3)).trim(),
      }),
    },
    {
      type: "literal", // must be last to avoid conflicts
      regex: /::\s*\n((?:\s*\n|\s{4,}.*\n)*)/g,
      getMatch: (m) => ({
        language: "none",
        code: m[1].replace(/^\s{4}/gm, "").trim(),
      }),
    },
  ];

  const codeBlocks = [];

  // Collect all matches with their positions in the document
  for (const { type, regex, getMatch } of patterns) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const { language, code } = getMatch(match);
      codeBlocks.push({
        language,
        code,
        type,
        position: match.index,
      });
    }
  }

  // Sort by position to maintain document order
  codeBlocks.sort((a, b) => a.position - b.position);

  // Remove position property and return
  return codeBlocks.map(({ language, code, type }) => ({
    language,
    code,
    type,
  }));
};

// HTML escape utility
const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

// Match HTML code block content with RST source to detect language
const detectLanguageFromContent = (rstContent, htmlContent) => {
  // Clean the HTML content to match RST content format
  const cleanHtmlContent = htmlContent.trim();

  // Try to find this exact content in the RST and extract its language
  const patterns = [
    {
      regex: /\.\.\s+code-block::\s*([^\n]*)\n((?:\s*\n|\s{3,}.*\n)*)/g,
      getLanguage: (match) => match[1].trim() || "none",
      getCode: (match) =>
        match[2].replace(/^\s{3,}/gm, (m) => m.slice(3)).trim(),
    },
    {
      regex: /\.\.\s+code::\s*([^\n]*)\n((?:\s*\n|\s{3,}.*\n)*)/g,
      getLanguage: (match) => match[1].trim() || "none",
      getCode: (match) =>
        match[2].replace(/^\s{3,}/gm, (m) => m.slice(3)).trim(),
    },
    {
      regex: /\.\.\s+sourcecode::\s*([^\n]*)\n((?:\s*\n|\s{3,}.*\n)*)/g,
      getLanguage: (match) => match[1].trim() || "none",
      getCode: (match) =>
        match[2].replace(/^\s{3,}/gm, (m) => m.slice(3)).trim(),
    },
    {
      regex: /\.\.\s+raw::\s*html\s*\n((?:\s*\n|\s{3,}.*\n)*)/g,
      getLanguage: () => "html",
      getCode: (match) =>
        match[1].replace(/^\s{3,}/gm, (m) => m.slice(3)).trim(),
    },
  ];

  for (const { regex, getLanguage, getCode } of patterns) {
    let match;
    regex.lastIndex = 0; // Reset regex
    while ((match = regex.exec(rstContent)) !== null) {
      const code = getCode(match);
      // Check if this code matches the HTML content (with some tolerance for whitespace)
      if (
        code === cleanHtmlContent ||
        code.replace(/\s+/g, " ") === cleanHtmlContent.replace(/\s+/g, " ")
      ) {
        return getLanguage(match);
      }
    }
  }

  // Default to none if no match found (for literal blocks)
  return "none";
};

// Preprocess RST content to remove problematic references
const preprocessRstContent = (content) => {
  return (
    content
      // Convert :ref:`label <target>` to "label"
      .replace(/:ref:`([^<`]+)\s*<[^>]*>`/g, '"$1"')
      // Convert :ref:`target` to "target"
      .replace(/:ref:`([^`]+)`/g, '"$1"')
      // Convert :doc:`title <path>` to "title"
      .replace(/:doc:`([^<`]+)\s*<[^>]*>`/g, '"$1"')
      // Convert :doc:`path` to "path"
      .replace(/:doc:`([^`]+)`/g, '"$1"')
      // Remove include directives that reference external files
      .replace(/\.\.\s+include::\s*[^\n]*/g, "")
      // Remove literalinclude directives that reference external files
      .replace(/\.\.\s+literalinclude::\s*[^\n]*/g, "")
      // Convert sourcecode directive to code-block directive
      .replace(/\.\.\s+sourcecode::/g, ".. code-block::")
      // Convert parsed-literal directive to literal block
      .replace(/\.\.\s+parsed-literal::/g, "::")
      // Convert raw HTML to code-block with html highlighting
      .replace(
        /\.\.\s+raw::\s*html\s*\n((?:\s*\n|\s{4,}.*\n)*)/g,
        (match, htmlContent) => {
          const cleanHtml = htmlContent.replace(/^\s{4}/gm, "").trim();
          return `.. code-block:: html\n\n${htmlContent}`;
        },
      )
      // Remove epigraph directives that are unsupported
      .replace(/\.\.\s+epigraph::\s*\n((?:\s*\n|\s{4,}.*\n)*)/g, "")
  );
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
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Preprocess content to handle problematic references
    const preprocessedContent = preprocessRstContent(rstContent);

    const compiler = new RstToHtmlCompiler();
    const optionsIgnoreErrors = {
      disableWarnings: true,
      disableErrors: true,
    };
    const html = compiler.compile(preprocessedContent);

    if (!html?.body?.trim()) {
      console.warn("Compilation resulted in empty HTML");
      showError(rstContent, "RST compilation produced no output");
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html.body, "text/html");
    const htmlBody = doc.body;

    // Find all code blocks in the compiled HTML
    const codeBlocks = htmlBody.getElementsByClassName("code");

    // Apply language-specific Prism classes using content matching
    Array.from(codeBlocks).forEach((block, index) => {
      const content = block.textContent || block.innerText;
      const language = detectLanguageFromContent(rstContent, content);

      // Debug logging
      const preview = content.substring(0, 50).replace(/\n/g, "\\n");

      block.innerHTML = `<code class="language-${language}">${escapeHtml(content)}</code>`;

      // Add pre wrapper if not already present
      if (block.tagName !== "PRE") {
        const pre = document.createElement("pre");
        pre.className = `language-${language}`;
        block.parentNode.insertBefore(pre, block);
        pre.appendChild(block);
      } else {
        block.className = `language-${language}`;
      }
    });

    // finally, if you need the processed HTML back as a string:
    const processedHtml = htmlBody.innerHTML;

    // Load stylesheet and render
    loadStylesheet();
    document.body.innerHTML = processedHtml;

    // Load Prism.css first
    const prismLink = document.createElement("link");
    prismLink.rel = "stylesheet";
    prismLink.href = chrome.runtime.getURL("prism.css");
    document.head.appendChild(prismLink);

    // Load Prism.js script
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("prism.js");
    script.onload = () => {
      // Trigger Prism highlighting after script loads
      if (window.Prism) {
        console.log("Running Prism highlightAll");
        window.Prism.highlightAll();
      }
    };
    document.head.appendChild(script);

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
