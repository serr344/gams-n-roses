from flask import Flask, jsonify, request
from flask_cors import CORS

from optimize_stage import GAMSPY_AVAILABLE, optimize

app = Flask(__name__)
CORS(app)


@app.get("/api/health")
def health():
    return jsonify({
        "ok": True,
        "gamspy_available": GAMSPY_AVAILABLE
    })


@app.post("/api/optimize")
def run_optimize():
    try:
        payload = request.get_json(silent=True)

        if not payload:
            return jsonify({
                "ok": False,
                "error": "JSON body is required."
            }), 400

        if "pos" not in payload or "data" not in payload:
            return jsonify({
                "ok": False,
                "error": "Invalid stage data format. Expected keys: pos, data."
            }), 400

        result = optimize(payload, prefer_gamspy=True)

        return jsonify({
            "ok": True,
            "result": result
        })

    except Exception as e:
        return jsonify({
            "ok": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)