# server/ml_models/predict_final.py
import sys
import json
import joblib
import numpy as np
import os

try:
    print("🔍 Loading model...", file=sys.stderr)
    model_path = os.path.join(os.path.dirname(__file__), 'final_exam_predictor.pkl')
    model = joblib.load(model_path)
    print("✅ Model loaded", file=sys.stderr)

    raw_input = sys.stdin.read()
    print(f"📥 Raw input from stdin: {raw_input}", file=sys.stderr)

    input_data = json.loads(raw_input)
    internal_marks = input_data.get('internalMarks', [])
    code = input_data.get('code', 'UNKNOWN')

    if not internal_marks:
        print("[]")
        sys.exit()

    X = [
        [
            item.get('internal1', 0),
            item.get('internal2', 0),
            item.get('model', 0),
            item.get('assignment1', 0),
            item.get('assignment2', 0)
        ]
        for item in internal_marks
    ]

    predicted = model.predict(np.array(X)).tolist()

    print(json.dumps(predicted))  # JSON output to Node.js

except Exception as e:
    print(f"❌ Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
