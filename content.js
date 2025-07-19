console.log("\ud83d\udca1 content.js running...", window.location.href);
console.log("\ud83d\udccc Frame:", window.top === window ? "Top" : "Iframe");

if (window.top !== window) {
  console.log("\u26d4 Skipping iframe frame");
} else {
  chrome.storage.sync.get(["rules", "maxAttempts"], (data) => {
    const rules = data.rules || [];
    const maxAttempts = parseInt(data.maxAttempts) || 5;
    console.log("Loaded maxAttempts:", maxAttempts);

    const matchedRule = rules.find(rule => {
      try {
        const regex = new RegExp(rule.pattern);
        return regex.test(window.location.href);
      } catch (err) {
        console.error("\u274c Invalid regex:", rule.pattern);
        return false;
      }
    });

    if (!matchedRule) {
      console.log("\u2139\ufe0f No matching rule found. Skipping injection.");
      return;
    }

    console.log("\u2705 Matched rule:", matchedRule);

    const sidebar = document.createElement("div");
    sidebar.id = "code-sidebar";
    sidebar.innerHTML = `
      <style>
        #code-sidebar { position: fixed; top: 0; right: 0; width: 400px; height: 100%; background: white; border-left: 1px solid #ccc; box-shadow: -2px 0 5px rgba(0,0,0,0.1); z-index: 9999; font-family: Arial, sans-serif; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; }
        #chatContainer { flex: 1; overflow-y: auto; margin-top: 10px; background: #f9f9f9; padding: 10px; border-radius: 4px; }
        .chat-bubble { margin: 5px 0; padding: 10px; border-radius: 8px; max-width: 90%; clear: both; white-space: pre-wrap; }
        .user { background: #007bff; color: white; align-self: flex-end; margin-left: auto; }
        .bot { background: #e0e0e0; align-self: flex-start; margin-right: auto; }
        textarea { width: 100%; margin-top: 10px; resize: vertical; }
        button { margin-top: 5px; padding: 6px 12px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #218838; }
        #autoCorrectBtn { background-color: #dc3545; margin-left: 5px; }
        #autoCorrectBtn:hover { background-color: #c82333; }

         .spinner {
    width: 18px;
    height: 18px;
    border: 3px solid #ccc;
    border-top: 3px solid #4CAF50; /* green spinner */
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
      </style>
  
      <h3>Code Chat</h3>
      <div id="chatContainer"></div>
      <textarea id="userPrompt" placeholder="Enter a manual error here (optional)..."></textarea>
      <div style="display: flex; align-items: center; margin-top: 5px;">
  <button id="askBtn">Ask</button>
  <div id="sharedLoading" style="display: none; margin: 10px 10px;">
  <div class="spinner"></div>
</div>

  <button id="autoCorrectBtn">Auto Correct</button>
</div>

    `;
    document.body.appendChild(sidebar);

    const askBtn = document.getElementById("askBtn");
    const userPrompt = document.getElementById("userPrompt");
    const chatContainer = document.getElementById("chatContainer");
    const autoCorrectBtn = document.getElementById("autoCorrectBtn");

    let extractedCode = "";
    let codeAlreadyShown = false;
    let isProcessing = false;

    let consoleErrors = [];

    function setupErrorCapture() {
      const originalConsoleError = console.error;
      console.error = function (...args) {
        const msg = args.join(" ");

        // Filter out CSP warnings or "unsafe-eval" messages
        if (
          msg.includes("Content Security Policy") ||
          msg.includes("unsafe-eval") ||
          msg.toLowerCase().includes("warning")
        ) {
          return;
        }

        if (!consoleErrors.includes(msg)) {
          consoleErrors.push(msg);
          console.log("🔴 Captured console.error:", msg);
        }
        originalConsoleError.apply(console, args);
      };

      window.onerror = function (message, source, lineno, colno, error) {
        if (
          String(message).includes("Content Security Policy") ||
          String(message).includes("unsafe-eval") ||
          String(message).toLowerCase().includes("warning")
        ) {
          return;
        }

        const fullMsg = `${message} at ${source}:${lineno}:${colno}`;
        if (!consoleErrors.includes(fullMsg)) {
          consoleErrors.push(fullMsg);
          console.log("❌ Uncaught Error:", fullMsg);
        }
      };

      window.addEventListener("unhandledrejection", function (event) {
        const msg = `⚠️ Unhandled Promise Rejection: ${event.reason}`;
        if (!consoleErrors.includes(msg)) {
          consoleErrors.push(msg);
          console.log(msg);
        }
      });

      window.addEventListener("error", function (event) {
        const target = event.target || event.srcElement;

        // Resource load errors (ignore CSP-related ones)
        if (
          target && (target.src || target.href) &&
          !(target.src || "").includes("unsafe-eval")
        ) {
          const msg = `📦 Resource failed: ${target.src || target.href}`;
          if (!consoleErrors.includes(msg)) {
            consoleErrors.push(msg);
            console.log(msg);
          }
        }
      }, true);
    }

    setupErrorCapture();

    function captureConsoleErrors() {
      const currentErrors = [...consoleErrors];
      console.log("🔍 Current errors:", currentErrors);
      return currentErrors;
    }

    function extractAndApplyCode() {
      try {
        const selector = matchedRule.selector;
        let codeElement;
        let iframeDoc = null;

        const iframe = document.querySelector("#iframeResult") || document.querySelector("iframe");
        if (iframe) {
          iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        }

        if (selector && (codeElement = document.querySelector(selector))) {
          extractedCode = codeElement?.value || codeElement?.innerText || codeElement.outerHTML || "⚠️ No code found via selector";
        } else if (iframeDoc) {
          codeElement = iframeDoc;
          extractedCode = iframeDoc.documentElement.outerHTML || "⚠️ No HTML found in iframe";
        } else {
          extractedCode = document.documentElement.outerHTML || "⚠️ No document content found";
        }

        const liveButton = iframeDoc?.querySelector("button[onclick]") || document.querySelector("button[onclick]");
        if (liveButton) {
          extractedCode = extractedCode.replace(/onclick="[^"]*"/, `onclick="${liveButton.getAttribute('onclick')}"`);
        }

        if (liveButton) {
          const onclickCode = liveButton.getAttribute("onclick");
          if (onclickCode && !consoleErrors.length) {
            try {
              const context = iframeDoc ? iframe.contentWindow : window;
              context.eval(onclickCode);
            } catch (e) {
              const errorMsg = `${e.message} at ${liveButton.baseURI}:${e.lineNumber || 1}:${e.columnNumber || 1}`;
              if (!consoleErrors.includes(errorMsg)) {
                consoleErrors.push(errorMsg);
                console.log("🔍 Captured error (eval):", errorMsg);
              }
            }
          }
        }

        console.log("✅ Code extracted (live DOM):", extractedCode);

        if (!codeAlreadyShown) {
          const botMsg = document.createElement("div");
          botMsg.className = "chat-bubble bot";
          botMsg.textContent = extractedCode;
          chatContainer.appendChild(botMsg);
          chatContainer.scrollTop = chatContainer.scrollHeight;
          codeAlreadyShown = true;
        }

        if (codeElement && codeElement !== document && codeElement !== iframeDoc?.documentElement) {
          if (codeElement.value !== undefined) {
            codeElement.value = extractedCode;
          } else if (codeElement.innerText !== undefined) {
            codeElement.innerText = extractedCode;
          }
        }
      } catch (err) {
        console.error("❌ Extraction failed:", err);
        const errMsg = document.createElement("div");
        errMsg.className = "chat-bubble bot";
        errMsg.textContent = "❌ Error extracting code: " + err.message;
        chatContainer.appendChild(errMsg);
      }
    }

    async function handleAutoCorrect(attempt = 1) {
      if (attempt === 1) {
        askBtn.disabled = true;
        autoCorrectBtn.disabled = true;
        document.getElementById("sharedLoading").style.display = "inline";
      }

      if (attempt > maxAttempts) {
        askBtn.disabled = false;
        autoCorrectBtn.disabled = false;
        document.getElementById("sharedLoading").style.display = "none";

        const msg = document.createElement("div");
        msg.className = "chat-bubble bot";
        msg.textContent = `❌ Auto correction failed after ${maxAttempts} attempts.`;
        chatContainer.appendChild(msg);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        isProcessing = false;
        return;
      }
      extractAndApplyCode();
      const errors = captureConsoleErrors();
      console.log("User prompt value:", userPrompt.value.trim());

      let errorMsg = userPrompt.value.trim();
      if (!errorMsg && errors.length) {
        errorMsg = "Captured Errors:\n" + errors.map((e, i) => `#${i + 1}: ${e}`).join("\n");
      }

      if (!errorMsg) {
        const msg = document.createElement("div");
        msg.className = "chat-bubble bot";
        msg.textContent = "✅ No errors detected. Correction complete.";
        chatContainer.appendChild(msg);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        isProcessing = false;
        document.getElementById("autoLoading").style.display = "none";
        return;
      }

      const userMsg = document.createElement("div");
      userMsg.className = "chat-bubble user";
      userMsg.textContent = `Auto Correct Attempt ${attempt}: Fixing errors - ${errorMsg}`;
      chatContainer.appendChild(userMsg);
      chatContainer.scrollTop = chatContainer.scrollHeight;

      try {
        const res = await fetchApi({ prompt: `Fix the following JavaScript errors: ${errorMsg}\n\n[CODE]\n${extractedCode}\n[/CODE]`, code: extractedCode });
        const data = await res.json();
        const botMsg = document.createElement("div");
        botMsg.className = "chat-bubble bot";
        botMsg.textContent = data.response || "No fix provided.";
        chatContainer.appendChild(botMsg);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        extractedCode = data.response || extractedCode;
        extractAndApplyCode();
        await handleAutoCorrect(attempt + 1);
      } catch (err) {
        const botMsg = document.createElement("div");
        botMsg.className = "chat-bubble bot";
        botMsg.textContent = `❌ Error during auto correction: ${err.message}`;
        chatContainer.appendChild(botMsg);
        chatContainer.scrollTop = chatContainer.scrollHeight;
      } finally {
        userPrompt.value = "";
        askBtn.disabled = false;
        autoCorrectBtn.disabled = false;
        document.getElementById("sharedLoading").style.display = "none";
        isProcessing = false;
      }
    }

    async function fetchApi(data) {
      const rule = (await chrome.storage.sync.get(["rules"])).rules.find(rule => {
        try {
          const regex = new RegExp(rule.pattern);
          return regex.test(window.location.href);
        } catch (err) {
          console.error("❌ Invalid regex:", rule.pattern);
          return false;
        }
      });

      if (!rule) {
        throw new Error("No matching rule found.");
      }

      const url = rule.apiType === "python" && rule.pythonApiUrl ? rule.pythonApiUrl + "/api/ask" : "http://localhost:5001/api/ask";
      const res = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
      return res;
    }

    askBtn.addEventListener("click", async () => {
      const prompt = userPrompt.value.trim();
      extractAndApplyCode();
      if (!prompt) return;

      askBtn.disabled = true;
      autoCorrectBtn.disabled = true;
      document.getElementById("sharedLoading").style.display = "inline";

      const userMsg = document.createElement("div");
      userMsg.className = "chat-bubble user";
      userMsg.textContent = prompt;
      chatContainer.appendChild(userMsg);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      userPrompt.value = "";

      try {
        const res = await fetchApi({ prompt, code: extractedCode });
        const data = await res.json();
        const botMsg = document.createElement("div");
        botMsg.className = "chat-bubble bot";
        botMsg.textContent = data.response;
        chatContainer.appendChild(botMsg);
        chatContainer.scrollTop = chatContainer.scrollHeight;
      } catch (err) {
        const botMsg = document.createElement("div");
        botMsg.className = "chat-bubble bot";
        botMsg.textContent = "❌ Error: Failed to contact server.";
        chatContainer.appendChild(botMsg);
      } finally {
        askBtn.disabled = false;
        autoCorrectBtn.disabled = false;
        document.getElementById("sharedLoading").style.display = "none";
      }
    });

    autoCorrectBtn.addEventListener("click", async () => {
      if (isProcessing) return;
      isProcessing = true;
      await handleAutoCorrect();
    });
  });
}
