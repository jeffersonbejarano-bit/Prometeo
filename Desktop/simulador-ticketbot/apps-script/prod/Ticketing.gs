/**
 * Ticketing — Lucidchart lane.
 * - Ticket a área → crear ticket de solución
 * - Manual review → crear ticket de validación manual
 * - Mantener hasta resolución → notificar cierre
 *
 * En esta fase se simula con PropertiesService.
 */

/**
 * @param {string} nid
 * @param {'solution'|'manual'} type
 * @param {string} area
 * @return {{ticketId:string,nid:string,type:string,area:string,status:string,createdAt:string,message:string}}
 */
function createTicket(nid, type, area) {
  var ticketId = 'TKT-' + String(Date.now()).slice(-6);
  var createdAt = formatDate_();
  var ticket = {
    ticketId: ticketId,
    nid: String(nid).trim(),
    type: type,
    area: area || 'Área responsable',
    status: 'OPEN',
    createdAt: createdAt,
    closedAt: null
  };

  var props = PropertiesService.getScriptProperties();
  props.setProperty('ticket_' + ticketId, JSON.stringify(ticket));

  return {
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
  };
}

/**
 * Simula cierre del ticket y retorna el ticket cerrado.
 * @param {string} ticketId
 */
function closeTicket(ticketId) {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty('ticket_' + ticketId);
  if (!raw) {
    throw new Error('Ticket no encontrado.');
  }

  var ticket = JSON.parse(raw);
  ticket.status = 'CLOSED';
  ticket.closedAt = formatDate_();
  props.setProperty('ticket_' + ticketId, JSON.stringify(ticket));
  return ticket;
}

/**
 * Estado de sesión por usuario+NID para gate de Manual review.
 * Manual review solo si reintento Y ticket no funcionaron (Lucidchart).
 */
function getSessionKey_(userKey, nid) {
  return 'session_' + userKey + '_' + nid;
}

function getSession_(userKey, nid) {
  var props = PropertiesService.getUserProperties();
  var raw = props.getProperty(getSessionKey_(userKey, nid));
  if (!raw) {
    return { retryTried: false, ticketTried: false };
  }
  return JSON.parse(raw);
}

function saveSession_(userKey, nid, session) {
  var props = PropertiesService.getUserProperties();
  props.setProperty(getSessionKey_(userKey, nid), JSON.stringify(session));
}
