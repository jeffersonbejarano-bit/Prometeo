const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Los 9 procesos del SOP, en el orden exacto de evaluación
const PROCESSES = [
  'sellers tarea de documentos',
  'idm revision de documentos',
  'remo comite de remodelaciones',
  'idm checks automatico',
  'idm pricing manual',
  'idm pricing automatico',
  'idm hesh',
  'idm ensamble de precio',
  'idm aprobologia'
];

const STATUSES = ['COMPLETED', 'IN_PROGRESS', 'REJECTED'];

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function formatDate() {
  return new Date().toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function buildStatusData(status) {
  if (status === 'COMPLETED') {
    return {
      executionDate: formatDate(),
      approvalComment: 'Aprobado automáticamente por el orquestador. Cumple políticas de liberación.'
    };
  }

  if (status === 'IN_PROGRESS') {
    return {
      startDate: formatDate(),
      currentStep: pickRandom(PROCESSES)
    };
  }

  // REJECTED
  return {
    policy: 'POL-SEC-042: Validación de cumplimiento obligatorio',
    rejectionComment: 'El NID no cumple los criterios de seguridad definidos en la política vigente.'
  };
}

/**
 * POST /api/nid
 * Body: { "nid": "ABC123" }
 * Simula la consulta al orquestador y devuelve un estado aleatorio.
 */
app.post('/api/nid', (req, res) => {
  const { nid } = req.body || {};

  if (!nid || typeof nid !== 'string' || !nid.trim()) {
    return res.status(400).json({
      error: 'El campo nid es obligatorio.'
    });
  }

  const cleanNid = nid.trim();
  const status = pickRandom(STATUSES);
  const data = buildStatusData(status);

  return res.json({
    nid: cleanNid,
    status,
    processesChecked: PROCESSES.length,
    processes: PROCESSES,
    data
  });
});

app.listen(PORT, () => {
  console.log(`Servidor Ticketbot escuchando en http://localhost:${PORT}`);
});
