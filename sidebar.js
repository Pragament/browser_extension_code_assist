console.log("✅ Sidebar JS loaded");

document.addEventListener("DOMContentLoaded", () => {
  const extractBtn = document.getElementById("extractBtn");
  const resultEl = document.getElementById("result");

  extractBtn.addEventListener("click", () => {
    console.log("📤 Sending extract_code message");

    chrome.runtime.sendMessage({ type: "extract_code" }, (response) => {
      if (response?.success) {
        console.log("✅ Code received:", response.code);
        resultEl.textContent = response.code;
      } else {
        console.error("❌ Failed to extract:", response?.error);
        resultEl.textContent = "Error: " + response?.error;
      }
    });
  });
});
