import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
import pickle
import json
import os
import random

# =========================
# LOGIN LOCAL
# =========================
user_name = input("Introduce tu nombre de usuario: ").strip().lower()
os.makedirs("players", exist_ok=True)
player_file = f"players/{user_name}.json"

if not os.path.exists(player_file):
    progress = {"username": user_name, "xp": 0, "level": 1}
    with open(player_file, "w") as f:
        json.dump(progress, f)
else:
    with open(player_file, "r") as f:
        progress = json.load(f)

xp = progress["xp"]
level = progress["level"]

# =========================
# CARGAR IA (MODELO H5)
# =========================
model = tf.keras.models.load_model("models/model_sign.h5")
with open("models/classes.pkl", "rb") as f:
    classes = pickle.load(f)

target_letter = random.choice(classes)

# =========================
# CONFIGURACIÓN MEDIAPIPE
# =========================
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.5)
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)
last_prediction = ""
cooldown = 0

print(f"Iniciando aprendizaje para: {user_name.upper()}")

while True:
    success, frame = cap.read()
    if not success: break
    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb)

    if results.multi_hand_landmarks:
        hand_landmarks = results.multi_hand_landmarks[0]
        mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

        data = []
        for lm in hand_landmarks.landmark:
            data.extend([lm.x, lm.y, lm.z])

        if len(data) == 63:
            prediction = model.predict(np.array([data]), verbose=0)
            index = np.argmax(prediction)
            confidence = np.max(prediction)
            label = classes[index]

            # Mostrar predicción actual
            cv2.putText(frame, f"{label} ({int(confidence*100)}%)", (20, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            # Lógica de acierto
            if confidence >= 0.75 and label == target_letter:
                if label != last_prediction or cooldown <= 0:
                    xp += 10
                    print(f"🎯 +10 XP | Total: {xp}")
                    last_prediction = label
                    cooldown = 30 # Evitar múltiples registros rápidos

                    if xp >= 100:
                        level += 1
                        xp = 0
                        print(f"🚀 ¡NIVEL {level}!")

                    target_letter = random.choice(classes)
                    
                    # Guardar progreso
                    with open(player_file, "w") as f:
                        json.dump({"username": user_name, "xp": xp, "level": level}, f)

    if cooldown > 0: cooldown -= 1

    # INTERFAZ DE USUARIO (UI)
    cv2.putText(frame, f"PLAYER: {user_name.upper()}", (20, 100), 1, 0.7, (0, 255, 255), 2)
    cv2.putText(frame, f"HAZ LA LETRA: {target_letter}", (20, 140), 1, 1, (255, 255, 255), 2)
    cv2.putText(frame, f"NIVEL: {level} | XP: {xp}/100", (20, 200), 1, 1, (255, 0, 0), 2)

    cv2.imshow("SignLink - Modo Aprendizaje", frame)
    if cv2.waitKey(1) & 0xFF == 27: break

cap.release()
cv2.destroyAllWindows()