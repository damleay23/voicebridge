"""
WebSocket server para VoiceBridge ↔ ProyectoSenas

Nuevo pipeline (sin imagen):
  Browser: cámara → MediaPipe JS → 63 landmarks → WS → aquí
  Aquí: recibe landmarks → TensorFlow predict → devuelve predicción

Uso:
    python server.py

Requiere:
    pip install websockets tensorflow numpy
    (opencv y mediapipe ya NO son necesarios en el servidor)
"""

import asyncio
import json
import pickle
from collections import deque

import numpy as np
import tensorflow as tf
import websockets

# ── Configuración ──────────────────────────────────────────────────────────────
HOST = "0.0.0.0"
PORT = 8000

# Umbral de confianza para considerar una predicción válida
CONFIDENCE_THRESHOLD = 0.75

# Cuántas predicciones consecutivas iguales se necesitan para "confirmar"
CONFIRM_STREAK = 5

# ── Cargar modelo y clases ─────────────────────────────────────────────────────
print("Cargando modelo...")
model = tf.keras.models.load_model("models/model_sign.h5")

with open("models/classes.pkl", "rb") as f:
    classes = pickle.load(f)

print(f"Modelo cargado. Clases: {list(classes)}")


def predict_landmarks(flat: list[float]) -> dict:
    """
    Recibe los 63 valores de landmarks (21 puntos × x,y,z)
    y devuelve la predicción del modelo.
    """
    arr = np.array([flat], dtype=np.float32)
    prediction = model.predict(arr, verbose=0)
    index = int(np.argmax(prediction))
    confidence = float(np.max(prediction))
    label = str(classes[index])
    return {"prediction": label, "confidence": round(confidence, 4)}


# ── Manejador de conexión WebSocket ───────────────────────────────────────────
async def handler(websocket):
    client = websocket.remote_address
    print(f"[+] Cliente conectado: {client}")

    streak_deque: deque[str] = deque(maxlen=CONFIRM_STREAK)

    try:
        async for message in websocket:
            try:
                data = json.loads(message)

                # ── Sin mano detectada ─────────────────────────────
                if not data.get("hand_detected", True):
                    streak_deque.clear()
                    await websocket.send(json.dumps({"hand_detected": False}))
                    continue

                # ── Landmarks recibidos ────────────────────────────
                flat = data.get("landmarks")
                if not flat or len(flat) != 63:
                    await websocket.send(json.dumps({"hand_detected": False}))
                    continue

                # Predicción (rápida — solo forward pass del modelo)
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    None, predict_landmarks, flat
                )

                label      = result["prediction"]
                confidence = result["confidence"]

                # Lógica de confirmación
                confirmed = False
                if confidence >= CONFIDENCE_THRESHOLD:
                    streak_deque.append(label)
                    if (
                        len(streak_deque) == CONFIRM_STREAK
                        and len(set(streak_deque)) == 1
                    ):
                        confirmed = True
                        streak_deque.clear()
                else:
                    streak_deque.clear()

                await websocket.send(json.dumps({
                    "hand_detected": True,
                    "prediction":   label,
                    "confidence":   confidence,
                    "confirmed":    confirmed,
                }))

            except (json.JSONDecodeError, KeyError, Exception) as e:
                print(f"[!] Error: {e}")
                continue

    except websockets.exceptions.ConnectionClosedOK:
        pass
    except websockets.exceptions.ConnectionClosedError as e:
        print(f"[-] Conexión cerrada con error: {e}")
    finally:
        print(f"[-] Cliente desconectado: {client}")


# ── Main ───────────────────────────────────────────────────────────────────────
async def main():
    print(f"Servidor WebSocket escuchando en ws://{HOST}:{PORT}")
    print("Presiona Ctrl+C para detener.\n")
    async with websockets.serve(handler, HOST, PORT):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
