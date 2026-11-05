/**
 * Biblioteca didáctica de los 206 huesos del esqueleto humano adulto.
 * Conteo de referencia: 80 axiales + 126 apendiculares. En la infancia,
 * las fusiones y las variantes anatómicas pueden modificar el conteo.
 * Cada lado se registra como una pieza independiente.
 */
export type Bone = {
  id: string
  name: string
  group: string
  division: 'Axial' | 'Apendicular'
  location: string
  function: string
  landmark: string
  clinical: string
}

const catalogue: Bone[] = []
function add(
  name: string,
  group: string,
  division: Bone['division'],
  location: string,
  purpose: string,
  landmark: string,
  clinical: string,
) {
  catalogue.push({
    id: 'hueso-' + (catalogue.length + 1),
    name,
    group,
    division,
    location,
    function: purpose,
    landmark,
    clinical,
  })
}
function pair(
  name: string,
  group: string,
  division: Bone['division'],
  location: string,
  purpose: string,
  landmark: string,
  clinical: string,
) {
  for (const side of ['derecho', 'izquierdo']) {
    add(name + ' ' + side, group, division, location, purpose, landmark, clinical)
  }
}

// ESQUELETO AXIAL: cráneo (8), cara (14), oído (6), hioides (1),
// columna (26), costillas (24) y esternón (1): total 80.
add('Frontal', 'Cráneo', 'Axial', 'Frente y techo de las órbitas',
  'Protege el encéfalo y forma parte del techo orbitario.',
  'Glabela, arcos superciliares y borde supraorbitario.',
  'Los traumatismos frontales pueden comprometer el seno frontal.')
pair('Parietal', 'Cráneo', 'Axial', 'Parte superior y lateral de la bóveda craneal',
  'Forma y protege la bóveda craneal.',
  'Sutura sagital y sutura coronal.',
  'En lactantes, las suturas y fontanelas todavía permiten crecimiento craneal.')
pair('Temporal', 'Cráneo', 'Axial', 'Lado inferior de la bóveda craneal',
  'Protege estructuras del oído y participa en la articulación mandibular.',
  'Apófisis mastoides, meato acústico externo y fosa mandibular.',
  'Una fractura temporal puede afectar la audición.')
add('Occipital', 'Cráneo', 'Axial', 'Parte posterior e inferior del cráneo',
  'Protege el encéfalo y conecta el cráneo con la columna.',
  'Foramen magno y cóndilos occipitales.',
  'Por el foramen magno pasa la continuidad entre encéfalo y médula espinal.')
add('Esfenoides', 'Cráneo', 'Axial', 'Base central del cráneo',
  'Une numerosos huesos craneofaciales y sostiene estructuras encefálicas.',
  'Silla turca y alas mayores y menores.',
  'La hipófisis se aloja en la fosa hipofisaria de la silla turca.')
add('Etmoides', 'Cráneo', 'Axial', 'Entre cavidad nasal y órbitas',
  'Forma parte de la base craneal, tabique nasal y paredes orbitarias.',
  'Lámina cribosa y crista galli.',
  'La lámina cribosa se relaciona con los nervios olfatorios.')

add('Mandíbula', 'Cara', 'Axial', 'Parte inferior de la cara',
  'Sostiene dientes inferiores y permite la masticación y el habla.',
  'Cóndilo mandibular, rama y ángulo.',
  'Se articula con el temporal en la articulación temporomandibular.')
add('Vómer', 'Cara', 'Axial', 'Porción posterior e inferior del tabique nasal',
  'Contribuye a separar ambas fosas nasales.',
  'Lámina vertical que integra el tabique óseo.',
  'Las desviaciones del tabique pueden alterar el flujo de aire.')
