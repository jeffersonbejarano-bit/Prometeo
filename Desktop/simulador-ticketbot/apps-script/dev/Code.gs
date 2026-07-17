/**
 * Prometeo Aprobología — Google Chat Bot (DEV)
 *
 * Flujo Lucidchart:
 * Start → Recibe NID → Revisar 9 procesos → COMPLETED | IN_PROGRESS | REJECTED
 * COMPLETED / IN_PROGRESS → presentar info → End
 * REJECTED → Ticket to area | Manual review
 */

/**
 * Mensaje entrante del usuario en Google Chat.
 * @param {Object} event
 * @return {Object} Google Chat response
 */
function onMessage(event) {
  var text = ((event && event.message && event.message.text) || '').trim();

  if (!text) {
    return textResponse_(
      'Hola. Soy ' +
        CONFIG.BOT_NAME +
        '.\n\nEscribe un NID para consultar su estado en el orquestador.'
    );
  }

  // Quitar mención del bot si existe (@Bot nombre)
  text = text.replace(/^@\S+\s*/, '').trim();

  if (isHelp_(text)) {
    return textResponse_(
      CONFIG.BOT_NAME +
        '\nEntorno: ' +
        CONFIG.ENV +
        '\n\nEscribe un NID (ej: NID-12345) y te diré si está COMPLETED, IN_PROGRESS o REJECTED.'
    );
  }

  return handleNidConsultation_(text);
}

/**
 * Clic en botones de tarjeta (acciones REJECTED).
 * @param {Object} event
 * @return {Object}
 */
function onCardClick(event) {
  var action = event && event.action ? event.action : {};
  var params = action.parameters || [];
  var map = paramsToMap_(params);
  var nid = map.nid || '';
  var actionName = action.actionMethodName || map.action || '';

  if (!nid) {
    return textResponse_('No pude identificar el NID de la acción.');
  }

  if (actionName === 'ticket_area') {
    return handleTicketFlow_(nid, 'solution', map.area || 'Área responsable');
  }

  if (actionName === 'manual_review') {
    return handleTicketFlow_(nid, 'manual', map.area || 'Área responsable');
  }

  return textResponse_('Acción no reconocida.');
}

function handleNidConsultation_(nid) {
  try {
    var payload = consultNid(nid);
    var messageText = formatStatusMessage_(payload);

    if (payload.status === 'REJECTED') {
      return cardWithRejectedActions_(messageText, payload);
    }

    // COMPLETED e IN_PROGRESS terminan en End (sin botones)
    return textResponse_(messageText);
  } catch (err) {
    return textResponse_('Error: ' + (err.message || String(err)));
  }
}

function handleTicketFlow_(nid, type, area) {
  try {
    var created = createTicket(nid, type, area);
    var closed = closeTicket(created.ticketId);

    var text =
      created.message +
      '\nTicket: ' +
      created.ticketId +
      '\n\nTicket ' +
      closed.ticketId +
      ' cerrado.\nÁrea: ' +
      closed.area +
      '\nCierre: ' +
      closed.closedAt +
      '\n\nFin del flujo.';

    return textResponse_(text);
  } catch (err) {
    return textResponse_('Error en ticketing: ' + (err.message || String(err)));
  }
}

function formatStatusMessage_(payload) {
  var nid = payload.nid;
  var data = payload.data || {};

  if (payload.status === 'COMPLETED') {
    return (
      'NID COMPLETED\n' +
      'NID: ' +
      nid +
      '\nFecha de ejecución: ' +
      data.executionDate +
      '\nComentario de aprobación: ' +
      data.approvalComment
    );
  }

  if (payload.status === 'IN_PROGRESS') {
    var msg =
      'NID IN_PROGRESS\n' +
      'NID: ' +
      nid +
      '\nFecha/hora de inicio: ' +
      data.startDate;
    if (data.isApprovalTask && data.currentStep) {
      msg += '\nPaso actual: ' + data.currentStep;
    }
    return msg;
  }

  return (
    'NID REJECTED\n' +
    'NID: ' +
    nid +
    '\nPolítica: ' +
    data.policy +
    '\nComentario: ' +
    data.rejectionComment
  );
}

function cardWithRejectedActions_(messageText, payload) {
  var nid = payload.nid;
  var area = (payload.data && payload.data.area) || 'Área responsable';

  return {
    cardsV2: [
      {
        cardId: 'rejected-' + nid,
        card: {
          header: {
            title: CONFIG.BOT_NAME,
            subtitle: 'NID REJECTED · ' + CONFIG.ENV
          },
          sections: [
            {
              widgets: [
                { textParagraph: { text: messageText.replace(/\n/g, '<br>') } },
                {
                  buttonList: {
                    buttons: [
                      {
                        text: 'Ticket to area',
                        onClick: {
                          action: {
                            actionMethodName: 'ticket_area',
                            parameters: [
                              { key: 'nid', value: nid },
                              { key: 'area', value: area },
                              { key: 'action', value: 'ticket_area' }
                            ]
                          }
                        }
                      },
                      {
                        text: 'Manual review',
                        onClick: {
                          action: {
                            actionMethodName: 'manual_review',
                            parameters: [
                              { key: 'nid', value: nid },
                              { key: 'area', value: area },
                              { key: 'action', value: 'manual_review' }
                            ]
                          }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      }
    ]
  };
}

function textResponse_(text) {
  return { text: text };
}

function paramsToMap_(params) {
  var map = {};
  for (var i = 0; i < params.length; i++) {
    map[params[i].key] = params[i].value;
  }
  return map;
}

function isHelp_(text) {
  var t = String(text).toLowerCase();
  return t === 'ayuda' || t === 'help' || t === 'hola' || t === 'hi' || t === 'start';
}
