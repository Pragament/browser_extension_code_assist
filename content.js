console.log("💡 content.js running...", window.location.href);
console.log("📌 Frame:", window.top === window ? "Top" : "Iframe");

if (window.top !== window) {
  console.log("⛔ Skipping iframe frame");
} else {
  // ✅ Main logic inside here
  chrome.storage.sync.get(["rules"], (data) => {
    const rules = data.rules || [];

    // 🔍 Try to find a rule that matches the current page URL
    const matchedRule = rules.find(rule => {
      try {
        const regex = new RegExp(rule.pattern);
        return regex.test(window.location.href);
      } catch (err) {
        console.error("❌ Invalid regex:", rule.pattern);
        return false;
      }
    });

    if (!matchedRule) {
      console.log("ℹ️ No matching rule found. Skipping injection.");
      return;
    }

    console.log("✅ Matched rule:", matchedRule);

    // ✅ Inject sidebar UI
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
          display: flex;
          flex-direction: column;
        }
        #chatContainer {
          flex: 1;
          overflow-y: auto;
          margin-top: 10px;
          background: #f9f9f9;
          padding: 10px;
          border-radius: 4px;
        }
        .chat-bubble {
          margin: 5px 0;
          padding: 10px;
          border-radius: 8px;
          max-width: 90%;
          clear: both;
          white-space: pre-wrap;
        }
        .user {
          background: #007bff;
          color: white;
          align-self: flex-end;
          margin-left: auto;
        }
        .bot {
          background: #e0e0e0;
          align-self: flex-start;
          margin-right: auto;
        }
        textarea {
          width: 100%;
          margin-top: 10px;
          resize: vertical;
        }
        button {
          margin-top: 5px;
          padding: 6px 12px;
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: #218838;
        }
      </style>

      <h3>Code Chat</h3>
      <div id="chatContainer"></div>
      <textarea id="userPrompt" placeholder="Ask a question..."></textarea>
      <button id="askBtn">Ask</button>
    `;
    document.body.appendChild(sidebar);

    const askBtn = document.getElementById("askBtn");
    const userPrompt = document.getElementById("userPrompt");
    const chatContainer = document.getElementById("chatContainer");

    let extractedCode = "";
    let codeAlreadyShown = false;

    function extractCode() {
      try {
        const selector = matchedRule.selector;
        if (selector && document.querySelector(selector)) {
          const codeElement = document.querySelector(selector);
          extractedCode = codeElement?.value || codeElement?.innerText || "⚠️ No code found via selector";
        } else {
          // 🔍 Try iframe fallback
          const iframe = document.querySelector("#iframeResult") || document.querySelector("iframe");
          if (!iframe) throw new Error("No iframe found");
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) throw new Error("Cannot access iframe document");
          extractedCode = iframeDoc.documentElement.outerHTML || "⚠️ No HTML found in iframe";
        }

        console.log("✅ Code extracted:", extractedCode);

        if (!codeAlreadyShown) {
          const botMsg = document.createElement("div");
          botMsg.className = "chat-bubble bot";
          botMsg.textContent = extractedCode;
          chatContainer.appendChild(botMsg);
          chatContainer.scrollTop = chatContainer.scrollHeight;
          codeAlreadyShown = true;
        }
      } catch (err) {
        console.error("❌ Extraction failed:", err);
        const errMsg = document.createElement("div");
        errMsg.className = "chat-bubble bot";
        errMsg.textContent = "❌ Error extracting code: " + err.message;
        chatContainer.appendChild(errMsg);
      }
    }

    // 🚀 On Ask Button Click
    askBtn?.addEventListener("click", async () => {
      const prompt = userPrompt.value.trim();
      extractCode();

      if (!prompt) return;

      const userMsg = document.createElement("div");
      userMsg.className = "chat-bubble user";
      userMsg.textContent = prompt;
      chatContainer.appendChild(userMsg);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      userPrompt.value = "";

      try {
        const res = await fetch("http://localhost:5001/api/ask", {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, code: extractedCode })
        });

        if (!res.ok) throw new Error(`Server responded with status ${res.status}`);

        const data = await res.json();
        const botMsg = document.createElement("div");
        botMsg.className = "chat-bubble bot";
        botMsg.textContent = data.response;
        chatContainer.appendChild(botMsg);
        chatContainer.scrollTop = chatContainer.scrollHeight;
      } catch (err) {
        console.error("❌ API error:", err);
        const botMsg = document.createElement("div");
        botMsg.className = "chat-bubble bot";
        botMsg.textContent = "❌ Error: Failed to contact server.";
        chatContainer.appendChild(botMsg);
      }
    });
  });
}