for (const [name, place, purpose, landmark, clinical] of [
  ['Maxilar', 'Mandíbula superior y paladar anterior', 'Sostiene dientes superiores y contribuye a órbita y cavidad nasal.', 'Proceso alveolar y seno maxilar.', 'El seno maxilar puede afectarse en sinusitis.'],
  ['Cigomático', 'Pómulo y pared lateral de la órbita', 'Da proyección al pómulo y forma parte de la órbita.', 'Arco cigomático.', 'Puede lesionarse en traumatismos del pómulo.'],
  ['Nasal', 'Puente óseo de la nariz', 'Da soporte a la parte superior de la nariz.', 'Sutura internasal.', 'Es un sitio frecuente de fracturas faciales.'],
  ['Lagrimal', 'Pared medial de la órbita', 'Contribuye a la pared orbitara y al drenaje lagrimal.', 'Surco lagrimal.', 'Se relaciona con el saco lagrimal.'],
  ['Palatino', 'Paladar óseo posterior', 'Forma la parte posterior del paladar duro.', 'Lámina horizontal.', 'Separa parcialmente cavidades oral y nasal.'],
  ['Cornete nasal inferior', 'Pared lateral de la cavidad nasal', 'Aumenta superficie mucosa para acondicionar el aire.', 'Lámina curva del cornete.', 'La inflamación de la mucosa puede causar obstrucción nasal.'],
] as const) pair(name, 'Cara', 'Axial', place, purpose, landmark, clinical)
for (const [name, landmark, clinical] of [
  ['Martillo', 'Manubrio unido a la membrana timpánica.', 'Recibe vibraciones del tímpano.'],
  ['Yunque', 'Cuerpo y apófisis larga.', 'Transmite vibraciones entre martillo y estribo.'],
  ['Estribo', 'Base u platina en la ventana oval.', 'Su base transmite vibraciones al oído interno.'],
] as const) pair(name, 'Oído medio', 'Axial', 'Cadena de huesecillos en el oído medio',
  'Participa en la transmisión de vibraciones sonoras.', landmark, clinical)
add('Hioides', 'Cuello', 'Axial', 'Parte anterior del cuello',
  'Sirve de anclaje a músculos de lengua y deglución.',
  'Cuerpo y astas mayores y menores.',
  'No se articula directamente con otro hueso.')

add('Atlas (C1)', 'Columna vertebral', 'Axial', 'Primera vértebra cervical',
  'Sostiene la cabeza y facilita su flexión y extensión.',
  'Arcos anterior y posterior, sin cuerpo vertebral.',
  'Forma articulaciones atlantooccipitales.')
add('Axis (C2)', 'Columna vertebral', 'Axial', 'Segunda vértebra cervical',
  'Permite gran parte de la rotación de la cabeza.',
  'Apófisis odontoides (dens).',
  'El dens actúa como pivote de la articulación atlantoaxoidea.')
for (let n = 3; n <= 7; n++) add('Vértebra cervical C' + n, 'Columna vertebral',
  'Axial', 'Cuello, segmento cervical', 'Sostiene el cuello y protege la médula espinal.',
  n === 7 ? 'Apófisis espinosa prominente de C7.' : 'Forámenes transversos característicos de las cervicales.',
  'La movilidad cervical requiere control muscular y estabilidad.')
for (let n = 1; n <= 12; n++) add('Vértebra torácica T' + n, 'Columna vertebral',
  'Axial', 'Tórax, segmento dorsal', 'Sostiene el tronco y se relaciona con la caja torácica.',
  'Carillas costales para articulación con costillas (con variaciones por nivel).',
  'La región torácica tiene menos movilidad que la cervical o lumbar.')
for (let n = 1; n <= 5; n++) add('Vértebra lumbar L' + n, 'Columna vertebral',
  'Axial', 'Parte inferior de la espalda', 'Transmite cargas del tronco y permite flexión y extensión.',
  'Cuerpo vertebral voluminoso.',
  'La región lumbar soporta cargas elevadas y es frecuente sede de dolor.')
add('Sacro', 'Columna vertebral', 'Axial', 'Parte posterior de la pelvis',
  'Transmite el peso de la columna a la cintura pélvica.',
  'Promontorio, agujeros sacros y superficie auricular.',
  'En el adulto cuenta como un hueso por fusión de cinco vértebras sacras.')
add('Cóccix', 'Columna vertebral', 'Axial', 'Extremo inferior de la columna',
  'Ancla ligamentos y músculos del suelo pélvico.',
  'Segmentos coccígeos fusionados.',
  'La caída sobre la región puede provocar coccigodinia.')
add('Esternón', 'Caja torácica', 'Axial', 'Centro anterior del tórax',
  'Protege órganos torácicos y articula con cartílagos costales.',
  'Manubrio, cuerpo y apófisis xifoides.',
  'El ángulo esternal ayuda a localizar la segunda costilla.')
