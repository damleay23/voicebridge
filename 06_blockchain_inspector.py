import asyncio
import json
import os
from anchorpy import Provider, Wallet, Program, Idl
from solana.rpc.async_api import AsyncClient
from solders.pubkey import Pubkey
from solders.keypair import Keypair

async def main():
    client = AsyncClient("http://localhost:8899")
    
    # 1. Cargar Llave
    keypair_path = os.path.expanduser("~/.config/solana/id.json")
    with open(keypair_path, "r") as f:
        secret = json.load(f)
        kp = Keypair.from_bytes(bytes(secret))
        wallet = Wallet(kp)

    provider = Provider(client, wallet)
    
    # 2. DEFINICIÓN MANUAL DEL IDL (Bypass al JSON de Anchor)
    # Esto define exactamente lo que Python necesita saber para leer tus datos
    minimal_idl_dict = {
        "version": "0.1.0",
        "name": "sign_language_rewards",
        "instructions": [],
        "accounts": [
            {
                "name": "PlayerStats",
                "type": {
                    "kind": "struct",
                    "fields": [
                        {"name": "username", "type": "string"},
                        {"name": "level", "type": "u64"},
                        {"name": "xp", "type": "u64"}
                    ]
                }
            }
        ]
    }
    
    idl = Idl.from_json(json.dumps(minimal_idl_dict))
    
    # 3. Dirección de tu programa (Confirmada en tus capturas)
    program_id = Pubkey.from_string("AELiTsxMv5D4W8bwJA4YvpsrGAc8wvcbskn7Cnsmec86")
    program = Program(idl, program_id, provider)

    print("\n" + "="*45)
    print("🔍 LEYENDO DATOS DIRECTAMENTE DE LA RED")
    print("="*45)
    
    try:
        # Intentamos obtener todas las cuentas que coincidan con la estructura PlayerStats
        all_players = await program.account["PlayerStats"].all()
        
        if not all_players:
            print("\n⚠️ No hay datos registrados en la blockchain todavía.")
            print("Pista: Sube de nivel en el juego para que se cree la cuenta.")
        else:
            print(f"\n✅ Se encontraron {len(all_players)} registros:\n")
            print(f"{'USUARIO':<20} | {'NIVEL':<8} | {'XP':<8}")
            print("-" * 45)
            for player in all_players:
                stats = player.account
                print(f"{stats.username:<20} | {stats.level:<8} | {stats.xp:<8}")
                
    except Exception as e:
        print(f"❌ Error al consultar cuentas: {e}")

    await client.close()

if __name__ == "__main__":
    asyncio.run(main())