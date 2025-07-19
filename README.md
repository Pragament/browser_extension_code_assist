# 🧠 Code Extractor Sidebar Chrome Extension

This Chrome extension injects a sidebar into W3Schools TryIt editor pages. It automatically extracts the code from the iframe and interacts with a local Python API powered by [Ollama](https://ollama.com/) (e.g., CodeLlama or similar) to provide intelligent code suggestions or explanations.

---

## 🚀 Features

- Injects a floating sidebar in W3Schools TryIt editor.
- Extracts HTML/CSS/JS code from the live preview iframe.
- Sends the extracted code and your prompt to a Python backend running Ollama.
- Displays AI-generated responses (code help, suggestions, explanations) in the sidebar.

---

## 🧩 Chrome Extension Setup

1. Clone or extract the contents of this repository.
2. Visit `chrome://extensions/` in Chrome.
3. Enable **Developer Mode** (top right).
4. Click **Load unpacked** and select the folder `code-extractor-extension`.

---

## ⚙️ Python Backend Setup

1. Make sure [Ollama](https://ollama.com/) is installed and running locally.
2. Run the backend server:

```bash
pip install -r requirements.txt
python ollama_api.py
