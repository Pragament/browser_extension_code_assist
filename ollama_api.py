import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return jsonify({"message": "Flask API is running! Use /api/ask for queries."})

@app.route("/api/ask", methods=["POST"])
def ask():
    print("📩 Received POST /api/ask")
    data = request.get_json()
    print("🧾 Received data:", data)

    prompt = data.get("prompt", "")
    code = data.get("code", "")
    combined_prompt = f"{prompt}\n\n[CODE]\n{code}\n[/CODE]"

    try:
        print("💬 Sending prompt to Ollama...")
        res = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "tinyllama",  # Updated to tinyllama
                "messages": [{"role": "user", "content": combined_prompt}],
                "stream": False
            },
            timeout=500
        )

        print("📦 Raw response:", res.text)

        # Fix: Load only the first valid JSON object
        response_json = json.loads(res.text.strip().splitlines()[0])

        answer = response_json["message"]["content"]
        return jsonify({"response": answer})

    except Exception as e:
        print(f"❌ Error communicating with Ollama: {e}")
        return jsonify({"error": "Failed to get response from Ollama"}), 500

if __name__ == "__main__":
    print("🚀 Starting Ollama API Flask server on http://localhost:5001")
    app.run(host="0.0.0.0", port=5001)