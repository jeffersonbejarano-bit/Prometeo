/**
 * Crea proyectos Apps Script DEV y PROD con clasp y muestra los links.
 * Uso (desde la carpeta del simulador):
 *   npx clasp login
 *   node scripts/create-apps-script-projects.js
 */
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CLASP_JS = path.join(ROOT, 'node_modules', '@google', 'clasp', 'build', 'src', 'index.js');

function runClasp(args, cwd) {
  const result = spawnSync(process.execPath, [CLASP_JS, ...args], {
    cwd: cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const out = ((result.stdout || '') + (result.stderr || '')).trim();
  if (result.status !== 0) {
    throw new Error(
      'clasp ' + args.join(' ') + ' falló:\n' + (out || 'sin salida')
    );
  }
  return out;
}

function ensureLoggedIn() {
  if (!fs.existsSync(CLASP_JS)) {
    console.log('Instalando dependencias...');
    execFileSync('npm', ['install'], { cwd: ROOT, stdio: 'inherit', shell: true });
  }

  const result = spawnSync(process.execPath, [CLASP_JS, 'show-authorized-user', '--json'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  const text = (result.stdout || '') + (result.stderr || '');
  let loggedIn = false;
  try {
    loggedIn = JSON.parse(text).loggedIn === true;
  } catch (e) {
    loggedIn = /"loggedIn"\s*:\s*true/.test(text);
  }

  if (!loggedIn) {
    console.error('No hay sesión de Google con clasp.');
    console.error('Ejecuta primero:');
    console.error('  npx clasp login');
    console.error('Luego vuelve a correr:');
    console.error('  node scripts/create-apps-script-projects.js');
    process.exit(1);
  }
}

function readScriptId(dir) {
  const claspPath = path.join(dir, '.clasp.json');
  if (!fs.existsSync(claspPath)) return null;
  const data = JSON.parse(fs.readFileSync(claspPath, 'utf8'));
  return data.scriptId || null;
}

function createAndPush(envName, title) {
  const dir = path.join(ROOT, 'apps-script', envName);
  console.log('\n=== ' + envName.toUpperCase() + ': ' + title + ' ===');

  let scriptId = readScriptId(dir);

  if (scriptId) {
    console.log('Ya existe proyecto (.clasp.json). Solo se sube código.');
  } else {
    // Backup de nuestros archivos (clasp create puede regenerar stubs)
    const backupDir = path.join(dir, '.backup');
    fs.mkdirSync(backupDir, { recursive: true });
    for (const file of [
      'appsscript.json',
      'Code.gs',
      'Config.gs',
      'Orchestrator.gs',
      'Ticketing.gs'
    ]) {
      const src = path.join(dir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(backupDir, file));
      }
    }

    console.log('Creando proyecto en Google Apps Script...');
    const createOut = runClasp(
      ['create-script', '--title', title, '--type', 'standalone', '--rootDir', '.'],
      dir
    );
    console.log(createOut);

    // Restaurar nuestro código
    for (const file of fs.readdirSync(backupDir)) {
      fs.copyFileSync(path.join(backupDir, file), path.join(dir, file));
    }

    scriptId = readScriptId(dir);
    if (!scriptId) {
      throw new Error('No se encontró scriptId en ' + path.join(dir, '.clasp.json'));
    }
  }

  console.log('Subiendo código...');
  const pushOut = runClasp(['push', '--force'], dir);
  console.log(pushOut);

  const url = 'https://script.google.com/d/' + scriptId + '/edit';
  fs.writeFileSync(path.join(dir, 'SCRIPT_URL.txt'), url + '\n', 'utf8');
  console.log('LINK ' + envName.toUpperCase() + ': ' + url);
  return url;
}

function main() {
  ensureLoggedIn();
  const devUrl = createAndPush('dev', 'Prometeo Aprobologia DEV');
  const prodUrl = createAndPush('prod', 'Prometeo Aprobologia PROD');

  console.log('\n==============================');
  console.log('PROYECTOS CREADOS');
  console.log('DEV:  ' + devUrl);
  console.log('PROD: ' + prodUrl);
  console.log('==============================');
  console.log('Copia estos links al PRD.');
}

main();
