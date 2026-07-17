const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

/**
 * 9 procesos del orquestador (orden SOP).
 * Usados para IN_PROGRESS (paso actual) y para asignar área en tickets.
 */
const PROCESSES = [
  { name: 'sellers tarea de documentos', area: 'Sellers / Documentación' },
  { name: 'idm revision de documentos', area: 'IDM Documentos' },
  { name: 'remo comite de remodelaciones', area: 'REMO / Comité' },
  { name: 'idm checks automatico', area: 'IDM Checks' },
  { name: 'idm pricing manual', area: 'IDM Pricing Manual' },
  { name: 'idm pricing automatico', area: 'IDM Pricing Automático' },
  { name: 'idm hesh', area: 'IDM HESH' },
  { name: 'idm ensamble de precio', area: 'IDM Ensamble' },
  { name: 'idm aprobologia', area: 'IDM Aprobología' }
];

const STATUSES = ['COMPLETED', 'IN_PROGRESS', 'REJECTED'];

// Tickets en memoria para simular ciclo hasta cierre (Lucidchart: Ticketing lane)
const tickets = new Map();

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

/**
 * Flujo Lucidchart — Orquestador:
 * - COMPLETED  → fecha de ejecución + comentario de aprobación
 * - IN_PROGRESS → fecha/hora desde que está en proceso + paso actual (tarea de aprobación)
 * - REJECTED   → política de rechazo + comentario
 */
function buildOrchestratorResponse(status) {
  if (status === 'COMPLETED') {
    return {
      status,
      data: {
        executionDate: formatDate(),
        approvalComment:
          'Aprobado por el orquestador. Cumple políticas de liberación.'
      }
    };
  }

  const process = pickRandom(PROCESSES);

  if (status === 'IN_PROGRESS') {
    return {
      status,
      data: {
        startDate: formatDate(),
        currentStep: process.name,
        isApprovalTask: true
      }
    };
  }

  return {
    status,
    data: {
      policy: 'POL-SEC-042: Validación de cumplimiento obligatorio',
      rejectionComment:
        'El NID no cumple los criterios definidos en la política vigente. Proceso: ' +
        process.name +
        '.',
      area: process.area,
      rejectedAt: process.name
    }
  };
}

/**
 * POST /api/nid
 * Start → Recibe NID → Revisar 9 procesos → Estado
 */
app.post('/api/nid', (req, res) => {
  const { nid } = req.body || {};

  if (!nid || typeof nid !== 'string' || !nid.trim()) {
    return res.status(400).json({ error: 'El campo nid es obligatorio.' });
  }

  const cleanNid = nid.trim();
  const status = pickRandom(STATUSES);
  const result = buildOrchestratorResponse(status);

  return res.json({
    nid: cleanNid,
    status: result.status,
    processesOrder: PROCESSES.map(function (p) {
      return p.name;
    }),
    data: result.data
  });
});

/**
 * POST /api/ticket
 * Lucidchart Ticketing:
 * - "Ticket a área" → Crear ticket de solución (área responsable)
 * - "Revisión manual" → Crear ticket de validación manual
 * Luego: Mantener hasta resolución → Notificar cierre → End
 *
 * Body: { nid, type: "solution" | "manual", area? }
 */
app.post('/api/ticket', (req, res) => {
  const { nid, type, area } = req.body || {};

  if (!nid || !type) {
    return res.status(400).json({ error: 'nid y type son obligatorios.' });
  }

  if (type !== 'solution' && type !== 'manual') {
    return res.status(400).json({
      error: 'type debe ser "solution" o "manual".'
    });
  }

  const ticketId = 'TKT-' + Date.now().toString().slice(-6);
  const createdAt = formatDate();
  const ticket = {
    ticketId: ticketId,
    nid: String(nid).trim(),
    type: type,
    area: area || 'Área responsable',
    status: 'OPEN',
    createdAt: createdAt,
    closedAt: null
  };

  tickets.set(ticketId, ticket);

  // Simula cierre del ticket (flujo: mantener hasta resolución → notificar cierre)
  setTimeout(function () {
    const stored = tickets.get(ticketId);
    if (stored && stored.status === 'OPEN') {
      stored.status = 'CLOSED';
      stored.closedAt = formatDate();
      tickets.set(ticketId, stored);
    }
  }, 2500);

  return res.json({
    ok: true,
    ticketId: ticketId,
    nid: ticket.nid,
    type: ticket.type,
    area: ticket.area,
    status: ticket.status,
    createdAt: ticket.createdAt,
    message:
      type === 'solution'
        ? 'Ticket de solución creado en el sistema. Te notificaremos al cierre.'
        : 'Ticket de validación manual creado. Te notificaremos al cierre.'
  });
});

/**
 * GET /api/ticket/:ticketId
 * Consulta estado del ticket (OPEN → CLOSED) para notificar cierre en el chat.
 */
app.get('/api/ticket/:ticketId', (req, res) => {
  const ticket = tickets.get(req.params.ticketId);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket no encontrado.' });
  }

  return res.json(ticket);
});

app.listen(PORT, () => {
  console.log('Servidor Ticketbot escuchando en http://localhost:' + PORT);
});
