# Resultado del despliegue AWS

Verificado el 14 de octubre de 2026, hora de Ciudad de México (últimas comprobaciones: 15 de octubre UTC).

## Estado observado

La aplicación responde públicamente en https://tractoandespruebatecnica.duckdns.org. El acceso SSH como `ubuntu` funciona mediante la clave local, sin copiarla al servidor ni al repositorio.

- Instancia Ubuntu 24.04.4 amd64, t2.small, 1 vCPU, aproximadamente 2 GB RAM y disco de 30 GB.
- DNS observado: `18.232.63.20`, coincidente con la instancia.
- Docker Engine 29.9.1 y Docker Compose 5.6.0 instalados desde el repositorio oficial; servicio Docker habilitado.
- Imágenes de aplicación: etiqueta `aws-20261014-1`. Construcciones locales correctas; ante pérdida de paquetes e interrupción de la transferencia, construcción secuencial en EC2 con los mismos Dockerfiles y archivos de bloqueo, también correcta. No se necesitó swap.
- Caddy 2.11.7, frontend, backend y PostgreSQL saludables después del despliegue y de recrearlos.
- Solo Caddy publica TCP 80/443. Pruebas externas sin acceso a 3000, 4000, 5432 ni 5433; PostgreSQL no publica puerto del host.
- Secretos aleatorios exclusivos en `.env.prod`, permisos 0600. Cookies Secure, HttpOnly, SameSite=Lax; origen HTTPS exacto y seed desactivado.
- Migración inicial aplicada automáticamente; después de recrear, ninguna migración pendiente. No se borraron volúmenes de producción ni datos existentes.

## HTTPS y verificaciones públicas

Certificado válido de Let's Encrypt, emisor YE2, para el dominio solicitado. Cadena validada con OpenSSL y solicitudes HTTPS sin desactivar la verificación. Vigencia observada: 14 de octubre de 2026, 23:01:24 UTC, a 12 de enero de 2027, 23:01:23 UTC. La renovación queda gestionada por Caddy y su volumen persistente.

Se verificaron satisfactoriamente:

- HTTP redirige a HTTPS con 308; raíz accesible y navegación al login.
- `/health` responde 200; `/auth/me` anónimo responde 401 y `/catalogo` anónimo redirige al login.
- Registro, login y logout mediante API pública y navegador.
- Cookie Secure, HttpOnly y SameSite=Lax; eliminación de cookie al cerrar sesión.
- Rechazo 403 de una escritura con Origin no autorizado.
- Acceso SSR al catálogo y conservación de sesión al recargar en el navegador.
- Creación, listado, consulta y edición de un libro ficticio mediante la API pública.
- Recreación de los cuatro contenedores con `--force-recreate`, sin eliminar volúmenes: mismo libro editado y sesiones todavía disponibles.
- Eliminación exclusiva del libro creado para el recorrido; consulta posterior devuelve 404. El catálogo queda sin ese registro de prueba.
- Logs revisados de los cuatro servicios sin errores críticos pendientes. PostgreSQL reutiliza la base existente; autenticación sin errores del proxy o del limitador.

Caddy conserva avisos informativos sobre el buffer UDP de QUIC y sobre HTTP/2/3 omitidos en el listener HTTP de redirección. No afectan las comprobaciones HTTPS por TCP; no se publicó UDP 443.

El primer intento HTTPS coincidió con la emisión inicial y devolvió un error TLS transitorio. Caddy obtuvo el certificado y las comprobaciones posteriores fueron correctas, incluida la recreación sin nueva emisión.

Se crearon dos cuentas ficticias de verificación, sin datos personales ni credenciales de demostración publicadas. No se ejecutaron pruebas SQL destructivas contra esta base.

## Verificación aislada y respaldo

Las 24 pruebas automatizadas de integración pasaron: 24 aprobadas, cero fallos. Se ejecutaron en una pila local independiente, con su propia base y volumen, usando puertos 3100/4100/5434. Solo esa pila desechable se retiró al terminar. El entorno local habitual se conservó.

Compilaciones Docker y comprobación de tipos correctas. El generador de secretos se comprobó con un directorio temporal: modo 0600, rechazo de sobrescritura y validación del Compose. `git diff --check` no presenta errores.

Se creó en EC2 `backups/verificacion-inicial.dump`, modo 0600, mediante `pg_dump -Fc`; `pg_restore --list` pudo leerlo. No se restauró encima de la base pública. Este archivo permanece privado en el servidor. Falta establecer una copia cifrada fuera de EC2 y una rutina de respaldo según las necesidades de operación; no se configuró un servicio externo ni una tarea programada.

## Pendientes y límites

- **SSH/22:** el usuario indicó que limitaría la regla a su IP. El cambio todavía no está confirmado. Revisar EC2 → Seguridad → todos los grupos asociados → Reglas de entrada: TCP 22 solo desde la IP autorizada `/32`, conservando 80/443 públicos. La conexión SSH funciona, pero eso no demuestra el alcance de la regla. Sin rol IAM no se pudo consultar el grupo mediante API desde la instancia.
- **IP automática:** la consola confirma que no hay Elastic IP. Si se detiene/inicia EC2 puede cambiar la IP pública y será necesario actualizar DuckDNS. No se asignaron otros recursos AWS. Véase [la documentación de direcciones de EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-instance-addressing.html).
- **Next.js:** continúa un paquete moderado en 15.5.26, sin avisos altos o críticos; el backend reporta cero. El parche 15.5.27 continúa devolviendo E404 en el registro consultado. Riesgo y capturas en [security/npm-audit.md](security/npm-audit.md). No se forzó un cambio mayor.
- Registro público y catálogo compartido entre todas las cuentas: utilizar solamente datos ficticios. Sin roles ni revocación central de JWT; el logout elimina la cookie del navegador.
- La verificación demuestra el funcionamiento observado, no constituye una prueba de carga, disponibilidad permanente ni recuperación completa de desastres.

## Cambios y operación

Se añadieron `docker-compose.prod.yml`, `deploy/Caddyfile`, `.env.prod.example`, `scripts/create-production-env.py`, la guía y este informe. Se actualizaron README, exclusiones de secretos, ejemplo local, informes de auditoría y la opción de un único salto de proxy en Express. Se conservaron el Compose local, la identidad visual y las funcionalidades de autenticación y CRUD.

La [guía de despliegue](despliegue-aws.md) contiene variables, arranque, parada, reinicio, logs, backups, actualización y reversión. No se realizaron operaciones de escritura en Git.

Mensaje sugerido de commit:

```text
chore: configura y verifica despliegue AWS con Caddy y HTTPS
```
