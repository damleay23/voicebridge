import os
import json

# Pedir nombre de usuario (en minúsculas para evitar errores)
user_name = input("Introduce tu nombre de usuario: ").strip().lower()

# Asegurar que la carpeta existe
os.makedirs("players", exist_ok=True)

player_file = f"players/{user_name}.json"

if not os.path.exists(player_file):
    # Crear nuevo perfil local
    data = {
        "username": user_name,
        "xp": 0,
        "level": 1
    }
    with open(player_file, "w") as f:
        json.dump(data, f)
    print(f"✅ ¡Bienvenido, {user_name}! Perfil creado.")
else:
    print(f"👋 Hola de nuevo, {user_name}.")

# Cargar y mostrar datos
with open(player_file, "r") as f:
    player = json.load(f)

print("Datos del jugador:", player)