console.log("RST Viewer background script loaded!");

// Chrome extension background script
chrome.runtime.onInstalled.addListener(() => {
  console.log('RST Viewer extension installed');
});

