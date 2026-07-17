# Apps Script — Prometeo Aprobología

Proyectos Google Chat Bot alineados al Lucidchart (consulta y gestión de NID).

| Entorno | Carpeta | Título |
|---------|---------|--------|
| DEV | `apps-script/dev` | Prometeo Aprobologia DEV |
| PROD | `apps-script/prod` | Prometeo Aprobologia PROD |

## Crear los proyectos en Google (una sola vez)

1. Abre y activa la API de Apps Script:  
   https://script.google.com/home/usersettings

2. En la terminal (PowerShell), desde la carpeta del simulador:

```powershell
cd $HOME\Desktop\simulador-ticketbot
npm install
npx clasp login
node scripts\create-apps-script-projects.js
```

O con npm:

```powershell
npm run clasp:create
```

3. El script imprime los links Dev y Prod. Pégalos en el PRD.

## Comandos útiles

```bash
# Subir cambios a DEV
npm run clasp:push:dev

# Subir cambios a PROD
npm run clasp:push:prod

# Abrir en el navegador
npm run clasp:open:dev
npm run clasp:open:prod
```

## Conectar a Google Chat

En cada proyecto Apps Script (Dev y Prod):

1. Implementar → Nueva implementación → Complemento  
   (o configurar Chat API / Google Chat app según el flujo de tu Workspace)
2. Usar el deployment de **DEV** en el space de pruebas
3. Usar el deployment de **PROD** en el space comercial real
