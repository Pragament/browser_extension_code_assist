console.log("💡 content.js running...", window.location.href);
console.log("📌 Frame:", window.top === window ? "Top" : "Iframe");

const rules = [
  { host: "www.w3schools.com", path: "/js/tryit.asp" }
];

const matched = rules.find(rule => {
  return window.location.hostname.includes(rule.host) &&
         window.location.pathname.includes(rule.path);
});

if (matched && window.top === window) {
  console.log("✅ Rule matched:", matched);
  console.log("🚀 Injecting sidebar...");

  const sidebar = document.createElement("div");
  sidebar.id = "code-sidebar";
  sidebar.innerHTML = `
    <style>
      #code-sidebar {
        position: fixed;
        top: 0;
        right: 0;
        width: 400px;
        height: 100%;
        background: white;
        border-left: 1px solid #ccc;
        box-shadow: -2px 0 5px rgba(0,0,0,0.1);
        z-index: 9999;
        font-family: Arial, sans-serif;
        padding: 10px;
        overflow-y: auto;
      }
      #code-sidebar h3 {
        margin-top: 0;
      }
      #code-sidebar pre {
        background: #f4f4f4;
        padding: 10px;
        border-radius: 4px;
        white-space: pre-wrap;
      }
    </style>
    <h3>Code Extractor</h3>
    <button id="extractBtn">Extract</button>
    <pre id="result">Click Extract to fetch code.</pre>
  `;

  document.body.appendChild(sidebar);

  // ✅ No message passing. Directly extract from iframe
  const extractBtn = document.getElementById("extractBtn");
  const resultEl = document.getElementById("result");

  if (extractBtn && resultEl) {
  extractBtn.addEventListener("click", () => {
  try {
    const iframe = document.getElementById("iframeResult");
    if (!iframe) throw new Error("iframeResult not found");

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error("Cannot access iframe document");

    const code = iframeDoc.documentElement.outerHTML || "No HTML found";
    console.log("✅ Extracted code:", code);
    resultEl.textContent = code;
  } catch (err) {
    console.error("❌ Extraction failed:", err);
    resultEl.textContent = "Error: " + err.message;
  }
});
  } else {
    console.warn("⚠️ Sidebar buttons not found for event binding.");
  }
}
