"""
Exports model weights as a simple JSON file that can be loaded
directly in the browser without the TF.js model loader.

Output: frontend/public/model/weights.json
"""
import tensorflow as tf
import numpy as np
import pickle
import json
import os

os.makedirs("frontend/public/model", exist_ok=True)

print("Loading model...")
model = tf.keras.models.load_model("models/model_sign.h5")

with open("models/classes.pkl", "rb") as f:
    classes = pickle.load(f)

# Extract weights layer by layer
layers_data = []
for layer in model.layers:
    weights = layer.get_weights()
    if not weights:
        continue
    layer_info = {
        "name": layer.name,
        "weights": [w.astype(np.float32).tolist() for w in weights]
    }
    layers_data.append(layer_info)
    print(f"  {layer.name}: {[list(w.shape) for w in weights]}")

output = {
    "classes": [str(c) for c in classes],
    "layers": layers_data
}

out_path = "frontend/public/model/weights.json"
with open(out_path, "w") as f:
    json.dump(output, f, separators=(',', ':'))  # compact, no spaces

size_kb = os.path.getsize(out_path) / 1024
print(f"\nSaved to {out_path} ({size_kb:.1f} KB)")
print(f"Classes: {[str(c) for c in classes]}")
