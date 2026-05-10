import os
import json
import pandas as pd

def mostrar_ranking():
    path = "players"
    if not os.path.exists(path):
        print("No hay jugadores registrados.")
        return

    players_data = []
    for file in os.listdir(path):
        if file.endswith(".json"):
            with open(f"{path}/{file}", "r") as f:
                players_data.append(json.load(f))

    # Crear una tabla bonita en consola
    df = pd.DataFrame(players_data)
    if not df.empty:
        df = df.sort_values(by=["level", "xp"], ascending=False)
        print("\n🏆 RANKING DE APRENDIZAJE 🏆")
        print(df[["username", "level", "xp"]].to_string(index=False))
    else:
        print("Aún no hay datos de progreso.")

if __name__ == "__main__":
    mostrar_ranking()