# A fake Gemini for the browser test: always answers with one coach verdict.
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
ANSWER = {"verdict": "needs_work", "score": 41, "matchedSounds": ["m", "e", "r", "o"],
          "mismatchedSounds": ["the word नाम (nām) was missing"],
          "feedback": "You said the first word well, but “nām” was missing. Say it slowly: me-ro NĀM ... ho.",
          "encouragement": "Nice clear start!"}
class H(BaseHTTPRequestHandler):
    def do_POST(self):
        self.rfile.read(int(self.headers.get("Content-Length", 0)))
        body = json.dumps({"candidates": [{"content": {"parts": [{"text": json.dumps(ANSWER)}]}}]}).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(body)
    def log_message(self, *a): pass
HTTPServer(("127.0.0.1", 5099), H).serve_forever()
