# Code Extractor Chrome Extension

A Chrome extension that extracts code from web pages, injects a chat sidebar, and allows users to query the code using an AI model via a local API server.

## Overview

This project combines a Chrome extension with a Flask-based API server to provide an interactive code analysis tool. The extension extracts code from specified web pages (e.g., W3Schools try-it pages) and uses an AI model (e.g., TinyLLaMA) hosted via Ollama to respond to user prompts. Users can manage rules for code extraction and choose between a default Prompt API or a custom Python API.

## Features
- Extracts code from web pages based on user-defined URL patterns and CSS selectors.
- Injects a chat sidebar for interacting with extracted code.
- Supports two API modes: Prompt API (default local Ollama server) and Python API (custom URL).
- Manages rules via the options page.
- Integrates with Ollama for AI-powered code explanations.

## Prerequisites
- **Python 3.x**
- **Node.js** (for potential future enhancements, though not currently required)
- **Chrome Browser**
- **Ollama** (for running the AI model)
- **Git** (for version control, optional)

## Installation
1.Ollama pull tinyllama

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


### 1. Clone the Repository
```bash
git clone https://github.com/your-username/code-extractor.git
cd code-extractor