for (let n = 1; n <= 12; n++) {
  const classification = n <= 7 ? 'verdadera' : n <= 10 ? 'falsa' : 'flotante'
  for (const side of ['derecha', 'izquierda']) {
    add('Costilla ' + n + ' ' + side, 'Caja torácica', 'Axial',
      'Pared torácica ' + side + ' · costilla ' + classification,
      'Protege corazón y pulmones, y participa en la mecánica respiratoria.',
      'Cabeza, cuello y cuerpo costal; el patrón varía según el número.',
      n <= 7 ? 'Su cartílago se une directamente al esternón.'
        : n <= 10 ? 'Se une indirectamente al esternón por el arco costal.'
        : 'No tiene unión anterior con el esternón.')
  }
}

// ESQUELETO APENDICULAR: cintura escapular (4), miembros superiores (60),
// cintura pélvica (2) y miembros inferiores (60): total 126.
pair('Clavícula', 'Cintura escapular', 'Apendicular', 'Entre esternón y hombro',
  'Mantiene el hombro separado del tronco y transmite fuerzas.',
  'Extremos esternal y acromial.',
  'Las fracturas de clavícula son frecuentes por caídas sobre el hombro.')
pair('Escápula', 'Cintura escapular', 'Apendicular', 'Región posterior del hombro',
  'Da inserción a músculos y forma la cavidad glenoidea.',
  'Espina, acromion y cavidad glenoidea.',
  'El movimiento escapular participa en la elevación del brazo.')
pair('Húmero', 'Miembro superior', 'Apendicular', 'Brazo entre hombro y codo',
  'Permite los movimientos del hombro y forma la articulación del codo.',
  'Cabeza humeral, tubérculos y epicóndilos.',
  'El nervio radial se relaciona con el surco del húmero.')
pair('Radio', 'Miembro superior', 'Apendicular', 'Antebrazo, lado del pulgar',
  'Participa en flexión del codo y pronosupinación.',
  'Cabeza radial y apófisis estiloides.',
  'Una caída sobre la mano puede provocar fractura distal del radio.')
pair('Cúbito (ulna)', 'Miembro superior', 'Apendicular', 'Antebrazo, lado del meñique',
  'Estabiliza el codo y participa en pronosupinación.',
  'Olécranon y apófisis coronoides.',
  'El olécranon forma la prominencia posterior del codo.')
for (const [name, landmark, note] of [
  ['Escafoides', 'Fila proximal, lado radial.', 'Puede fracturarse tras caída sobre la mano y tener compromiso vascular.'],
  ['Semilunar', 'Fila proximal, centro.', 'Participa en la articulación radiocarpiana.'],
  ['Piramidal (triquetro)', 'Fila proximal, lado cubital.', 'Se articula con el pisiforme.'],
  ['Pisiforme', 'Hueso sesamoideo de la fila proximal.', 'Está en el tendón del flexor cubital del carpo.'],
  ['Trapecio', 'Fila distal, base del pulgar.', 'Contribuye a la articulación carpometacarpiana del pulgar.'],
  ['Trapezoide', 'Fila distal, base del índice.', 'Es pequeño y relativamente estable.'],
  ['Grande (capitado)', 'Fila distal, centro.', 'Es el hueso más grande del carpo.'],
  ['Ganchoso (hamato)', 'Fila distal, lado cubital.', 'Su gancho se relaciona con el canal de Guyon.'],
] as const) pair(name, 'Miembro superior', 'Apendicular', 'Muñeca, carpo',
  'Contribuye a la movilidad y estabilidad de la muñeca.', landmark, note)
const fingers = ['pulgar', 'índice', 'medio', 'anular', 'meñique']
for (let n = 1; n <= 5; n++) for (const side of ['derecho', 'izquierdo']) {
  add('Metacarpiano ' + n + ' ' + side, 'Miembro superior', 'Apendicular',
    'Palma de la mano, radio ' + n, 'Da soporte a la mano y permite la prensión.',
    'Base, cuerpo y cabeza del metacarpiano.', 'Participa en la articulación metacarpofalángica.')
}
for (const finger of fingers) {
  const segments = finger === 'pulgar' ? ['proximal', 'distal'] : ['proximal', 'media', 'distal']
  for (const segment of segments) for (const side of ['derecha', 'izquierda']) {
    add('Falange ' + segment + ' del ' + finger + ' ' + side, 'Miembro superior',
      'Apendicular', 'Dedo ' + finger + ' de la mano',
      'Permite prensión fina y movimientos digitales.',
      'Base, cuerpo y cabeza de la falange.',
      finger === 'pulgar' ? 'El pulgar tiene dos falanges.' : 'Este dedo tiene tres falanges.')
  }
}
pair('Coxal', 'Cintura pélvica', 'Apendicular', 'Lado de la pelvis',
  'Transmite cargas al miembro inferior y protege vísceras pélvicas.',
  'Ilion, isquion y pubis fusionados; acetábulo.',
  'En el adulto las tres partes fusionadas forman un hueso coxal.')
