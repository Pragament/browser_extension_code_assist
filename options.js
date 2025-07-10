document.addEventListener("DOMContentLoaded", () => {
  const addRuleBtn = document.getElementById("addRuleBtn");
  const patternInput = document.getElementById("pattern");
  const selectorInput = document.getElementById("selector");
  const ruleList = document.getElementById("ruleList");

  addRuleBtn.addEventListener("click", () => {
    const pattern = patternInput.value.trim();
    const selector = selectorInput.value.trim();

    if (!pattern || !selector) return;

    chrome.storage.sync.get({ rules: [] }, (data) => {
      const rules = data.rules;
      rules.push({ pattern, selector });

      chrome.storage.sync.set({ rules }, () => {
        const item = document.createElement("li");
        item.textContent = `Pattern: ${pattern}, Selector: ${selector}`;
        ruleList.appendChild(item);

        patternInput.value = "";
        selectorInput.value = "";
      });
    });
  });

  // Load existing rules
  chrome.storage.sync.get({ rules: [] }, (data) => {
    for (const rule of data.rules) {
      const item = document.createElement("li");
      item.textContent = `Pattern: ${rule.pattern}, Selector: ${rule.selector}`;
      ruleList.appendChild(item);
    }
  });
});
