import { useState } from 'react'
import {
  Activity,
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  Map,
  Menu,
  Network,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  Target,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import {
  type Area,
  type ClinicalCase,
  type Database,
  type Position,
  resultScore,
  safeUrl,
} from './model'
import { localRepository } from './services/repository'
import { Admin } from './components/Admin'
import { Modal } from './components/Modal'
import { Simulator } from './components/Simulator'
import './styles.css'
type Page =
  | 'inicio'
  | 'hospital'
  | 'academia'
  | 'actividades'
  | 'organigrama'
  | 'resultados'
  | 'admin'
const navigation = [
  { id: 'inicio', label: 'Panel de bienvenida', icon: LayoutDashboard },
  { id: 'hospital', label: 'Explorar el hospital', icon: Building2 },
  { id: 'academia', label: 'Mi recorrido académico', icon: GraduationCap },
  { id: 'actividades', label: 'Simulaciones y prácticas', icon: Stethoscope },
  { id: 'organigrama', label: 'Equipo y organigrama', icon: Network },
  { id: 'resultados', label: 'Mis resultados', icon: Trophy },
  { id: 'admin', label: 'Administración', icon: SlidersHorizontal },
] as const
export default function App() {
  const [initial] = useState(() => localRepository.load())
  const [data, setData] = useState(initial.data)
  const [warning, setWarning] = useState(initial.warning || '')
  const [page, setPage] = useState<Page>('inicio')
  const [mobile, setMobile] = useState(false)
  const [area, setArea] = useState<Area | null>(null)
  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null)
  const [career, setCareer] = useState('')
  const [subject, setSubject] = useState('')
  const [unit, setUnit] = useState('')
  const [search, setSearch] = useState('')
  const [hospitalView, setHospitalView] = useState<'mapa' | 'fichas'>('mapa')
  const [caseArea, setCaseArea] = useState('')
  function commit(next: Database) {
    localRepository.save(next)
    setData(next)
    setWarning('')
  }
  function go(next: Page) {
    setPage(next)
    setMobile(false)
    setSearch('')
    document.getElementById('contenido')?.focus()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const activeAreas = data.areas.filter((a) => a.active)
  const available = data.cases.filter(
    (c) => c.active && activeAreas.some((a) => a.id === c.areaId),
  )
  const completed = new Set(data.attempts.map((a) => a.caseId))
  const completedAvailable = available.filter((c) => completed.has(c.id)).length
  const average = resultScore(data.attempts.map((a) => a.score))
  const subjectList = data.subjects.filter(
    (s) => !career || s.careerId === career || !s.careerId,
  )
  const selectedUnit = data.units.find((u) => u.id === unit)
  const nameOf = (
    collection: 'careers' | 'subjects' | 'units' | 'areas',
    id: string,
  ) => data[collection].find((r) => r.id === id)?.name || 'Interdisciplinario'
  const cards = (items: ClinicalCase[]) =>
    items.length ? (
      <div className="case-grid">
        {items.map((c, i) => (
          <article className="case-card" key={c.id}>
            <div className={`case-art art-${i % 3}`}>
              <Stethoscope size={38} />
              <span>{c.type}</span>
              {completed.has(c.id) && (
                <span className="completed">
                  <Check size={14} /> Realizada
                </span>
              )}
            </div>
            <div className="case-content">
              <div className="section-line">
                <span className="badge">{c.difficulty}</span>
                <span className="muted small">{c.steps.length} decisiones</span>
              </div>
              <h3>{c.name}</h3>
              <p>{c.description}</p>
              <p className="small muted">
                {nameOf('subjects', c.subjectId)} · {nameOf('areas', c.areaId)}
              </p>
              <button className="text-button" onClick={() => setCurrentCase(c)}>
                {completed.has(c.id)
                  ? 'Volver a practicar'
                  : 'Comenzar actividad'}{' '}
                <ArrowRight size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="empty">
        <BookOpen size={32} />
        <h3>Aún no hay actividades en esta selección</h3>
        <p>
          Puedes leer los contenidos o crear una actividad desde Administración.
        </p>
      </div>
    )
  function positionNode(p: Position, depth = 0): React.ReactNode {
    const children = data.positions.filter((c) => c.parentId === p.id)
    return (
      <li key={p.id}>
        <article className={`org-node depth-${Math.min(depth, 2)}`}>
          <span className="eyebrow">
            {data.areas.find((a) => a.id === p.areaId)?.name ||
              'Hospital virtual'}
          </span>
          <h3>{p.name}</h3>
          <p>{p.responsibilities}</p>
          <div className="org-people">
            {data.people
              .filter((person) => person.positionId === p.id)
              .map((person) => (
                <span key={person.id}>
                  <Users size={14} />
                  {person.name}
                </span>
              ))}
            {!data.people.some((person) => person.positionId === p.id) && (
              <span>Cargo ficticio disponible</span>
            )}
          </div>
        </article>
        {children.length > 0 && (
          <ul>{children.map((c) => positionNode(c, depth + 1))}</ul>
        )}
      </li>
    )
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      {mobile && (
        <button
          className="sidebar-scrim"
          onClick={() => setMobile(false)}
          aria-label="Cerrar menú"
        />
      )}
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-symbol">
            <HeartPulse size={28} />
          </div>
          <div>
            HOSPITAL VIRTUAL<strong>ULEAM</strong>
            <span>APRENDER PARA CUIDAR</span>
          </div>
          <button
            className="mobile-close icon-button"
            aria-label="Cerrar navegación"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <div className="sidebar-divider" />
        <p className="nav-label">CAMPUS CLÍNICO VIRTUAL</p>
        <nav aria-label="Navegación principal">
          {navigation.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? 'nav-item active' : 'nav-item'}
              aria-current={page === n.id ? 'page' : undefined}
              onClick={() => go(n.id)}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {page === n.id && <ChevronRight size={14} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="education-mark">
            <ShieldCheck size={23} />
            <strong>
              Un entorno seguro
              <br />
              para aprender
            </strong>
          </div>
          <p>
            Solo datos ficticios.
            <br />
            Cada decisión es una oportunidad.
          </p>
          <span className="version">ETAPA 1 · PROTOTIPO EDUCATIVO</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="button-row">
            <button
              className="icon-button menu-toggle"
              aria-label="Abrir navegación"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <span className="breadcrumb">
              Hospital virtual <ChevronRight size={14} />{' '}
              <strong>{navigation.find((n) => n.id === page)?.label}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="local-indicator">
              <i /> Datos locales
            </span>
            <div className="avatar">DE</div>
            <div className="profile">
              <strong>Demo educativa</strong>
              <span>Sin inicio de sesión</span>
            </div>
          </div>
        </header>
        <main id="contenido" tabIndex={-1}>
          {warning && (
            <div role="alert" className="error">
              {warning}
              <button className="text-button" onClick={() => setWarning('')}>
                Cerrar aviso
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <p className="eyebrow">UNIVERSIDAD · SIMULACIÓN · APRENDIZAJE</p>
              <h1>
                {page === 'inicio'
                  ? data.settings[0].name
                  : navigation.find((n) => n.id === page)?.label}
              </h1>
              <p>
                {page === 'inicio'
                  ? data.settings[0].welcome
                  : page === 'hospital'
                    ? 'Descubre los espacios, las funciones y las personas que hacen posible el cuidado.'
                    : page === 'academia'
                      ? 'Conecta lo que aprendes en el aula con decisiones en el hospital.'
                      : page === 'actividades'
                        ? 'Practica a tu ritmo. Reflexiona sobre cada decisión.'
                        : page === 'organigrama'
                          ? 'Una estructura ficticia para aprender a trabajar en equipo.'
                          : page === 'resultados'
                            ? 'Tu aprendizaje, una práctica a la vez.'
                            : 'Organiza el hospital y sus contenidos desde un único lugar.'}
              </p>
            </div>
            <span className="stage-badge">
              <span /> ETAPA 1
            </span>
          </div>
          {page === 'inicio' && (
            <>
              <section className="welcome-hero">
                <div className="hero-copy">
                  <span className="hero-tag">
                    <Activity size={15} /> TU HOSPITAL, TU ESPACIO DE
                    APRENDIZAJE
                  </span>
                  <h2>
                    Aprende haciendo.
                    <br />
                    Decide con propósito.
                  </h2>
                  <p>
                    Explora un hospital general, conecta la teoría con la
                    práctica y fortalece tu razonamiento clínico en un entorno
                    de simulación.
                  </p>
                  <div className="button-row">
                    <button
                      className="white-button"
                      onClick={() => go('academia')}
                    >
                      Comenzar mi recorrido <ArrowRight size={17} />
                    </button>
                    <button
                      className="hero-link"
                      onClick={() => go('hospital')}
                    >
                      Explorar hospital <ChevronRight size={17} />
                    </button>
                  </div>
                  <span className="hero-foot">
                    <ShieldCheck size={15} /> Sin pacientes reales · Sin
                    servicios de pago
                  </span>
                </div>
                <div className="hospital-illustration" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="float-pill pill-one">
                    <HeartPulse size={18} /> Cuidado integral
                  </div>
                  <div className="building">
                    <div className="building-top">
                      <span>+</span>
                    </div>
                    <div className="building-name">HOSPITAL VIRTUAL</div>
                    <div className="windows">
                      {Array.from({ length: 12 }, (_, i) => (
                        <i key={i} />
                      ))}
                    </div>
                    <div className="door">
                      <i />
                      <i />
                    </div>
                  </div>
                  <div className="building-wing left-wing">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="building-wing right-wing">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="ground" />
                  <div className="float-pill pill-two">
                    <Check size={17} /> Aprende a tu ritmo
                  </div>
                </div>
              </section>
              <section
                className="stats-grid"
                aria-label="Indicadores del hospital"
              >
                {[
                  {
                    label: 'Áreas hospitalarias',
                    value: activeAreas.length,
                    icon: Building2,
                    color: 'blue',
                    detail: 'Espacios para explorar',
                  },
                  {
                    label: 'Carreras conectadas',
                    value: data.careers.length,
                    icon: GraduationCap,
                    color: 'green',
                    detail: 'Aprendizaje interdisciplinario',
                  },
                  {
                    label: 'Actividades disponibles',
                    value: available.length,
                    icon: ClipboardList,
                    color: 'purple',
                    detail: 'Decisiones con retroalimentación',
                  },
                  {
                    label: 'Tu progreso',
                    value: `${completedAvailable}/${available.length}`,
                    icon: Target,
                    color: 'orange',
                    detail: 'Actividades realizadas',
                  },
                ].map((s) => (
                  <article className="stat-card" key={s.label}>
                    <div className={`stat-icon ${s.color}`}>
                      <s.icon size={22} />
                    </div>
                    <div>
                      <p>{s.label}</p>
                      <strong>{s.value}</strong>
                      <span>{s.detail}</span>
                    </div>
                  </article>
                ))}
              </section>
              <div className="dashboard-columns">
                <section className="panel route-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">ELIGE TU CAMINO</p>
                      <h2>¿Por dónde empezamos?</h2>
                    </div>
                    <BookOpen size={23} />
                  </div>
                  <div className="route-options">
                    {data.careers.map((c, i) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCareer(c.id)
                          setSubject('')
                          setUnit('')
                          go('academia')
                        }}
                      >
                        <div
                          className={`route-icon ${i % 2 ? 'green' : 'blue'}`}
                        >
                          {i % 2 ? <Activity /> : <HeartPulse />}
                        </div>
                        <div>
                          <h3>{c.name}</h3>
                          <p>
                            {
                              data.subjects.filter((s) => s.careerId === c.id)
                                .length
                            }{' '}
                            asignaturas · Teoría y práctica
                          </p>
                        </div>
                        <ChevronRight size={18} />
                      </button>
                    ))}
                  </div>
                  <button
                    className="text-button"
                    onClick={() => {
                      setCareer('')
                      setSubject('')
                      setUnit('')
                      go('academia')
                    }}
                  >
                    Ver toda la oferta académica <ArrowRight size={15} />
                  </button>
                </section>
                <section className="progress-panel">
                  <span className="badge">MI APRENDIZAJE</span>
                  <h2>Cada práctica cuenta</h2>
                  <p>
                    Construye confianza con decisiones informadas y vuelve a
                    intentarlo cuando lo necesites.
                  </p>
                  <div className="section-line">
                    <strong>{data.attempts.length} intentos registrados</strong>
                    <span>{average}/100 promedio</span>
                  </div>
                  <progress
                    value={completedAvailable}
                    max={available.length || 1}
                    aria-label="Actividades completadas"
                  />
                  <button
                    className="text-button"
                    onClick={() => go('resultados')}
                  >
                    Ver mis resultados <ArrowRight size={16} />
                  </button>
                </section>
              </div>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">DEL CONOCIMIENTO A LA ACCIÓN</p>
                  <h2>Tu próxima experiencia</h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => go('actividades')}
                >
                  Ver todas <ArrowRight size={16} />
                </button>
              </div>
              {cards(available.slice(0, 3))}
            </>
          )}
          {page === 'hospital' && (
            <>
              <div className="toolbar">
                <label className="search-label">
                  Buscar un departamento
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ej. Triaje, Fisioterapia…"
                  />
                </label>
                <div className="segmented">
                  <button
                    className={hospitalView === 'mapa' ? 'active' : ''}
                    onClick={() => setHospitalView('mapa')}
                  >
                    <Map size={16} /> Mapa
                  </button>
                  <button
                    className={hospitalView === 'fichas' ? 'active' : ''}
                    onClick={() => setHospitalView('fichas')}
                  >
                    <Building2 size={16} /> Fichas
                  </button>
                </div>
              </div>
              {hospitalView === 'mapa' && (
                <div className="map-caption">
                  <span className="badge">PLANO ESQUEMÁTICO INTERACTIVO</span>
                  <p>
                    No representa un edificio real. Selecciona un área para
                    explorar su ficha.
                  </p>
                </div>
              )}
              <div
                className={
                  hospitalView === 'mapa' ? 'hospital-map' : 'area-grid'
                }
              >
                {activeAreas
                  .filter((a) =>
                    a.name.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((a, i) => (
                    <button
                      className="area-card"
                      key={a.id}
                      onClick={() => setArea(a)}
                    >
                      <div className="section-line">
                        <span className="area-number">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <Building2 size={21} />
                      </div>
                      <h3>{a.name}</h3>
                      {hospitalView === 'fichas' && <p>{a.description}</p>}
                      <span className="small">
                        {available.filter((c) => c.areaId === a.id).length}{' '}
                        actividades <ArrowRight size={14} />
                      </span>
                    </button>
                  ))}
              </div>
              {!activeAreas.some((a) =>
                a.name.toLowerCase().includes(search.toLowerCase()),
              ) && (
                <p className="empty">
                  No hay áreas que coincidan con la búsqueda.
                </p>
              )}
            </>
          )}
          {page === 'academia' && (
            <>
              <section className="panel academic-select">
                <div className="journey">
                  <span className={!career ? 'current' : ''}>1. Carrera</span>
                  <ChevronRight size={16} />
                  <span className={career && !subject ? 'current' : ''}>
                    2. Asignatura
                  </span>
                  <ChevronRight size={16} />
                  <span className={subject ? 'current' : ''}>
                    3. Unidad y práctica
                  </span>
                </div>
                <div className="form-grid">
                  <label>
                    Carrera
                    <select
                      value={career}
                      onChange={(e) => {
                        setCareer(e.target.value)
                        setSubject('')
                        setUnit('')
                      }}
                    >
                      <option value="">Todas las carreras</option>
                      {data.careers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Asignatura
                    <select
                      value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value)
                        setUnit('')
                      }}
                    >
                      <option value="">Selecciona una asignatura</option>
                      {subjectList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {!s.careerId
                            ? ' · Carrera sin asignar'
                            : ' · ' + nameOf('careers', s.careerId)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {subject && (
                  <p className="muted small">
                    Docente de referencia:{' '}
                    {data.people.find(
                      (p) =>
                        p.id ===
                        data.subjects.find((s) => s.id === subject)
                          ?.referenceTeacherId,
                    )?.name || 'Sin asignar'}
                    . Administración central única.
                  </p>
                )}
              </section>
              {!subject ? (
                <div className="subject-grid">
                  {subjectList.map((s) => (
                    <button
                      className="subject-card"
                      key={s.id}
                      onClick={() => {
                        setSubject(s.id)
                        setUnit('')
                      }}
                    >
                      <BookOpen size={25} />
                      <span className="eyebrow">
                        {s.careerId
                          ? nameOf('careers', s.careerId)
                          : 'CARRERA POR ASIGNAR'}
                      </span>
                      <h3>{s.name}</h3>
                      <p>
                        {data.units.filter((u) => u.subjectId === s.id).length}{' '}
                        unidades disponibles
                      </p>
                      <span className="text-button">
                        Explorar asignatura <ArrowRight size={15} />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="section-heading">
                    <h2>Unidades de aprendizaje</h2>
                  </div>
                  <div className="unit-tabs">
                    {data.units
                      .filter((u) => u.subjectId === subject)
                      .map((u) => (
                        <button
                          key={u.id}
                          aria-pressed={unit === u.id}
                          className={unit === u.id ? 'active' : ''}
                          onClick={() => setUnit(u.id)}
                        >
                          {u.name}
                        </button>
                      ))}
                  </div>
                  {!data.units.some((u) => u.subjectId === subject) && (
                    <p className="empty">
                      Esta asignatura aún no tiene unidades. Puedes crearlas en
                      Administración.
                    </p>
                  )}
                  {selectedUnit && (
                    <article className="panel content-panel">
                      <span className="eyebrow">CONTENIDO DE LA UNIDAD</span>
                      <h2>{selectedUnit.name}</h2>
                      <p className="pre-line">{selectedUnit.content}</p>
                      {safeUrl(selectedUnit.mediaUrl) && (
                        <a
                          className="text-button"
                          href={safeUrl(selectedUnit.mediaUrl)!}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Abrir recurso multimedia (sitio externo){' '}
                          <ArrowRight size={16} />
                        </a>
                      )}
                    </article>
                  )}
                  <div className="section-heading">
                    <h2>
                      Actividades de {unit ? 'esta unidad' : 'la asignatura'}
                    </h2>
                  </div>
                  {cards(
                    available.filter(
                      (c) =>
                        c.subjectId === subject &&
                        (!unit || c.unitId === unit) &&
                        (!c.careerId || !career || c.careerId === career),
                    ),
                  )}
                </>
              )}
            </>
          )}
          {page === 'actividades' && (
            <>
              <div className="toolbar">
                <label className="search-label">
                  Buscar actividad
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nombre de la práctica…"
                  />
                </label>
                <label>
                  Filtrar por área
                  <select
                    value={caseArea}
                    onChange={(e) => setCaseArea(e.target.value)}
                  >
                    <option value="">Todas las áreas</option>
                    {activeAreas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {cards(
                available.filter(
                  (c) =>
                    (!caseArea || c.areaId === caseArea) &&
                    c.name.toLowerCase().includes(search.toLowerCase()),
                ),
              )}
            </>
          )}
          {page === 'organigrama' && (
            <>
              <div className="notice">
                <strong>Equipo completamente ficticio</strong>
                <p>
                  Los cargos muestran relaciones y responsabilidades educativas.
                  La asignación de cargos a usuarios reales y la colaboración se
                  incorporarán en etapas posteriores.
                </p>
              </div>
              <div className="org-tree">
                <ul>
                  {data.positions
                    .filter((p) => !p.parentId)
                    .map((p) => positionNode(p))}
                </ul>
                {data.positions.length === 0 && (
                  <p className="empty">
                    Crea cargos desde Administración para organizar el hospital.
                  </p>
                )}
              </div>
              <section className="panel">
                <h2>Personas sin cargo asignado</h2>
                {data.people
                  .filter((p) => !p.positionId)
                  .map((p) => (
                    <p key={p.id}>
                      {p.name} · {p.kind}
                    </p>
                  ))}
                {!data.people.some((p) => !p.positionId) && (
                  <p className="muted">
                    Todas las personas ficticias tienen un cargo asignado.
                  </p>
                )}
              </section>
            </>
          )}
          {page === 'resultados' && (
            <>
              <div className="stats-grid results-stats">
                {[
                  { name: 'Intentos registrados', value: data.attempts.length },
                  { name: 'Actividades realizadas', value: completedAvailable },
                  { name: 'Promedio global', value: average + '/100' },
                ].map((s) => (
                  <article className="stat-card" key={s.name}>
                    <Trophy size={25} />
                    <div>
                      <p>{s.name}</p>
                      <strong>{s.value}</strong>
                    </div>
                  </article>
                ))}
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Historial de aprendizaje</h2>
                  <span className="badge">Solo en este navegador</span>
                </div>
                {!data.attempts.length ? (
                  <div className="empty">
                    <Trophy size={35} />
                    <h3>Tu primera práctica te espera</h3>
                    <p>Completa una actividad para ver tu resultado aquí.</p>
                    <button
                      className="primary"
                      onClick={() => go('actividades')}
                    >
                      Elegir actividad <Play size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="history">
                    {[...data.attempts].reverse().map((a) => (
                      <details key={a.id}>
                        <summary>
                          <span>
                            <strong>{a.caseName}</strong>
                            <small>
                              {new Date(a.date).toLocaleString('es-EC')}
                            </small>
                          </span>
                          <span className="score">{a.score}/100</span>
                        </summary>
                        <div className="answer-summary">
                          {a.answers.map((answer, i) => (
                            <article key={i}>
                              <strong>{answer.step}</strong>
                              <p>
                                {answer.choice} · {answer.score}/100
                              </p>
                              <p>{answer.feedback}</p>
                            </article>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
          {page === 'admin' && <Admin data={data} commit={commit} />}
          <footer className="page-footer">
            <ShieldCheck size={19} />
            <div>
              <strong>Simulación educativa. No es un hospital real.</strong>
              <p>
                Solo información ficticia. No sustituye protocolos clínicos,
                supervisión docente ni atención profesional. Proyecto sin
                aprobación institucional declarada; sin logotipos oficiales. Los
                datos locales no se sincronizan entre dispositivos.
              </p>
            </div>
            <span>
              HOSPITAL VIRTUAL ULEAM
              <br />
              Prototipo · Etapa 1
            </span>
          </footer>
        </main>
      </div>
      {area && (
        <Modal title={area.name} onClose={() => setArea(null)}>
          <p>{area.description}</p>
          <h3>Funciones del área</h3>
          <p>{area.functions}</p>
          <h3>Roles y responsabilidades</h3>
          {data.positions
            .filter((p) => p.areaId === area.id)
            .map((p) => (
              <p key={p.id}>
                <strong>{p.name}</strong> · {p.responsibilities}
              </p>
            ))}
          {!data.positions.some((p) => p.areaId === area.id) && (
            <p className="muted">
              Sin cargos asignados. La administración puede vincularlos.
            </p>
          )}
          <h3>Actividades del departamento</h3>
          {available
            .filter((c) => c.areaId === area.id)
            .map((c) => (
              <button
                className="area-activity"
                key={c.id}
                onClick={() => {
                  setArea(null)
                  setCurrentCase(c)
                }}
              >
                {c.name}
                <ArrowRight size={17} />
              </button>
            ))}
          {!available.some((c) => c.areaId === area.id) && (
            <p className="empty">
              Espacio disponible para nuevas actividades. Puedes crearlas desde
              Administración.
            </p>
          )}
        </Modal>
      )}
      {currentCase && (
        <Modal
          title={currentCase.name}
          onClose={() => {
            if (
              window.confirm(
                '¿Salir de la actividad? Si no has finalizado, el intento no se guardará.',
              )
            )
              setCurrentCase(null)
          }}
        >
          <Simulator
            key={currentCase.id}
            item={currentCase}
            onSave={(attempt) =>
              commit({
                ...data,
                attempts: [
                  ...data.attempts.filter((a) => a.id !== attempt.id),
                  attempt,
                ],
              })
            }
            onClose={() => setCurrentCase(null)}
          />
        </Modal>
      )}
    </div>
  )
}
