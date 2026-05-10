"""
Exports model_sign.h5 weights to a format loadable by TensorFlow.js
without needing the tensorflowjs pip package.

Output: frontend/public/model/
  - model.json   (architecture + weight manifest)
  - weights.bin  (raw float32 weights)
"""

import tensorflow as tf
import numpy as np
import pickle
import json
import struct
import os

os.makedirs("frontend/public/model", exist_ok=True)

# ── Load model & classes ───────────────────────────────────────────────────────
print("Loading model...")
model = tf.keras.models.load_model("models/model_sign.h5")

with open("models/classes.pkl", "rb") as f:
    classes = pickle.load(f)

print(f"Classes ({len(classes)}): {list(classes)}")
print(f"Input shape: {model.input_shape}")
print(f"Output shape: {model.output_shape}")

# ── Extract weights ────────────────────────────────────────────────────────────
# Collect all weight tensors in order
weight_specs = []
all_weights_bytes = bytearray()
byte_offset = 0

for layer in model.layers:
    weights = layer.get_weights()
    if not weights:
        continue
    for i, w in enumerate(weights):
        w_f32 = w.astype(np.float32)
        w_bytes = w_f32.tobytes()
        weight_specs.append({
            "name": f"{layer.name}/{layer.weights[i].name.split(':')[0]}",
            "shape": list(w.shape),
            "dtype": "float32",
            "byteOffset": byte_offset,
            "byteLength": len(w_bytes),
        })
        all_weights_bytes.extend(w_bytes)
        byte_offset += len(w_bytes)
        print(f"  {layer.name} weight[{i}]: shape={w.shape}, bytes={len(w_bytes)}")

# Write binary weights file
with open("frontend/public/model/weights.bin", "wb") as f:
    f.write(all_weights_bytes)
print(f"\nWeights written: {len(all_weights_bytes)} bytes -> frontend/public/model/weights.bin")

# ── Build model.json ───────────────────────────────────────────────────────────
# Build layer configs for TF.js format
layers_config = []
for layer in model.layers:
    cfg = layer.get_config()
    class_name = layer.__class__.__name__
    layers_config.append({
        "class_name": class_name,
        "config": cfg,
        "name": layer.name,
        "inbound_nodes": []
    })

model_json = {
    "format": "layers-model",
    "generatedBy": "export_model_tfjs.py",
    "convertedBy": "manual",
    "modelTopology": {
        "class_name": "Sequential",
        "config": {
            "name": model.name,
            "layers": layers_config
        },
        "keras_version": "2.x",
        "backend": "tensorflow"
    },
    "weightsManifest": [
        {
            "paths": ["weights.bin"],
            "weights": weight_specs
        }
    ],
    # Save classes so the frontend can decode predictions
    "userDefinedMetadata": {
        "classes": [str(c) for c in classes]
    }
}

with open("frontend/public/model/model.json", "w") as f:
    json.dump(model_json, f, indent=2)

print("model.json written -> frontend/public/model/model.json")
print("\nDone! Files ready for TensorFlow.js")
print(f"Classes: {[str(c) for c in classes]}")
