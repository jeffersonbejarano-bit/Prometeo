/**
 * Prometeo Aprobología
 * Crea los proyectos de Google Apps Script (DEV y PROD) con clasp,
 * sube el código y imprime los links del editor.
 *
 * Uso (PowerShell), desde la carpeta del simulador:
 *
 *   npm install
 *   npx clasp login
 *   node scripts\create-apps-script-projects.js
 *
 * Requisitos previos:
 *   - Activar Apps Script API:
 *     https://script.google.com/home/usersettings
 */

const { spawnSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CLASP_ENTRY = path.join(
  ROOT,
  'node_modules',
  '@google',
  'clasp',
  'build',
  'src',
  'index.js'
);

const PROJECTS = [
  {
    env: 'dev',
    title: 'Prometeo Aprobologia DEV',
    dir: path.join(ROOT, 'apps-script', 'dev')
  },
  {
    env: 'prod',
    title: 'Prometeo Aprobologia PROD',
    dir: path.join(ROOT, 'apps-script', 'prod')
  }
];

const SOURCE_FILES = [
  'appsscript.json',
  'Code.gs',
  'Config.gs',
  'Orchestrator.gs',
  'Ticketing.gs'
];

function log(msg) {
  console.log(msg);
}

function fail(msg) {
  console.error('\nERROR: ' + msg + '\n');
  process.exit(1);
}

function runClasp(args, cwd) {
  if (!fs.existsSync(CLASP_ENTRY)) {
    fail(
      'No está instalado @google/clasp.\n' +
        'Ejecuta primero: npm install'
    );
  }

  const result = spawnSync(process.execPath, [CLASP_ENTRY, ...args], {
    cwd: cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const out = ((result.stdout || '') + (result.stderr || '')).trim();
  if (result.status !== 0) {
    throw new Error(
      'Falló: clasp ' + args.join(' ') + '\n' + (out || '(sin salida)')
    );
  }
  return out;
}

function ensureNpmInstalled() {
  if (fs.existsSync(CLASP_ENTRY)) return;
  log('Instalando dependencias (npm install)...');
  execFileSync('npm', ['install'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true
  });
}

function ensureLoggedIn() {
  const result = spawnSync(
    process.execPath,
    [CLASP_ENTRY, 'show-authorized-user', '--json'],
    { cwd: ROOT, encoding: 'utf8' }
  );

  const text = ((result.stdout || '') + (result.stderr || '')).trim();
  let loggedIn = false;
  try {
    loggedIn = JSON.parse(text).loggedIn === true;
  } catch (e) {
    loggedIn = /"loggedIn"\s*:\s*true/.test(text);
  }

  if (!loggedIn) {
    fail(
      'No hay sesión de Google con clasp.\n' +
        'Ejecuta:\n' +
        '  npx clasp login\n' +
        'Luego vuelve a correr:\n' +
        '  node scripts\\create-apps-script-projects.js'
    );
  }

  log('Sesión clasp: OK');
}

function readScriptId(projectDir) {
  const claspPath = path.join(projectDir, '.clasp.json');
  if (!fs.existsSync(claspPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(claspPath, 'utf8'));
    return data.scriptId || null;
  } catch (e) {
    return null;
  }
}

function backupSources(projectDir) {
  const backupDir = path.join(projectDir, '.backup');
  fs.mkdirSync(backupDir, { recursive: true });
  for (const file of SOURCE_FILES) {
    const src = path.join(projectDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(backupDir, file));
    }
  }
  return backupDir;
}

function restoreSources(backupDir, projectDir) {
  if (!fs.existsSync(backupDir)) return;
  for (const file of fs.readdirSync(backupDir)) {
    fs.copyFileSync(path.join(backupDir, file), path.join(projectDir, file));
  }
}

function validateProjectDir(projectDir, env) {
  if (!fs.existsSync(projectDir)) {
    fail(
      'No existe la carpeta del entorno ' +
        env +
        ':\n  ' +
        projectDir +
        '\nAsegúrate de tener apps-script/dev y apps-script/prod.'
    );
  }
  for (const file of SOURCE_FILES) {
    if (!fs.existsSync(path.join(projectDir, file))) {
      fail('Falta el archivo ' + file + ' en apps-script/' + env);
    }
  }
}

function createAndPush(project) {
  const { env, title, dir } = project;
  log('\n========================================');
  log(env.toUpperCase() + ' → ' + title);
  log('Carpeta: ' + dir);
  log('========================================');

  validateProjectDir(dir, env);

  let scriptId = readScriptId(dir);

  if (scriptId) {
    log('Proyecto ya existe (scriptId: ' + scriptId + '). Solo se sube código.');
  } else {
    log('Creando proyecto en Google Apps Script...');
    const backupDir = backupSources(dir);

    const createOut = runClasp(
      ['create-script', '--title', title, '--type', 'standalone', '--rootDir', '.'],
      dir
    );
    if (createOut) log(createOut);

    // clasp puede regenerar stubs; restauramos nuestro código
    restoreSources(backupDir, dir);

    scriptId = readScriptId(dir);
    if (!scriptId) {
      fail(
        'No se generó .clasp.json con scriptId en apps-script/' +
          env +
          '.\nRevisa que la Apps Script API esté activa:\n' +
          'https://script.google.com/home/usersettings'
      );
    }
  }

  log('Subiendo código con clasp push...');
  const pushOut = runClasp(['push', '--force'], dir);
  if (pushOut) log(pushOut);

  const url = 'https://script.google.com/d/' + scriptId + '/edit';
  fs.writeFileSync(path.join(dir, 'SCRIPT_URL.txt'), url + '\n', 'utf8');
  log('LINK ' + env.toUpperCase() + ': ' + url);
  return url;
}

function main() {
  log('Prometeo — creación de Apps Script DEV + PROD');
  log('Root: ' + ROOT);

  ensureNpmInstalled();
  ensureLoggedIn();

  const urls = {};
  for (const project of PROJECTS) {
    urls[project.env] = createAndPush(project);
  }

  log('\n==============================');
  log('LISTO — copia estos links:');
  log('DEV:  ' + urls.dev);
  log('PROD: ' + urls.prod);
  log('==============================');
  log('Pégalos en el PRD (AppScript Dev / Prod).');
}

main();
