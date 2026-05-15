# from flask import Flask, request, jsonify
# import openai

# openai.api_key = "YOUR_OPENAI_KEY"

# app = Flask(__name__)

# @app.route("/analyze", methods=["POST"])
# def analyze():
#     data = request.json
#     resume_text = data.get("resumeText", "")
#     # Example AI scoring
#     response = openai.ChatCompletion.create(
#         model="gpt-4",
#         messages=[{"role":"system","content":"You are a resume evaluator."},
#                   {"role":"user","content":f"Analyze this resume: {resume_text}"}]
#     )
#     result = response['choices'][0]['message']['content']
#     return jsonify({"analysis": result})

# if __name__ == "__main__":
#     app.run(port=5001)
