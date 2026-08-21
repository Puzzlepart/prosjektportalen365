/**
 * Generate-V6ContentRows.js — Prosjektveiviseren v6 (område D/E)
 *
 * Genererer <pnp:ListInstance>-blokkene for v6-innholdslistene i begge språkfilene
 * under Templates/Content/, med docs/prosjektveiviseren-v6/innhold-*.csv som kilde.
 * Én CSV driver begge språk, slik at radtall og GtSortOrder aldri kommer ut av takt.
 *
 * Kjøres manuelt fra repo-rot: `node assets/scripts/Generate-V6ContentRows.js`
 * Ikke del av byggekjeden. Idempotent: eksisterende v6-blokk erstattes i sin helhet.
 *
 * Støtter i dag: Planneroppgaver (innhold-oppgaver.csv → Lists/Planneroppgaverv6).
 * Fasesjekkliste (innhold-sjekkpunkter.csv → Lists/Fasesjekklistev6) legges til når
 * innholdet er godkjent i M1.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const CSV = path.join(ROOT, 'docs', 'prosjektveiviseren-v6', 'innhold-oppgaver.csv')

const TARGETS = [
  {
    file: path.join(ROOT, 'Templates', 'Content', 'Portfolio_content.no-NB', 'Portfolio_content.no-NB.xml'),
    listTitle: 'Planneroppgaver',
    listUrl: 'Lists/Planneroppgaverv6',
    legacyTitle: 'Planneroppgaver (tidligere)',
    cols: { tittel: 'tittel', beskrivelse: 'beskrivelse', sjekkliste: 'sjekkliste', fase: 'fase' }
  },
  {
    file: path.join(ROOT, 'Templates', 'Content', 'Portfolio_content.en-US', 'Portfolio_content.en-US.xml'),
    listTitle: 'Planner Tasks',
    listUrl: 'Lists/PlannerTasksv6',
    legacyTitle: 'Planner Tasks (legacy)',
    cols: { tittel: 'tittel_en', beskrivelse: 'beskrivelse_en', sjekkliste: 'sjekkliste_en', fase: 'fase_en' }
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

function buildListInstance(target, tasks) {
  const rows = tasks
    .map((t) => {
      const values = [
        ['Title', t[target.cols.tittel]],
        ['GtDescription', t[target.cols.beskrivelse]],
        ['GtCategory', t[target.cols.fase]],
        ['GtSortOrder', t.sortorder],
        ['GtChecklist', t[target.cols.sjekkliste]]
      ]
      const lines = values
        .filter(([, v]) => v !== '')
        .map(([f, v]) => `${IND}            <pnp:DataValue FieldName="${f}">${escXml(v)}</pnp:DataValue>`)
      return `${IND}        <pnp:DataRow>\n${lines.join('\n')}\n${IND}        </pnp:DataRow>`
    })
    .join('\n')
  return (
    `${IND}<pnp:ListInstance Title="${escXml(target.listTitle)}" TemplateType="100" Url="${target.listUrl}" ContentTypesEnabled="true" EnableFolderCreation="false" EnableAttachments="false" EnableVersioning="true">\n` +
    `${IND}    <pnp:DataRows KeyColumn="Title" UpdateBehavior="Skip">\n` +
    rows + '\n' +
    `${IND}    </pnp:DataRows>\n` +
    `${IND}</pnp:ListInstance>`
  )
}

const tasks = parseCsv(fs.readFileSync(CSV, 'utf8'))
console.log(`Leser ${tasks.length} oppgaver fra ${path.relative(ROOT, CSV)}`)

for (const target of TARGETS) {
  let xml = fs.readFileSync(target.file, 'utf8')
  const block = buildListInstance(target, tasks)

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
  console.log(`${path.relative(ROOT, target.file)}: skrev ${tasks.length} DataRows til ${target.listUrl}`)
}
