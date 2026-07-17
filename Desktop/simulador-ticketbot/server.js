const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

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

function buildStatusData(status) {
  const now = new Date().toISOString();

  if (status === 'COMPLETED') {
    return {
      executionDate: now,
      approvalComment: 'Aprobado automaticamente por el orquestador. Cumple politicas de liberacion.'
    };
  }

  if (status === 'IN_PROGRESS') {
    const stepIndex = Math.floor(Math.random() * PROCESSES.length);
    return {
      startDate: now,
      currentStep: PROCESSES[stepIndex]
    };
  }

  return {
    policy: 'POL-SEC-042: Validacion de cumplimiento obligatorio',
    rejectionComment: 'El NID no cumple los criterios de seguridad definidos en la politica vigente.'
  };
}

app.post('/api/nid', (req, res) => {
  const { nid } = req.body || {};

  if (!nid || typeof nid !== 'string' || !nid.trim()) {
    return res.status(400).json({
      error: 'El campo nid es obligatorio.'
    });
  }

  const cleanNid = nid.trim();
  const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
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
