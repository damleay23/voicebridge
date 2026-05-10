import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
import pickle

# Cargar modelo H5
model = tf.keras.models.load_model("models/model_sign.h5")

# Cargar nombres de clases
with open("models/classes.pkl", "rb") as f:
    classes = pickle.load(f)

# MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

mp_draw = mp.solutions.drawing_utils

# Cámara
cap = cv2.VideoCapture(0)

print("Iniciando cámara...")

while True:
    success, frame = cap.read()

    if not success:
        break

    # Espejo
    frame = cv2.flip(frame, 1)

    # Convertir RGB
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Procesar mano
    results = hands.process(rgb)

    if results.multi_hand_landmarks:

        hand_landmarks = results.multi_hand_landmarks[0]

        # Dibujar landmarks
        mp_draw.draw_landmarks(
            frame,
            hand_landmarks,
            mp_hands.HAND_CONNECTIONS
        )

        data = []

        # Extraer coordenadas
        for lm in hand_landmarks.landmark:
            data.extend([lm.x, lm.y, lm.z])

        # Predicción
        if len(data) == 63:

            prediction = model.predict(
                np.array([data]),
                verbose=0
            )

            index = np.argmax(prediction)
            confidence = np.max(prediction)

            label = classes[index]

            text = f"{label} ({confidence:.2f})"

            # Mostrar texto
            cv2.putText(
                frame,
                text,
                (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )

    # Mostrar ventana
    cv2.imshow("SignLink IA", frame)

    # ESC para salir
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()