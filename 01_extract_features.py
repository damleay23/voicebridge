import cv2
import mediapipe as mp
import os
import numpy as np

os.makedirs("data_processed", exist_ok=True)

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.5
)

DATA_PATH = "dataset"

data = []
labels = []

print("Iniciando extracción de puntos clave...")

total_images = 0
valid_samples = 0

for label in os.listdir(DATA_PATH):
    label_path = os.path.join(DATA_PATH, label)

    if not os.path.isdir(label_path):
        continue

    print(f"\nProcesando seña: {label}")

    for img_name in os.listdir(label_path):
        img_path = os.path.join(label_path, img_name)
        img = cv2.imread(img_path)

        total_images += 1

        if img is None:
            continue

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = hands.process(img_rgb)

        # SOLO si detecta mano
        if results.multi_hand_landmarks:
            hand = results.multi_hand_landmarks[0]

            coords = []
            for lm in hand.landmark:
                coords.extend([lm.x, lm.y, lm.z])

            # validación extra
            if len(coords) == 63:
                data.append(coords)
                labels.append(label)
                valid_samples += 1

# Convertir a numpy
data = np.array(data)
labels = np.array(labels)

# Guardar dataset
np.save("data_processed/x_data.npy", data)
np.save("data_processed/y_labels.npy", labels)

print("\n==============================")
print("DATASET GENERADO")
print("Imágenes totales:", total_images)
print("Muestras válidas:", valid_samples)
print("Tasa de éxito:", round(valid_samples / max(total_images, 1) * 100, 2), "%")
print("==============================")