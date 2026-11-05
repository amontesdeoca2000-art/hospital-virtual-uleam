export const stageNames = [
  'Prioridad y triaje',
  'Valoración de Enfermería',
  'Estudios complementarios',
  'Intervención prioritaria',
  'Reevaluación y entrega SBAR',
] as const
export const stageKeys = ['priority','assessment','tests','action','recheck'] as const
export type ClinicalStageKey = typeof stageKeys[number]
export type ClinicalCase = {
  id: string
  title: string
  service: string
  difficulty: string
  age: string
  sex: string
  reason: string
  history: string
  observations: string[]
  vitalSigns: { label: string; value: string; alarm?: boolean }[]
  stages: { prompt: string; options: { id: string; label: string }[] }[]
  requestedTestId: string
  testResult: string
  alternativeResult: string
  stableOutcome: string
  unstableOutcome: string
  learning: string[]
  sourceLabel: string
  sourceUrl: string
}
export const clinicalCases: ClinicalCase[] = [
  {
    id: 'hipoglucemia-alerta',
    title: 'Sudoración y temblor en una persona con diabetes',
    service: 'Emergencia · Área de triaje',
    difficulty: 'Inicial', age: '58 años', sex: 'Mujer',
    reason: '«Me siento mareada, tengo mucho sudor y las manos me tiemblan».',
    history: 'Diabetes mellitus tratada con insulina. Se aplicó su dosis habitual, pero desayunó muy poco. Está despierta, orientada y puede tragar sin dificultad.',
    observations: ['Piel húmeda y pálida','Habla coherente','Refiere hambre y debilidad'],
    vitalSigns: [
      {label:'Presión arterial',value:'112/70 mmHg'},
      {label:'Frecuencia cardiaca',value:'112 lpm',alarm:true},
      {label:'Frecuencia respiratoria',value:'20 rpm'},
      {label:'SpO₂ aire ambiente',value:'97 %'},
      {label:'Temperatura',value:'36,7 °C'},
    ],
    stages:[
      {prompt:'La paciente acaba de ingresar. ¿Qué debes priorizar?',options:[
        {id:'abc',label:'Valorar ABCDE, nivel de conciencia e identificar un problema agudo reversible.'},
        {id:'esperar',label:'Indicarle que espere hasta que se desocupe una camilla.'},
        {id:'alta',label:'Dar el alta porque la presión arterial es normal.'},
        {id:'medicar',label:'Administrar una nueva dosis de insulina sin valorar primero.'},
      ]},
      {prompt:'¿Qué valoración dirigida permite orientar la actuación?',options:[
        {id:'glucosa',label:'Comprobar conciencia, seguridad de la deglución y glucemia capilar.'},
        {id:'peso',label:'Registrar únicamente el peso y el perímetro abdominal.'},
        {id:'piel',label:'Observar solo la piel y diferir los signos vitales.'},
        {id:'espera',label:'Repetir la misma pregunta en una hora.'},
      ]},
      {prompt:'Selecciona el examen inmediato pertinente, dentro de protocolos del servicio.',options:[
        {id:'glucometria',label:'Realizar una glucemia capilar junto a la paciente.'},
        {id:'radiografia',label:'Tramitar primero una radiografía de tórax.'},
        {id:'resonancia',label:'Solicitar una resonancia cerebral como primera medida.'},
        {id:'ninguno',label:'No realizar ninguna comprobación objetiva.'},
      ]},
      {prompt:'El glucómetro registra una glucosa de 56 mg/dL. Está consciente y puede tragar. ¿Qué cuidado es prioritario?',options:[
        {id:'carbohidrato',label:'Aplicar protocolo de hipoglucemia: glucosa oral de acción rápida (15 g) y vigilancia.'},
        {id:'insulina',label:'Administrar más insulina para corregir la debilidad.'},
        {id:'agua',label:'Ofrecer solamente agua y dejarla en la sala de espera.'},
        {id:'npo',label:'Mantenerla sin vía oral durante dos horas sin avisar.'},
      ]},
      {prompt:'Después de intervenir, ¿cómo compruebas la respuesta y comunicas el caso?',options:[
        {id:'recontrol',label:'Revisar glucosa a los 15 minutos, repetir tratamiento si sigue baja y comunicar en SBAR.'},
        {id:'salida',label:'Dejarla ir sin volver a comprobar su glucemia.'},
        {id:'ignorar',label:'Registrar solo «mejoró» sin valores ni reevaluación.'},
        {id:'tardia',label:'Esperar al turno siguiente sin informar.'},
      ]},
    ],
    requestedTestId:'glucometria',
    testResult:'Glucosa capilar simulada: 56 mg/dL (hipoglucemia). La persona está consciente y deglute de forma segura.',
    alternativeResult:'No obtuviste la glucemia inmediata. Aún falta un dato esencial para explicar los síntomas.',
    stableOutcome:'Tras actuación y reevaluación según protocolo: glucemia simulada de 86 mg/dL, síntomas en mejoría.',
    unstableOutcome:'Sin manejo oportuno, el escenario simula mayor confusión y sudoración. Debes escalar la atención.',
    learning:[
      'Primero comprueba la seguridad de la vía aérea y el estado de conciencia.',
      'La glucemia baja en una persona consciente que puede tragar puede requerir glucosa oral de acción rápida, según protocolo.',
      'Reevalúa la glucemia en unos 15 minutos y comunica cualquier empeoramiento.',
    ],
    sourceLabel:'ADA: Standards of Care in Diabetes 2026, hipoglucemia',
    sourceUrl:'https://diabetesjournals.org/care/article/49/Supplement_1/S132/163927/',
  },
  {
    id:'dificultad-respiratoria',
    title:'Disnea, fiebre y saturación baja',
    service:'Urgencias · Observación respiratoria',
    difficulty:'Intermedio',age:'69 años',sex:'Hombre',
    reason:'«Me falta el aire desde ayer y tengo fiebre».',
    history:'Tos productiva desde hace cuatro días y debilidad. No hay diagnóstico etiológico confirmado. Se requiere valoración médica urgente.',
    observations:['Habla en frases cortas','Aumento del trabajo respiratorio','Crepitantes a la auscultación basal derecha'],
    vitalSigns:[
      {label:'Presión arterial',value:'105/65 mmHg'},
      {label:'Frecuencia cardiaca',value:'115 lpm',alarm:true},
      {label:'Frecuencia respiratoria',value:'30 rpm',alarm:true},
      {label:'SpO₂ aire ambiente',value:'88 %',alarm:true},
      {label:'Temperatura',value:'38,6 °C',alarm:true},
    ],
    stages:[
      {prompt:'¿Cuál es la primera prioridad de Enfermería?',options:[
        {id:'oxigenacion',label:'Reconocer hipoxemia, evaluar ABCDE y activar atención urgente.'},
        {id:'registro',label:'Completar primero el formulario administrativo.'},
        {id:'egreso',label:'Indicar alta y control domiciliario sin otra valoración.'},
        {id:'esperar',label:'Dejarlo esperando a que pase la fiebre.'},
      ]},
      {prompt:'¿Qué valoración focalizada permite vigilar el deterioro?',options:[
        {id:'respiracion',label:'Evaluar saturación, frecuencia, esfuerzo respiratorio, conciencia y auscultación.'},
        {id:'peso',label:'Registrar solamente talla y peso.'},
        {id:'piel',label:'Realizar exclusivamente una inspección de piel.'},
        {id:'noevaluar',label:'No volver a revisar los signos vitales.'},
      ]},
      {prompt:'¿Qué estudio complementario es razonable coordinar con el equipo médico?',options:[
        {id:'torax',label:'Comunicar hallazgos para valoración médica y posible radiografía de tórax y estudios indicados.'},
        {id:'mri',label:'Gestionar primero resonancia de rodilla.'},
        {id:'solo-orina',label:'Solicitar solo un examen de orina sin valorar el cuadro respiratorio.'},
        {id:'no-prueba',label:'Descartar la necesidad de estudios sin consultar.'},
      ]},
      {prompt:'Ante SpO₂ 88 % y respiración trabajosa, ¿qué actuación corresponde?',options:[
        {id:'soporte',label:'Escalar inmediatamente; posicionar, vigilar y administrar oxígeno conforme a protocolo/indicación.'},
        {id:'antibiotico',label:'Prescribir y administrar antibióticos sin indicación.'},
        {id:'caminar',label:'Hacerlo caminar para mejorar su saturación.'},
        {id:'sin-asistencia',label:'Dejarlo sin supervisión durante una hora.'},
      ]},
      {prompt:'¿Cómo registras y entregas el caso al equipo?',options:[
        {id:'sbar',label:'Reevaluar SpO₂, FR, esfuerzo y respuesta; informar signos y decisiones en formato SBAR.'},
        {id:'alta',label:'Registrar «bien» y enviar al paciente a casa.'},
        {id:'esperar',label:'No informar cambios hasta el próximo turno.'},
        {id:'omitir',label:'Omitir la saturación en la entrega.'},
      ]},
    ],
    requestedTestId:'torax',
    testResult:'Estudio simulado, coordinado con el equipo médico: radiografía compatible con infiltrado basal derecho; el resultado requiere interpretación y diagnóstico médico.',
    alternativeResult:'No se ha coordinado un estudio respiratorio pertinente. La hipoxemia exige reevaluación urgente, incluso antes de contar con imágenes.',
    stableOutcome:'Tras respuesta organizada del equipo, la simulación muestra mejora de SpO₂ a 94 % con vigilancia continua y valoración médica.',
    unstableOutcome:'El retraso en la atención se acompaña de mayor trabajo respiratorio en esta simulación; se requiere escalamiento inmediato.',
    learning:[
      'Una saturación de 88 % en aire ambiente y FR de 30 rpm son hallazgos de alarma.',
      'Enfermería identifica el deterioro, ejecuta medidas autorizadas y coordina los exámenes prescritos.',
      'La comunicación estructurada SBAR y la reevaluación serial apoyan la seguridad del paciente.',
    ],
    sourceLabel:'NICE NG250: Pneumonia, assessment and management',
    sourceUrl:'https://www.nice.org.uk/guidance/ng250/chapter/recommendations',
  },
  {
    id:'deshidratacion-perfusion',
    title:'Gastroenteritis y signos de hipoperfusión',
    service:'Emergencia · Valoración inicial',
    difficulty:'Intermedio',age:'36 años',sex:'Mujer',
    reason:'«Llevo dos días con diarrea y vómitos, hoy casi no he orinado».',
    history:'Pérdidas gastrointestinales repetidas, intolerancia oral y debilidad. Sin antecedentes relevantes referidos. Este caso no sustituye la evaluación clínica.',
    observations:['Mucosas secas','Llenado capilar enlentecido','Se nota mareada al intentar levantarse'],
    vitalSigns:[
      {label:'Presión arterial',value:'92/60 mmHg',alarm:true},
      {label:'Frecuencia cardiaca',value:'118 lpm',alarm:true},
      {label:'Frecuencia respiratoria',value:'23 rpm'},
      {label:'SpO₂ aire ambiente',value:'98 %'},
      {label:'Temperatura',value:'37,4 °C'},
    ],
    stages:[
      {prompt:'¿Qué riesgo debe reconocerse primero?',options:[
        {id:'perfusión',label:'Valorar ABCDE y sospechar compromiso de perfusión por pérdidas de líquidos.'},
        {id:'administrativo',label:'Completar la ficha administrativa antes de valorar signos de alarma.'},
        {id:'alta',label:'Dar alta inmediata por ausencia de fiebre.'},
        {id:'espera',label:'Indicar que espere sin supervisión.'},
      ]},
      {prompt:'¿Cuál valoración focalizada aporta datos útiles?',options:[
        {id:'balance',label:'Registrar pérdidas, diuresis, estado mental, perfusión y signos vitales seriados.'},
        {id:'solo-temperatura',label:'Controlar únicamente la temperatura.'},
        {id:'solo-peso',label:'Registrar solo su peso estimado.'},
        {id:'no-evaluar',label:'No medir signos vitales hasta que deje de vomitar.'},
      ]},
      {prompt:'¿Qué exámenes corresponde proponer al equipo tratante según gravedad?',options:[
        {id:'electrolitos',label:'Coordinar indicación de electrolitos, función renal y otros estudios pertinentes.'},
        {id:'tac',label:'Solicitar tomografía craneal como estudio de rutina sin indicación.'},
        {id:'ninguno',label:'Descartar toda prueba aunque haya hipotensión y oliguria.'},
        {id:'audiometria',label:'Gestionar audiometría como prioridad.'},
      ]},
      {prompt:'¿Qué cuidados de Enfermería deben priorizarse?',options:[
        {id:'soporte-perfusion',label:'Activar valoración médica; vigilar perfusión, prevenir caídas y preparar acceso/fluídos conforme a indicación.'},
        {id:'diuretico',label:'Administrar un diurético sin indicación para aumentar la orina.'},
        {id:'caminar',label:'Pedir que camine sin ayuda pese al mareo.'},
        {id:'sin-registro',label:'No documentar las pérdidas de líquidos.'},
      ]},
      {prompt:'¿Cómo evalúas la respuesta a los cuidados?',options:[
        {id:'revaluar-perfusion',label:'Revisar PA, FC, conciencia, diuresis y balance; reportar cambios en SBAR.'},
        {id:'alta',label:'Dar alta sin volver a controlar la presión.'},
        {id:'solo-sintomas',label:'Registrar solo si continúa con náuseas.'},
        {id:'sin-revision',label:'No reevaluar hasta el siguiente día.'},
      ]},
    ],
    requestedTestId:'electrolitos',
    testResult:'Resultados simulados solicitados por el equipo: sodio 134 mmol/L, potasio 3,2 mmol/L y creatinina 1,4 mg/dL; requieren correlación clínica e interpretación médica.',
    alternativeResult:'No se dispone todavía de electrolitos o función renal. La valoración de perfusión y el aviso al equipo no deben retrasarse.',
    stableOutcome:'Tras cuidados y tratamiento indicados por el equipo, el caso simula PA 108/68 mmHg, FC 96 lpm y mejoría del mareo.',
    unstableOutcome:'Sin vigilancia ni escalamiento, el caso simula empeoramiento de hipotensión y debilidad.',
    learning:[
      'La presión baja, la taquicardia y la disminución de diuresis requieren valorar perfusión y escalar.',
      'Un balance hídrico confiable y controles seriados orientan la reevaluación.',
      'Los líquidos intravenosos y estudios de laboratorio deben ajustarse a indicaciones y protocolos.',
    ],
    sourceLabel:'NICE CG174: Intravenous fluid therapy in adults in hospital',
    sourceUrl:'https://www.nice.org.uk/guidance/cg174/chapter/recommendations',
  },
]
export const caseById = (id: string) => clinicalCases.find(c=>c.id===id)
export function validScenario(caseId:string) {
  const scenario=caseById(caseId)
  return Boolean(scenario&&scenario.stages.length===5&&scenario.stages.every(s=>s.options.length>=3))
}
