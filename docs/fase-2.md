# Verificación de autenticación

## Ejecución local

```bash
docker compose up --build -d --wait
```

Visita `http://localhost:3000/login`. La cuenta de demostración es `lector@example.com` con contraseña `LecturaDemo123!`. Desde el formulario puedes ir a `/registro`, crear una cuenta y entrar al catálogo. El registro también inicia una sesión. Al cerrar sesión, entrar directamente a `/catalogo` debe redirigir a `/login`.

El catálogo es una página protegida en preparación. No se implementan operaciones de libros en esta fase.

## Pruebas de integración

Con Docker activo y las dependencias del backend instaladas:

```bash
cd backend
npm test
```

Las pruebas usan PostgreSQL real y los servicios HTTP de Docker. Crean una cuenta con correo aleatorio y la eliminan al terminar. Verifican registro, bcrypt, cookies, login, logout, errores 400/401/403/409, CORS, JWT inválidos y expirados, y redirección del catálogo. La cuenta de demostración no se modifica.

La configuración local predeterminada usa PostgreSQL en `localhost:5433`. Si personalizas puertos o credenciales, copia `.env.example` a `.env` y ajusta `DATABASE_URL`, `FRONTEND_ORIGIN`, `TEST_API_URL` y `JWT_SECRET` para que las pruebas apunten a los servicios correspondientes.

## Sesión y configuración

- `POST /auth/register`: nombre, email y password; devuelve el usuario público y establece la cookie.
- `POST /auth/login`: email y password; devuelve el usuario público y establece la cookie.
- `POST /auth/logout`: elimina la cookie; devuelve 204.
- `GET /auth/me`: devuelve el usuario autenticado; devuelve 401 sin sesión válida.
- Las peticiones POST requieren `Origin` igual a `FRONTEND_ORIGIN`. El navegador lo envía automáticamente; al probar con curl hay que añadir ese encabezado.
- La cookie `club_session` usa HttpOnly, SameSite=Lax y Path=/. El JWT expira en una hora de forma predeterminada. No se guarda en localStorage.
- El logout elimina la cookie del navegador. No hay lista de revocación de JWT; un token copiado previamente conserva su validez hasta expirar.
- El límite de intentos de registro/login usa memoria del proceso: 30 peticiones por IP cada 15 minutos. Reiniciar el backend lo reinicia.
- En producción se requieren `APP_ENV=production`, `SEED_DEMO=false`, `COOKIE_SECURE=true`, un `JWT_SECRET` propio y HTTPS. Los valores predeterminados del Compose son de demostración local.
- El cliente usa `NEXT_PUBLIC_API_URL`, incorporada durante la construcción de la imagen. Next.js verifica sesiones por `BACKEND_INTERNAL_URL=http://backend:4000` dentro de Docker.
- La configuración de cookies está pensada para frontend y backend en el mismo sitio, incluido localhost en diferentes puertos.

La revisión de dependencias y sus pendientes se encuentran en `security/npm-audit.md`.