pair('Fémur', 'Miembro inferior', 'Apendicular', 'Muslo, entre cadera y rodilla',
  'Soporta peso y permite la marcha.',
  'Cabeza, cuello, trocánteres y cóndilos.',
  'Las fracturas del cuello femoral son relevantes en adultos mayores.')
pair('Rótula (patela)', 'Miembro inferior', 'Apendicular', 'Parte anterior de la rodilla',
  'Mejora la palanca del cuádriceps y protege la rodilla.',
  'Base, vértice y cara articular posterior.',
  'Es un hueso sesamoideo integrado en el tendón del cuádriceps.')
pair('Tibia', 'Miembro inferior', 'Apendicular', 'Pierna, lado medial',
  'Soporta la mayor parte del peso de la pierna.',
  'Meseta tibial, tuberosidad tibial y maléolo medial.',
  'Forma la parte medial del tobillo y participa en la rodilla.')
pair('Peroné (fíbula)', 'Miembro inferior', 'Apendicular', 'Pierna, lado lateral',
  'Contribuye a la estabilidad del tobillo y a inserciones musculares.',
  'Cabeza y maléolo lateral.',
  'Soporta una porción menor de carga que la tibia.')
for (const [name, landmark, note] of [
  ['Astrágalo (talus)', 'Tróclea del astrágalo.', 'Transmite peso entre tibia y pie.'],
  ['Calcáneo', 'Tuberosidad calcánea.', 'Es el hueso del talón y recibe el tendón calcáneo.'],
  ['Navicular (escafoides tarsal)', 'Tuberosidad navicular.', 'Participa en el arco longitudinal medial.'],
  ['Cuboides', 'Surco del fibular largo.', 'Contribuye a la columna lateral del pie.'],
  ['Cuneiforme medial', 'Cuña medial del tarso.', 'Se articula con el primer metatarsiano.'],
  ['Cuneiforme intermedio', 'Cuña central del tarso.', 'Se articula con el segundo metatarsiano.'],
  ['Cuneiforme lateral', 'Cuña lateral del tarso.', 'Se articula con el tercer metatarsiano.'],
] as const) pair(name, 'Miembro inferior', 'Apendicular', 'Retropié o mediopié, tarso',
  'Contribuye a sostén, equilibrio y distribución de cargas.', landmark, note)
for (let n = 1; n <= 5; n++) for (const side of ['derecho', 'izquierdo']) {
  add('Metatarsiano ' + n + ' ' + side, 'Miembro inferior', 'Apendicular',
    'Antepié, radio ' + n, 'Distribuye cargas durante apoyo y marcha.',
    'Base, cuerpo y cabeza metatarsiana.',
    'Las lesiones por sobrecarga pueden producir fracturas por estrés.')
}
const toes = ['dedo gordo (hallux)', 'segundo dedo', 'tercer dedo', 'cuarto dedo', 'quinto dedo']
for (const toe of toes) {
  const segments = toe.startsWith('dedo gordo') ? ['proximal', 'distal'] : ['proximal', 'media', 'distal']
  for (const segment of segments) for (const side of ['derecha', 'izquierda']) {
    add('Falange ' + segment + ' del ' + toe + ' ' + side,
      'Miembro inferior', 'Apendicular', 'Dedo del pie: ' + toe,
      'Contribuye al equilibrio y al impulso de la marcha.',
      'Base, cuerpo y cabeza de la falange.',
      toe.startsWith('dedo gordo') ? 'El hallux tiene dos falanges.' : 'Este dedo tiene tres falanges.')
  }
}

export const bones: readonly Bone[] = catalogue
export const boneGroups = [
  'Cráneo', 'Cara', 'Oído medio', 'Cuello', 'Columna vertebral', 'Caja torácica',
  'Cintura escapular', 'Miembro superior', 'Cintura pélvica', 'Miembro inferior',
] as const

if (catalogue.length !== 206 || catalogue.filter(b => b.division === 'Axial').length !== 80) {
  throw new Error('La biblioteca debe contener exactamente 80 huesos axiales y 126 apendiculares.')
}
