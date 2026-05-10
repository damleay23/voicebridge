import tensorflow as tf
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle
import os

os.makedirs("models", exist_ok=True)

# Cargar dataset
x = np.load('data_processed/x_data.npy')
y = np.load('data_processed/y_labels.npy')

# Codificar etiquetas
encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y)

# Guardar clases
with open('models/classes.pkl', 'wb') as f:
    pickle.dump(encoder.classes_, f)

# One hot
y_onehot = tf.keras.utils.to_categorical(y_encoded)

# Separar datos
x_train, x_test, y_train, y_test = train_test_split(
    x,
    y_onehot,
    test_size=0.2,
    random_state=42
)

# Modelo compatible con TFLite
model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(63,)),

    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.3),

    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dropout(0.2),

    tf.keras.layers.Dense(
        len(encoder.classes_),
        activation='softmax'
    )
])

# Compilar
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Entrenar
print("Entrenando modelo...")

model.fit(
    x_train,
    y_train,
    epochs=80,
    batch_size=32,
    validation_data=(x_test, y_test)
)

# Guardar modelo
model.save("models/model_sign.h5")

print("Modelo guardado correctamente")