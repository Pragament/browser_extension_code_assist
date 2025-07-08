chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "extract_code") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      if (!tabId) return sendResponse({ success: false, error: "No active tab" });

      chrome.scripting.executeScript(
        {
          target: { tabId, allFrames: true },
          func: () => {
            // This part won't do anything; actual logic is in content.js
          },
        },
        () => {
          // Forward message to content script in iframe
          chrome.tabs.sendMessage(
            tabId,
            { type: "extract_code" },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error("❌ Runtime error:", chrome.runtime.lastError.message);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
              } else {
                sendResponse(response);
              }
            }
          );
        }
      );
    });

    // Required for async sendResponse
    return true;
  }
});
