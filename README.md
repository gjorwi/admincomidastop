# comidasTop · Administración

Panel general en Next.js, JavaScript y Tailwind CSS conectado exclusivamente a la API real.

## Incluye

- Resumen de solicitudes, negocios, productos, usuarios y calificaciones reales.
- Revisión y aprobación de solicitudes de negocios.
- Creación automática de la cuenta de negocio al aprobar una solicitud.
- Control de estado, verificación, suspensión y premium de negocios.
- Administración de usuarios.
- Publicación mensual de rankings y reconocimientos.
- Visualización de capturas históricas.
- Sin datos de demostración ni acciones simuladas.

## Requisitos

1. API funcionando con MongoDB Atlas.
2. Base preparada con `npm run bootstrap` en `../api`.
3. Cuenta administradora creada desde `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `api/.env`.
4. `API_URL` apuntando a la URL base del API, incluyendo `/api`.

En Vercel configura `API_URL` como variable de entorno (sin prefijo `NEXT_PUBLIC_`) y vuelve a desplegar. Next.js la usa en un rewrite del servidor; el navegador solo llama al mismo dominio del panel mediante `/api`.

## Ejecutar

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev -- --port 3002
```

Abre `http://localhost:3002`.

Inicia sesión con las credenciales administradoras configuradas en `api/.env`.

## Comportamiento

- Todas las pantallas consultan la API real.
- Si la API no está disponible, el panel muestra el error en lugar de datos simulados.
- Si no hay sesión válida, se muestra la pantalla de acceso restringido.
- Los estados vacíos se muestran cuando la base aún no tiene solicitudes, negocios o rankings.

## Verificación

```bash
npm run lint
npm run build
```
