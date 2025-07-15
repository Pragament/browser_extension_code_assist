document.addEventListener("DOMContentLoaded", () => {
  const addRuleBtn = document.getElementById("addRuleBtn");
  const patternInput = document.getElementById("pattern");
  const selectorInput = document.getElementById("selector");
  const ruleList = document.getElementById("ruleList");
  const apiTypeRadios = document.getElementsByName("apiType");
  const pythonApiUrlInput = document.getElementById("pythonApiUrl");

  // Toggle visibility of Python API URL input based on radio selection
  apiTypeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      pythonApiUrlInput.style.display = radio.value === "python" ? "block" : "none";
      if (radio.value !== "python") {
        pythonApiUrlInput.value = ""; // Clear the input if switching away from Python API
      }
    });
  });

  // Initial toggle based on default selection (Prompt API)
  pythonApiUrlInput.style.display = "none";

  // Add rule functionality
  addRuleBtn.addEventListener("click", () => {
    const pattern = patternInput.value.trim();
    const selector = selectorInput.value.trim();
    const selectedApiType = document.querySelector('input[name="apiType"]:checked').value;
    const pythonApiUrl = selectedApiType === "python" ? pythonApiUrlInput.value.trim() : "";

    if (!pattern || !selector) {
      alert("Please enter both URL pattern and CSS Selector.");
      return;
    }
    if (selectedApiType === "python" && !pythonApiUrl) {
      alert("Please enter a Python API URL.");
      return;
    }

    chrome.storage.sync.get({ rules: [] }, (data) => {
      const rules = data.rules;
      rules.push({ pattern, selector, apiType: selectedApiType, pythonApiUrl: pythonApiUrl || null });

      chrome.storage.sync.set({ rules }, () => {
        const item = document.createElement("li");
        item.textText = `Pattern: ${pattern}, Selector: ${selector}, API Type: ${selectedApiType}${selectedApiType === "python" ? `, Python URL: ${pythonApiUrl}` : ""}`;
        ruleList.appendChild(item);

        patternInput.value = "";
        selectorInput.value = "";
        pythonApiUrlInput.value = "";
        pythonApiUrlInput.style.display = "none"; // Hide Python URL input after adding rule
      });
    });
  });

  // Load existing rules
  chrome.storage.sync.get({ rules: [] }, (data) => {
    for (const rule of data.rules) {
      const item = document.createElement("li");
      item.textContent = `Pattern: ${rule.pattern}, Selector: ${rule.selector}, API Type: ${rule.apiType}${rule.apiType === "python" ? `, Python URL: ${rule.pythonApiUrl}` : ""}`;
      ruleList.appendChild(item);
    }
  });
});