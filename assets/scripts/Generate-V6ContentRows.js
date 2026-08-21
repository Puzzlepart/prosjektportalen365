/**
 * Generate-V6ContentRows.js — Prosjektveiviseren v6 (område D/E)
 *
 * Genererer <pnp:ListInstance>-blokkene for v6-innholdslistene i begge språkfilene
 * under Templates/Content/, med docs/prosjektveiviseren-v6/innhold-*.csv som kilde.
 * Én CSV per liste driver begge språk, slik at radtall og GtSortOrder aldri kommer
 * ut av takt.
 *
 * Kjøres manuelt fra repo-rot: `node assets/scripts/Generate-V6ContentRows.js`
 * Ikke del av byggekjeden. Idempotent: eksisterende v6-blokk erstattes i sin helhet.
 *
 * Datasett:
 *  - innhold-sjekkpunkter.csv → Lists/Fasesjekklistev6 (Title, GtProjectPhase, GtSortOrder)
 *  - innhold-oppgaver.csv     → Lists/Planneroppgaverv6 (Title, GtDescription, GtCategory,
 *                               GtSortOrder, GtChecklist)
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const DOCS = path.join(ROOT, 'docs', 'prosjektveiviseren-v6')
const NO_FILE = path.join(ROOT, 'Templates', 'Content', 'Portfolio_content.no-NB', 'Portfolio_content.no-NB.xml')
const EN_FILE = path.join(ROOT, 'Templates', 'Content', 'Portfolio_content.en-US', 'Portfolio_content.en-US.xml')

// GUID-ene fra Templates/Taxonomy/Taxonomy.xml (termsettet «Fase») — røres aldri.
const FASE_GUID = {
  'Idé': '6edb42ac-9aaf-4f07-9cf5-5dfdf9ab0c32',
  'Konsept': '99e85650-33de-4af4-b8db-edffbc8a310b',
  'Planlegge': 'cda4f1e1-3488-4e57-8a04-6973df239689',
  'Gjennomføre': '99d7765a-c786-4792-a1a1-866ef0f982b9',
  'Avslutte': '30e03c52-8c3e-4cfe-9b18-ca71593ce130',
  'Realisere': 'b7ba84f0-70b9-45c4-8c50-8f73bf15bbec'
}

const DATASETS = [
  {
    csv: path.join(DOCS, 'innhold-sjekkpunkter.csv'),
    targets: [
      {
        file: NO_FILE,
        legacyTitle: 'Fasesjekkliste (tidligere)',
        listInstance: '<pnp:ListInstance Title="Fasesjekkliste" Description="" DocumentTemplate="" TemplateType="100" Url="Lists/Fasesjekklistev6" EnableVersioning="true" DraftVersionVisibility="0" ContentTypesEnabled="true" EnableFolderCreation="false" EnableAttachments="false">',
        listUrl: 'Lists/Fasesjekklistev6',
        fields: (r) => [
          ['Title', r.tittel],
          ['GtProjectPhase', `${r.fase}|${FASE_GUID[r.fase]}`],
          ['GtSortOrder', r.sortorder]
        ]
      },
      {
        file: EN_FILE,
        legacyTitle: 'Phase Checklist (legacy)',
        listInstance: '<pnp:ListInstance Title="Phase Checklist" Description="" DocumentTemplate="" TemplateType="100" Url="Lists/PhaseChecklistv6" EnableVersioning="true" DraftVersionVisibility="0" ContentTypesEnabled="true" EnableFolderCreation="false" EnableAttachments="false">',
        listUrl: 'Lists/PhaseChecklistv6',
        fields: (r) => [
          ['Title', r.tittel_en],
          ['GtProjectPhase', `${r.fase_en}|${FASE_GUID[r.fase]}`],
          ['GtSortOrder', r.sortorder]
        ]
      }
    ]
  },
  {
    csv: path.join(DOCS, 'innhold-oppgaver.csv'),
    targets: [
      {
        file: NO_FILE,
        legacyTitle: 'Planneroppgaver (tidligere)',
        listInstance: '<pnp:ListInstance Title="Planneroppgaver" TemplateType="100" Url="Lists/Planneroppgaverv6" ContentTypesEnabled="true" EnableFolderCreation="false" EnableAttachments="false" EnableVersioning="true">',
        listUrl: 'Lists/Planneroppgaverv6',
        fields: (r) => [
          ['Title', r.tittel],
          ['GtDescription', r.beskrivelse],
          ['GtCategory', r.fase],
          ['GtSortOrder', r.sortorder],
          ['GtChecklist', r.sjekkliste]
        ]
      },
      {
        file: EN_FILE,
        legacyTitle: 'Planner Tasks (legacy)',
        listInstance: '<pnp:ListInstance Title="Planner Tasks" TemplateType="100" Url="Lists/PlannerTasksv6" ContentTypesEnabled="true" EnableFolderCreation="false" EnableAttachments="false" EnableVersioning="true">',
        listUrl: 'Lists/PlannerTasksv6',
        fields: (r) => [
          ['Title', r.tittel_en],
          ['GtDescription', r.beskrivelse_en],
          ['GtCategory', r.fase_en],
          ['GtSortOrder', r.sortorder],
          ['GtChecklist', r.sjekkliste_en]
        ]
      }
    ]
  }
]

function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') inQuotes = false
      else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); if (row.some(Boolean)) rows.push(row); row = []; field = '' }
    else field += c
  }
  if (field || row.length) { row.push(field); if (row.some(Boolean)) rows.push(row) }
  const header = rows.shift()
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const IND = '                ' // innrykk for ListInstance-nivået i innholdsfilene

function buildListInstance(target, rows) {
  const dataRows = rows
    .map((r) => {
      const lines = target
        .fields(r)
        .filter(([, v]) => v !== '' && v !== undefined)
        .map(([f, v]) => `${IND}            <pnp:DataValue FieldName="${f}">${escXml(v)}</pnp:DataValue>`)
      return `${IND}        <pnp:DataRow>\n${lines.join('\n')}\n${IND}        </pnp:DataRow>`
    })
    .join('\n')
  return (
    `${IND}${target.listInstance}\n` +
    `${IND}    <pnp:DataRows KeyColumn="Title" UpdateBehavior="Skip">\n` +
    dataRows + '\n' +
    `${IND}    </pnp:DataRows>\n` +
    `${IND}</pnp:ListInstance>`
  )
}

for (const dataset of DATASETS) {
  const rows = parseCsv(fs.readFileSync(dataset.csv, 'utf8'))
  console.log(`Leser ${rows.length} rader fra ${path.relative(ROOT, dataset.csv)}`)
  for (const r of rows) {
    if (!FASE_GUID[r.fase]) throw new Error(`Ukjent fase «${r.fase}» i ${dataset.csv}`)
  }
  for (const target of dataset.targets) {
    let xml = fs.readFileSync(target.file, 'utf8')
    const block = buildListInstance(target, rows)

    // Fjern eventuell eksisterende v6-blokk (idempotens) — matcher på liste-URL
    const existing = new RegExp(
      `[ \\t]*<pnp:ListInstance [^>]*Url="${target.listUrl}"[\\s\\S]*?</pnp:ListInstance>\\n?`
    )
    xml = xml.replace(existing, '')

    // Sett inn rett etter legacy-blokken
    const legacyStart = xml.indexOf(`<pnp:ListInstance Title="${target.legacyTitle}"`)
    if (legacyStart < 0) throw new Error(`Fant ikke legacy-blokken i ${target.file}`)
    const legacyEnd = xml.indexOf('</pnp:ListInstance>', legacyStart)
    if (legacyEnd < 0) throw new Error(`Fant ikke slutten på legacy-blokken i ${target.file}`)
    const insertAt = legacyEnd + '</pnp:ListInstance>'.length
    xml = xml.slice(0, insertAt) + '\n' + block + xml.slice(insertAt)

    fs.writeFileSync(target.file, xml)
    console.log(`${path.relative(ROOT, target.file)}: skrev ${rows.length} DataRows til ${target.listUrl}`)
  }
}
