import os
import re
import secrets
import sys
from pathlib import Path

domain = sys.argv[1] if len(sys.argv) > 1 else "tractoandespruebatecnica.duckdns.org"
image_tag = sys.argv[2] if len(sys.argv) > 2 else "aws-20261014-1"
if not re.fullmatch(r"[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?", domain):
    raise SystemExit("Dominio inválido")
if not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_.-]{0,100}", image_tag):
    raise SystemExit("Etiqueta de imagen inválida")

target = Path(".env.prod")
content = "\n".join([
    f"DOMAIN={domain}",
    f"IMAGE_TAG={image_tag}",
    "POSTGRES_USER=club_app",
    "POSTGRES_DB=club_lectura",
    f"POSTGRES_PASSWORD={secrets.token_hex(32)}",
    f"JWT_SECRET={secrets.token_hex(48)}",
    "SESSION_TTL_SECONDS=3600",
    "",
])

try:
    descriptor = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
except FileExistsError:
    raise SystemExit(".env.prod ya existe; no se modificó ni se rotaron secretos")
with os.fdopen(descriptor, "w") as stream:
    stream.write(content)
print(".env.prod creado con permisos 0600; guarda una copia privada fuera del repositorio")
