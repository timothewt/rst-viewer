/**
 * Initialize popup when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    
    // Update UI with current page info
    updateCurrentPageDisplay(url);
    
    // Check if extension is enabled for this page
    const isEnabled = await getPageStatus(url);
    updateToggleState(isEnabled);
    
    // Set up toggle event listener
    setupToggleListener(url);
    
  } catch (error) {
    console.error('Error initializing popup:', error);
    showError('Unable to load page information');
  }
});

/**
 * Updates the current page display in the popup
 */
function updateCurrentPageDisplay(url) {
  const currentPageElement = document.getElementById('currentPage');
  
  try {
    const urlObj = new URL(url);
    const displayUrl = urlObj.protocol === 'file:' 
      ? urlObj.pathname.split('/').pop() || 'Local file'
      : urlObj.hostname + urlObj.pathname;
    
    currentPageElement.textContent = displayUrl;
  } catch (error) {
    currentPageElement.textContent = 'Current page';
  }
}

/**
 * Gets the enabled/disabled status for a page
 */
async function getPageStatus(url) {
  
  try {
    const result = await chrome.storage.local.get(['disabledPages']);
    const disabledPages = result.disabledPages || [];
    
    // Check if current page/domain is disabled
    const urlObj = new URL(url);
    const domain = urlObj.hostname || 'file';
    const path = urlObj.pathname;
    
    return !disabledPages.some(disabled => 
      disabled === url || 
      disabled === domain || 
      (disabled.endsWith('/*') && url.startsWith(disabled.slice(0, -2)))
    );
  } catch (error) {
    console.error('Error getting page status:', error);
    return true; // Default to enabled
  }
}

/**
 * Updates the toggle switch visual state
 */
function updateToggleState(isEnabled) {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const status = document.getElementById('status');
  
  if (isEnabled) {
    toggleSwitch.classList.add('active');
    status.textContent = 'RST Viewer is enabled on this page';
    status.className = 'status enabled';
  } else {
    toggleSwitch.classList.remove('active');
    status.textContent = 'RST Viewer is disabled on this page';
    status.className = 'status disabled';
  }
}

/**
 * Sets up the toggle switch event listener
 */
function setupToggleListener(url) {
  const toggleSwitch = document.getElementById('toggleSwitch');
  
  toggleSwitch.addEventListener('click', async () => {
    try {
      const currentlyEnabled = await getPageStatus(url);
      const newState = !currentlyEnabled;
      
      await setPageStatus(url, newState);
      updateToggleState(newState);
      
      // Reload the current tab to apply the change
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.reload(tab.id);
      
    } catch (error) {
      console.error('Error toggling page status:', error);
      showError('Unable to change page status');
    }
  });
}

/**
 * Sets the enabled/disabled status for a page
 */
async function setPageStatus(url, isEnabled) {
  
  try {
    const result = await chrome.storage.local.get(['disabledPages']);
    let disabledPages = result.disabledPages || [];
    
    const urlObj = new URL(url);
    const domain = urlObj.hostname || 'file';
    
    if (isEnabled) {
      // Remove from disabled list
      disabledPages = disabledPages.filter(disabled => 
        disabled !== url && disabled !== domain
      );
    } else {
      // Add to disabled list (use domain for broader coverage)
      if (!disabledPages.includes(domain)) {
        disabledPages.push(domain);
      }
    }
    
    await chrome.storage.local.set({ disabledPages });
  } catch (error) {
    console.error('Error setting page status:', error);
    throw error;
  }
}

/**
 * Shows an error message in the popup
 */
function showError(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status disabled';
}