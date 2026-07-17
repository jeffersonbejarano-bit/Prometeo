# **PRD de automatización de respuestas comerciales**

## **Ficha Técnica**

| Project Owner (DRI) | [Jefferson Guillermo Bejarano Granados](mailto:jeffersonbejarano@habi.co) |
| :---- | :---- |
| **Stakeholders** | [Gustavo Armando Vallejo Ruiz](mailto:gustavovallejo@habi.co), [Angel Gomez Reyes](mailto:angelgomez@habi.co), [Sandra Liliana Soto Calderon](mailto:lilianasoto@habi.co) |
| **Link de Repo en Github:**  | [https://github.com/jeffersonbejarano-bit/Prometeo.git](https://github.com/jeffersonbejarano-bit/Prometeo.git) |
| **Link de AppScript Dev:** | Pendiente de `npm run clasp:create` → carpeta `apps-script/dev` (Prometeo Aprobologia DEV) |
| **Link de AppScript Prod:** | Pendiente de `npm run clasp:create` → carpeta `apps-script/prod` (Prometeo Aprobologia PROD) |

## **I. PRD (Product Requirement Document)**

### ***1\. El Problema*** 

Desde siempre se han creado distintos canales de solicitud comercial hacia aprobación donde la mayoría de ellas son consultas de estados o fallas durante los procesos como por ejemplo comité de vistas, priorización de nids en aprobación, problemas por bloqueo en orquestador, etc

### ***2\. Impacto en el Negocio***

*¿Qué gana la compañía al resolver esto? (Money, Strategy, Risk)*

- **Beneficio Directo:** Ahorra tiempo en respuestas que por gestión operativa no se puede hacer inmediatamente; corrección de errores ya que esto identificará el error y direccionará el problema al área encargada o al reintento requerido  
- **Alineación Estratégica:** Conocimiento completo de nuestro cliente interno sobre el proceso el cual se encuentra su negocio, qué fallas puede tener y cómo lo puede resolver

### ***3\. Outcome Esperado***

*¿Cómo mediremos si obtuvimos ese impacto?*

- **KPI:** Chat de google (co-sellers-aprobologos comercial)  
- **Fórmula de Cálculo:** \[numerador / denominador\]  
- **Temporalidad de Medición:** Finales de agosto  
- **Línea Base (Actual):** 8 horas  
- **Meta (Target):** 0-1 hora

### ***4\. Alcance***

*Mata la ambigüedad. Qué entra y qué NO entra.*

| ✅ Lo que SÍ va a hacer | ❌ Lo que NO va a hacer (queda para después) |
| :---- | :---- |
| Da una respuesta corta, clara y concisa del problema | Permitir que el comercial de manejo a los procesos como reintentos sin sentido |
| Opciones limitadas de solución a problemas | Realizar trabajos solicitados, solo funciona como fuente de información |

## **II. Plan de Ejecución**

### ***5\. Cómo va a funcionar la solución***

**5.1 Descripción**

Cuando el comercial tenga una duda del estado de orquestador o proceso donde se encuentre su nid va a poder consultarlo mediante un chat bot o un ticket bot y según lo solicitado este le brindará la información, si se encuentra aprobado o rechazado, el por qué del rechazo, una opción de redirección y una opción para generar una terea, ej: si está rechazado o pegado en hesh darle la información necesaria para reintentarlo en hesh, revisar el por qué está estancado o generar un ticket a otra área encargada

**5.2 Diagrama de flujo de negocio**

[Consulta y gestión de nids](https://lucid.app/lucidchart/5a09e426-fde0-4c32-8607-e9cd362e5b7d/edit?viewport_loc=-3802%2C-3027%2C8974%2C4124%2C0_0&invitationId=inv_fe79b5f3-bc5b-441d-b2a1-90dc76aad3d3)

### ***6\. Plan de Ejecución por Milestones***

\[Un milestone es una entrega/iteración de principio a fin que se puede **construir, probar y poner en uso de forma independiente**. No son fases técnicas (no hagas "M1 \= construir todo, M2 \= probar todo, M3 \= liberar todo"). Cada milestone debe dejar algo funcionando, aunque sea para pocos usuarios o pocos casos.\]

**6.1 Cómo voy a partir el trabajo**

Antes de llenar la tabla, define en 1-2 líneas:

- **¿Cuál es la versión más simple que ya sirve?** que mencione en qué proceso de orquestador se encuentra  
- **¿Cómo se va a enriquecer después?** ampliando la respuesta como comentario en rechazo o aprobación con tiempo de realización del tipo de consulta  
- **¿En qué milestone se considera el proyecto cerrado?** M6 cuando ya funcione en su totalidad

**6.2 Tabla de Milestones**

| Milestone *Síntesis (3-6 palabras)* | Deadline *Estimación de la fecha de entrega.*  | Objetivo *¿Qué problema o porción del problema resuelve este milestone? (1-2 líneas)* | Entregable *¿Qué queda funcionando en producción o disponible para el usuario cuando este milestone cierra? Debe ser observable, no abstracto.* | Cómo contribuye *¿Cómo aporta al KPI, al usuario, al proceso o al negocio? Puede ser uno o varios.* | Dependencias *Milestones previos, sistemas externos, decisiones de otros equipos.* |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **M1:** Construcción simple | 8 jul 2026 | Construir la primera parte de consulta y solución simple (conectar las fuentes) | La primera consulta de los nids que se encuentran en COMPLETED funcional alineado con la consulta inicial | Primera respuesta a consultas que ya se encuentran resueltas pero el cliente interno no lo sabe |  |
| **M2:** Pruebas | 22 jul 2026 | Validar y corregir errores y confirmar funcionalidad y conectividad del 100% | Solución completa a un nid con respuesta COMPLETED | Respuesta inmediata con tiempo de respuesta de 0h |  |
| **M3:** Construcción de la consulta IN-PROGRESS | 29 jul 2026 | Construcción de la segunda parte para la respuesta de nids en IN\_PREGRESS | Lograr que la consulta se haga correctamente a la solicitud | Logra que el cliente interno sepa en qué proceso se encuentra su nid en caso de dudas por no avance |  |
| **M4:** Pruebas | 5 ago 2026 | Validar y corregir errores y confirmar funcionalidad y conectividad del 100% | Solución completa a un nid con respuesta IN\_PROGRESS | Respuesta inmediata con tiempo de respuesta de 0h |  |
| **M5:** Construcción de la consulta REJECTED | 12 ago 2026 | Construcción de la tercera parte para la respuesta de nids en IREJECTED | Lograr que la consulta se haga correctamente a la solicitud y las redirecciones funcionen de acuerdo a lo solicitado | Lograr que el cliente entienda la razón del rechazo en cada proceso del orquestador y pueda actuar en solución del mismo |  |
| **M6:** pruebas | 19 ago 2026 | Validar y corregir errores y confirmar funcionalidad y conectividad del 100% | Solución completa a un nid con respuesta REJECTED | Respuesta inmediata con tiempo de respuesta de 0h |  |

