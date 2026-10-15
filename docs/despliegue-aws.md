# Despliegue en AWS EC2 con Caddy

## Arquitectura

El archivo `docker-compose.prod.yml` es independiente del Compose local. No deben combinarse con `-f docker-compose.yml -f docker-compose.prod.yml`: el local publica puertos que no corresponden a producción.

Solo Caddy publica TCP 80 y 443. Envía `/auth`, `/auth/*`, `/books`, `/books/*` y `/health` a Express conservando el path completo. El resto llega a Next.js. No se utiliza `/api` ni `handle_path`.

Frontend, backend y PostgreSQL se comunican por la red interna. PostgreSQL tiene volumen propio; Caddy conserva certificados y configuración en otros dos volúmenes. No se publican 3000, 4000, 5432 ni 5433. Los cuatro servicios tienen healthchecks, reinicio automático y rotación de logs.

## Requisitos y red

La instancia usada tiene Ubuntu 24.04, arquitectura amd64, 1 vCPU, aproximadamente 2 GB de RAM y disco de 30 GB. Para esta capacidad se recomienda construir las imágenes en la computadora de desarrollo y transferirlas por SSH. Una compilación de Next.js en EC2 puede agotar memoria; para compilar allí conviene más RAM y margen de disco.

Instala Docker Engine y Compose mediante [el repositorio oficial para Ubuntu](https://docs.docker.com/engine/install/ubuntu/). No es necesario añadir `ubuntu` al grupo docker: los comandos siguientes usan sudo.

En los grupos de seguridad asociados a EC2:

- TCP 80 y 443 desde internet, para HTTP, HTTPS y validación del certificado.
- TCP 22 únicamente desde tu IP pública autorizada con `/32`; evita `0.0.0.0/0`.
- Sin reglas públicas para 3000, 4000, 5432 ni 5433.

Revisa todas las reglas y todos los grupos asociados, no solo uno. El firewall del host y las ACL de la subred también pueden bloquear tráfico. Las publicaciones Docker no deben depender exclusivamente de UFW.

El dominio `tractoandespruebatecnica.duckdns.org` debe resolver a la IP pública de EC2. En la revisión inicial ambos resolvían a `18.232.63.20`. La instancia usa una IP automática, no Elastic IP: puede cambiar al detener/iniciar EC2. Un reinicio de contenedores no cambia esa IP. Si cambia, actualiza DuckDNS con la IP nueva y espera la propagación antes de verificar HTTPS. Alternativamente, asigna y asocia una Elastic IP desde AWS y apunta DuckDNS a ella, considerando sus costes. No se asignaron recursos adicionales de AWS automáticamente.

Caddy obtiene y renueva el certificado y redirige HTTP a HTTPS. Necesita DNS correcto, entrada 80/443 y salida a los servidores ACME. No sustituyas la comprobación del certificado por `curl -k`. Conserva `caddy_data` para no solicitar certificados innecesariamente en cada arranque. Véase [HTTPS automático de Caddy](https://caddyserver.com/docs/automatic-https).

## Acceso SSH

La clave `tracto.pem` debe permanecer fuera del repositorio y con permisos 0400 o 0600. Ejemplo desde la computadora local:

```bash
ssh -i ~/Descargas/tracto.pem ubuntu@ec2-18-232-63-20.compute-1.amazonaws.com
```

No copies su contenido al chat ni al servidor. La clave solo se usa localmente para autenticar SSH. Verifica la identidad del host si SSH avisa que cambió su clave; no desactives esa comprobación.

## Preparación de archivos y secretos

Coloca el código actual, incluyendo los cambios todavía no confirmados que desees desplegar, en `/home/ubuntu/Prueba-Tecnica`. Una copia de trabajo mediante archivo tar o scp evita depender de que los cambios ya estén en GitHub. Excluye `.git`, `node_modules`, `.next`, `dist`, archivos privados de entorno y claves.

En EC2:

```bash
cd /home/ubuntu/Prueba-Tecnica
python3 scripts/create-production-env.py tractoandespruebatecnica.duckdns.org aws-20261014-1
```

El generador crea `.env.prod` con modo 0600 y secretos aleatorios hexadecimales. Se niega a sobrescribir un archivo existente para no rotar credenciales accidentalmente. Guarda una copia privada fuera del repositorio. `.env.prod.example` documenta el formato; no uses sus marcadores como contraseñas reales.

Variables privadas o específicas del despliegue:

- `DOMAIN`: nombre DNS, sin esquema ni ruta.
- `IMAGE_TAG`: etiqueta de las dos imágenes que van a ejecutarse.
- `POSTGRES_USER`, `POSTGRES_DB`: rol y base iniciales.
- `POSTGRES_PASSWORD`: contraseña privada. El generador usa hexadecimal para que sea compatible con la URL de conexión.
- `JWT_SECRET`: secreto exclusivo de producción, distinto del valor local de demostración.
- `SESSION_TTL_SECONDS`: duración de sesión, 3600 por defecto.

El Compose fija `APP_ENV=production`, `COOKIE_SECURE=true`, `SEED_DEMO=false` y `TRUST_PROXY_HOPS=1`. Construye `FRONTEND_ORIGIN=https://DOMAIN` y la conexión PostgreSQL interna. Nunca activa el usuario de demostración en esta base.

No ejecutes `docker compose config` sin `--quiet` al compartir resultados: su salida expandida contiene secretos. No publiques `.env.prod`, backups ni claves.

## Construcción y transferencia recomendadas

Desde la raíz del proyecto en una máquina amd64 con Docker:

```bash
docker build -t club-lectura-backend:aws-20261014-1 backend
docker build --build-arg NEXT_PUBLIC_API_URL=https://tractoandespruebatecnica.duckdns.org -t club-lectura-frontend:aws-20261014-1 frontend
```

`NEXT_PUBLIC_API_URL` se incorpora durante el build: no basta con cambiarla en un contenedor ya construido. Solo contiene la dirección pública, nunca secretos. El backend no requiere secretos al compilar.

Transfiere las imágenes usando una tubería con control de fallos:

```bash
set -o pipefail
docker save club-lectura-backend:aws-20261014-1 club-lectura-frontend:aws-20261014-1 | gzip -1 | ssh -i ~/Descargas/tracto.pem ubuntu@ec2-18-232-63-20.compute-1.amazonaws.com 'gzip -d | sudo docker load'
```

Si construyes en otra arquitectura, produce imágenes para linux/amd64 con buildx. Caddy y PostgreSQL se descargan de sus imágenes oficiales al arrancar. Evita sobrescribir etiquetas de una versión anterior: se necesitan para revertir.

Si la subida de imágenes falla y hay memoria disponible en EC2, se puede construir allí de forma secuencial, usando los mismos Dockerfiles y archivos de bloqueo:

```bash
sudo docker build -t club-lectura-backend:aws-20261014-1 backend
sudo docker build --build-arg NEXT_PUBLIC_API_URL=https://tractoandespruebatecnica.duckdns.org -t club-lectura-frontend:aws-20261014-1 frontend
```

Supervisa `free -h` durante la compilación; evita ejecutar ambos builds a la vez en esta instancia. Esta alternativa no requiere publicar los puertos internos.

## Arranque y operación

Desde el directorio del proyecto en EC2, define esta función en la sesión SSH:

```bash
dc() { sudo docker compose --env-file .env.prod -f docker-compose.prod.yml "$@"; }
dc config --quiet
dc up -d --no-build --wait --wait-timeout 180
dc ps
```

El backend aplica `prisma migrate deploy`, omite el seed y arranca. El frontend espera su salud y Caddy espera a ambos servicios. Next.js verifica la sesión con `BACKEND_INTERNAL_URL=http://backend:4000`; el navegador llama al mismo dominio HTTPS público.

Operaciones habituales:

```bash
dc logs --tail=100 caddy backend frontend postgres
dc logs -f --tail=50 backend
dc restart backend frontend
dc stop
dc up -d --no-build --wait
```

`stop` detiene sin retirar contenedores. `down`, si se usa, retira contenedores y red, pero no debe acompañarse de `-v`. No ejecutes `docker volume prune` ni elimines volúmenes de producción. El reinicio automático también depende de que Docker esté habilitado en systemd.

## Cookies y proxy

El navegador usa cookies Secure, HttpOnly, SameSite=Lax y Path=/. Login, registro y CRUD usan el mismo dominio; CORS y Origin se comparan con su origen HTTPS exacto. Next.js reenvía la cookie al backend por la red Docker para validar las páginas protegidas.

Express confía en un único salto del proxy únicamente cuando `TRUST_PROXY_HOPS=1`. Esto permite que el limitador de autenticación identifique al visitante detrás de Caddy. Es seguro bajo esta topología porque el backend no publica un puerto externo. El entorno local conserva el valor 0.

El registro es público y todas las cuentas autenticadas administran el mismo catálogo. Es una demostración sin roles: no almacenes datos personales, sensibles ni libros reales que necesites preservar frente a otros visitantes. El logout borra la cookie; no revoca una copia previa del JWT antes de su expiración.

## Backups de PostgreSQL

En EC2, con la función `dc` definida:

```bash
umask 077
mkdir -p backups
backup_file="backups/club-$(date -u +%Y%m%dT%H%M%SZ).dump"
dc exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup_file"
test -s "$backup_file"
dc exec -T postgres pg_restore --list < "$backup_file"
```

Comprueba el estado de salida del dump antes de considerarlo un respaldo válido. Conserva copias privadas cifradas fuera de EC2: el volumen persistente y una copia en el mismo disco no protegen ante la pérdida de la instancia o del volumen. `backups/` está excluido de Git.

Para ensayar recuperación, restaura en una base y volumen independientes, nunca sobre el catálogo público durante una prueba. La comprobación `pg_restore --list` valida que el archivo se puede leer, pero no sustituye un ensayo completo de recuperación.

No cambies `POSTGRES_PASSWORD` en `.env.prod` esperando rotar una base existente: las variables de PostgreSQL inicializan un volumen vacío. La rotación de un rol existente necesita un procedimiento SQL coordinado con la aplicación.

## Actualización y reversión

1. Haz un backup y guarda copias privadas de la configuración vigente y `.env.prod`, sin sobrescribirlas.
2. Elige una etiqueta nueva, construye imágenes desde el código revisado y prueba el cambio en una base aislada.
3. Transfiere las imágenes y los archivos de configuración modificados. Conserva las imágenes anteriores.
4. Cambia solo `IMAGE_TAG` en `.env.prod`, sin regenerar secretos ni modificar el nombre de proyecto/volúmenes. Si cambió el dominio, reconstruye el frontend y revisa DNS.
5. Ejecuta `dc config --quiet` y `dc up -d --no-build --wait --wait-timeout 180`.
6. Comprueba HTTPS, salud, sesión y catálogo. Si cambió el Caddyfile, recrea Caddy o recarga su configuración de manera controlada.

Para revertir la aplicación, restaura la etiqueta anterior y los archivos de configuración correspondientes, y ejecuta el mismo `up`. Las migraciones ya aplicadas no se revierten al cambiar imágenes. Si una migración no es compatible con la versión anterior, la reversión necesita una migración correctiva o restauración planificada del backup, con atención a datos nuevos. No borres la base ni uses `migrate reset` como estrategia de rollback.

## Verificaciones y pendientes

Las 24 pruebas de integración se ejecutan en una pila local aislada, nunca contra la base pública. En producción solo se hace un recorrido de humo con una cuenta y un libro ficticios creados para verificar el despliegue; la eliminación se limita a ese libro.

Verifica DNS, certificado sin excepciones, redirección HTTP, registro/login/logout, Secure/HttpOnly, recarga, rutas protegidas, CRUD, salud, logs y persistencia al recrear contenedores sin retirar volúmenes.

El aviso moderado de Next.js 15.5.26 continúa documentado en `security/npm-audit.md`. La consulta del parche compatible 15.5.27 devolvió E404, por lo que no se forzó una migración mayor para este despliegue. La topología dinámica sin catch-all limita las condiciones descritas, pero no sustituye el parche. Debe reevaluarse antes de un uso real distinto de esta demostración.

El resultado observado del despliegue y las comprobaciones pendientes de AWS se registran en `despliegue-aws-resultados.md`.
