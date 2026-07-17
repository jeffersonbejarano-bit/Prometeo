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
 * Alternativa:
 *   npm run clasp:create
 *
 * Requisitos previos:
 *   - Activar Apps Script API:
 *     https://script.google.com/home/usersettings
 */

const { spawnSync, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
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

const CLASPIGNORE = [
  '# Generado por create-apps-script-projects.js',
  '.backup/**',
  'SCRIPT_URL.txt',
  '**/.DS_Store'
].join('\n') + '\n';

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
  if (!fs.existsSync(CLASP_ENTRY)) {
    fail(
      'Tras npm install no aparece clasp en:\n  ' +
        CLASP_ENTRY +
        '\nRevisa package.json (devDependency @google/clasp).'
    );
  }
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

function readClaspConfig(projectDir) {
  const claspPath = path.join(projectDir, '.clasp.json');
  if (!fs.existsSync(claspPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(claspPath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function readScriptId(projectDir) {
  const data = readClaspConfig(projectDir);
  return data && data.scriptId ? data.scriptId : null;
}

/**
 * Evita que clasp suba duplicados desde subcarpetas (.backup, etc.).
 */
function normalizeClaspConfig(projectDir) {
  const claspPath = path.join(projectDir, '.clasp.json');
  const data = readClaspConfig(projectDir);
  if (!data || !data.scriptId) return;

  data.rootDir = data.rootDir || '.';
  data.skipSubdirectories = true;
  if (!Array.isArray(data.scriptExtensions)) {
    data.scriptExtensions = ['.gs', '.js'];
  }
  if (!Array.isArray(data.jsonExtensions)) {
    data.jsonExtensions = ['.json'];
  }

  fs.writeFileSync(claspPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function ensureClaspIgnore(projectDir) {
  fs.writeFileSync(path.join(projectDir, '.claspignore'), CLASPIGNORE, 'utf8');
}

/**
 * Backup FUERA del rootDir de clasp (temp del SO).
 * Tener .backup/ dentro del proyecto hace que clasp intente subir
 * dos appsscript.json → error "A file with this name already exists: appsscript".
 */
function backupSources(projectDir, env) {
  const backupDir = path.join(
    os.tmpdir(),
    'prometeo-clasp-backup',
    env + '-' + Date.now()
  );
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
  for (const file of SOURCE_FILES) {
    const src = path.join(backupDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(projectDir, file));
    }
  }
}

function removeDirSafe(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  fs.rmSync(dirPath, { recursive: true, force: true });
}

/**
 * Limpia restos locales que provocarían el conflicto de appsscript.
 */
function sanitizeProjectDir(projectDir) {
  removeDirSafe(path.join(projectDir, '.backup'));

  // clasp a veces deja stubs con otras extensiones
  const stray = ['Code.js', 'appsscript.json.bak'];
  for (const file of stray) {
    const p = path.join(projectDir, file);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  ensureClaspIgnore(projectDir);
  normalizeClaspConfig(projectDir);
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
  let backupDir = null;

  if (scriptId) {
    log('Proyecto ya existe (scriptId: ' + scriptId + '). Solo se sube código.');
  } else {
    log('Creando proyecto en Google Apps Script...');
    backupDir = backupSources(dir, env);

    const createOut = runClasp(
      [
        'create-script',
        '--title',
        title,
        '--type',
        'standalone',
        '--rootDir',
        '.'
      ],
      dir
    );
    if (createOut) log(createOut);

    scriptId = readScriptId(dir);
    if (!scriptId) {
      fail(
        'No se generó .clasp.json con scriptId en apps-script/' +
          env +
          '.\nRevisa que la Apps Script API esté activa:\n' +
          'https://script.google.com/home/usersettings'
      );
    }

    // Sincroniza el manifiesto remoto (appsscript) antes de sobrescribir local
    log('Sincronizando proyecto remoto (clasp pull)...');
    try {
      const pullOut = runClasp(['pull', '--force'], dir);
      if (pullOut) log(pullOut);
    } catch (err) {
      log('Aviso: clasp pull falló (se continúa con restore local): ' + err.message);
    }

    // Restaura nuestro código/manifesto por encima de los stubs de clasp
    restoreSources(backupDir, dir);
  }

  sanitizeProjectDir(dir);

  // Asegura que el manifiesto local es el nuestro (no el stub de create/pull)
  if (backupDir) {
    restoreSources(backupDir, dir);
    removeDirSafe(backupDir);
  } else {
    // Re-run: no tocamos fuentes; solo push limpio
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
