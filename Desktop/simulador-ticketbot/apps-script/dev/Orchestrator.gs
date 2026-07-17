/**
 * Orquestador — consulta NID en los 9 procesos (SOP).
 * Flujo Lucidchart: Revisar 9 procesos → COMPLETED | IN_PROGRESS | REJECTED
 */

var PROCESSES = [
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

var STATUSES = ['COMPLETED', 'IN_PROGRESS', 'REJECTED'];

function pickRandom_(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function formatDate_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy, hh:mm:ss a');
}

/**
 * Consulta el estado de un NID.
 * @param {string} nid
 * @return {{nid:string,status:string,data:Object}}
 */
function consultNid(nid) {
  var cleanNid = String(nid || '').trim();
  if (!cleanNid) {
    throw new Error('El campo nid es obligatorio.');
  }

  if (CONFIG.USE_MOCK_ORCHESTRATOR || !CONFIG.ORCHESTRATOR_URL) {
    return mockOrchestrator_(cleanNid);
  }

  return callRealOrchestrator_(cleanNid);
}

function mockOrchestrator_(nid) {
  var status = pickRandom_(STATUSES);

  if (status === 'COMPLETED') {
    return {
      nid: nid,
      status: status,
      data: {
        executionDate: formatDate_(),
        approvalComment: 'Aprobado por el orquestador. Cumple políticas de liberación.'
      }
    };
  }

  var process = pickRandom_(PROCESSES);

  if (status === 'IN_PROGRESS') {
    return {
      nid: nid,
      status: status,
      data: {
        startDate: formatDate_(),
        currentStep: process.name,
        isApprovalTask: true
      }
    };
  }

  return {
    nid: nid,
    status: status,
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
 * Placeholder para orquestador real (HTTP).
 */
function callRealOrchestrator_(nid) {
  var response = UrlFetchApp.fetch(CONFIG.ORCHESTRATOR_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ nid: nid }),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var body = JSON.parse(response.getContentText() || '{}');

  if (code < 200 || code >= 300) {
    throw new Error(body.error || 'Error consultando orquestador (' + code + ')');
  }

  return body;
}
