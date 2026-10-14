import { realpathSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { inspect } from 'node:util'

/**
 * One event of the `node:test` reporter stream. Typed here rather than through
 * `node:test/reporters`: the package's `@types/node` (22) lacks fields Node 26 sends.
 */
export interface IReporterEvent {
  type: string
  data?: unknown
}

/** What became of a test or suite. */
export type Status = 'passed' | 'failed' | 'cancelled' | 'skipped' | 'todo'

/** A failure as the report shows it: the error text, and its stack frames apart. */
export interface IReportError {
  /** Node's classification, such as `hookFailed` or `testTimeoutFailure`. */
  failureType?: string
  message: string
  stack?: string
}

/** A test or a suite (`describe`), with its children in declaration order. */
export interface IReportNode {
  name: string
  kind: 'suite' | 'test'
  status: Status
  durationMs: number
  line?: number
  /** The skip or todo reason, or what a status without an error means. */
  note?: string
  error?: IReportError
  /** `t.diagnostic()` lines. */
  diagnostics: string[]
  children: IReportNode[]
}

/** A test file, its tests, and what it wrote to stdout and stderr. */
export interface IReportFile {
  /** Relative to the repository root. */
  path: string
  nodes: IReportNode[]
  output: Array<{ stream: 'stdout' | 'stderr'; text: string }>
  /** Diagnostics of the file itself, such as asynchronous activity after a test ended. */
  warnings: string[]
  /** The file threw while loading, so none of its tests ran; its error is in `output`. */
  loadFailed: boolean
}

/** Node's totals for the run, from its final `test:summary`. Suites are not counted. */
export interface IReportSummary {
  success: boolean
  counts: Record<'tests' | 'passed' | 'failed' | 'cancelled' | 'skipped' | 'todo', number>
  durationMs: number
}

/** Everything the page shows. */
export interface IReport {
  files: IReportFile[]
  summary?: IReportSummary
  /** Events the reporter could not read: shown, so a reporter bug never hides a result. */
  readErrors: string[]
}

/** Where the run came from, for the page's header. */
export interface IReportContext {
  title: string
  generatedAt: Date
  branch?: string
  commit?: string
  runUrl?: string
}

type Data = Record<string, unknown>

function isRecord(value: unknown): value is Data {
  return typeof value === 'object' && value !== null
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/**
 * The repository root, which paths in the report are made relative to: the workspace in CI, else
 * the parent of the working directory (`integration/`). Node reports real paths, so this is one
 * too (on macOS `/tmp` is a link).
 */
export function repositoryRoot(): string {
  const root = process.env.GITHUB_WORKSPACE || resolve(process.cwd(), '..')
  try {
    return realpathSync(root)
  } catch {
    return root
  }
}

/**
 * Collects the reporter stream into an {@link IReport}. The tree is built from the events Node
 * reports in declaration order (`test:start`, then `test:pass` or `test:fail`, a stack per file by
 * nesting): `test:complete` comes in execution order, `test:dequeue` misreports its `type` for
 * queued siblings, and `testId` repeats across files. A file's stdout and stderr cannot be tied to
 * one test, so they stay with the file.
 *
 * @param root Repository root, see {@link repositoryRoot}
 * @param cwd Directory `node --test` runs in, which stdout and stderr paths are relative to
 */
export function createReportCollector(root: string, cwd = process.cwd()) {
  const files = new Map<string, IReportFile>()
  const stacks = new Map<string, IReportNode[]>()
  const lastCompleted = new Map<string, { node: IReportNode; nesting: number }>()
  const report: IReport = { files: [], readErrors: [] }

  function fileFor(absolute: string): IReportFile {
    const path = relative(root, absolute).split('\\').join('/')
    let file = files.get(path)
    if (!file) {
      file = { path, nodes: [], output: [], warnings: [], loadFailed: false }
      files.set(path, file)
      report.files.push(file)
    }
    return file
  }

  function attach(file: IReportFile, node: IReportNode, nesting: number) {
    const stack = stacks.get(file.path) ?? []
    const parent = nesting > 0 ? stack[nesting - 1] : undefined
    ;(parent ? parent.children : file.nodes).push(node)
    stack.length = nesting
    stack[nesting] = node
    stacks.set(file.path, stack)
  }

  function start(data: Data) {
    const file = fileFor(text(data.file) ?? '')
    const nesting = number(data.nesting) ?? 0
    const node: IReportNode = {
      name: text(data.name) ?? '',
      kind: 'test',
      // Until its pass or fail arrives: a file whose process dies mid-run never sends them.
      status: 'cancelled',
      note: "did not finish: the file's process ended first",
      durationMs: 0,
      line: number(data.line),
      diagnostics: [],
      children: []
    }
    attach(file, node, nesting)
  }

  function complete(data: Data, failed: boolean) {
    const file = fileFor(text(data.file) ?? '')
    const nesting = number(data.nesting) ?? 0
    const name = text(data.name) ?? ''
    let node = stacks.get(file.path)?.[nesting]
    if (!node || node.name !== name) {
      // A pass or fail without its start: keep it rather than drop a result.
      node = { name, kind: 'test', status: 'passed', durationMs: 0, diagnostics: [], children: [] }
      attach(file, node, nesting)
    }
    const details = isRecord(data.details) ? data.details : {}
    node.kind = details.type === 'suite' ? 'suite' : 'test'
    node.durationMs = number(details.duration_ms) ?? 0
    node.line ??= number(data.line)
    node.note = undefined
    const skip = data.skip
    const todo = data.todo
    if (skip !== undefined && skip !== false) {
      node.status = 'skipped'
      node.note = text(skip)
    } else if (todo !== undefined && todo !== false) {
      node.status = 'todo'
      node.note = text(todo)
    } else if (!failed) {
      node.status = 'passed'
      if (data.expectFailure !== undefined) node.note = 'failed, as expected'
    } else {
      const error = describeFailure(details.error, root)
      if (error.failureType === 'cancelledByParent') {
        node.status = 'cancelled'
        node.note = 'cancelled: its suite failed first'
      } else if (error.failureType === 'subtestsFailed') {
        node.status = 'failed'
        node.note = error.message
      } else {
        node.status = 'failed'
        node.error = error
      }
      // Under process isolation, a file whose process fails arrives as a failed test named after
      // the file (relative to the working directory), sent by the parent process, which sets no
      // `entryFile`: it threw while loading, or it exited non-zero or was killed after its tests
      // (an unawaited rejection, process.exit). Node sends it only when no test of the file failed.
      const absolute = text(data.file)
      if (
        nesting === 0 &&
        text(data.entryFile) === undefined &&
        absolute !== undefined &&
        name === relative(cwd, absolute).split('\\').join('/')
      ) {
        const raw = isRecord(details.error) ? details.error : {}
        const signal = text(raw.signal)
        const code = number(raw.exitCode)
        const exit = signal
          ? `was killed by ${signal}`
          : code !== undefined
            ? `exited with code ${code}`
            : 'failed'
        if (file.nodes.some((other) => other !== node)) {
          node.error = {
            message:
              `The file's process ${exit} after its tests had run` +
              (file.warnings.length ? '; see the warnings above.' : '.')
          }
        } else {
          file.loadFailed = true
          node.error = {
            message:
              `The file's process ${exit} before it reported a test` +
              (file.output.length ? '; its error output is below.' : '.')
          }
        }
      }
    }
    lastCompleted.set(file.path, { node, nesting })
  }

  function diagnostic(data: Data) {
    const absolute = text(data.file)
    const message = text(data.message)
    // The run's own diagnostics (totals) have no file; the totals come from test:summary.
    if (!absolute || message === undefined) return
    const file = fileFor(absolute)
    const last = lastCompleted.get(file.path)
    if (/asynchronous activity after the test ended/.test(message)) {
      file.warnings.push(relativize(message, root))
    } else if (last && last.nesting === number(data.nesting)) {
      last.node.diagnostics.push(relativize(message, root))
    } else {
      file.warnings.push(relativize(message, root))
    }
  }

  function output(data: Data, stream: 'stdout' | 'stderr') {
    const path = text(data.file) ?? text(data.entryFile)
    const message = text(data.message)
    if (!path || message === undefined) return
    fileFor(resolve(cwd, path)).output.push({ stream, text: relativize(message, root) })
  }

  function summary(data: Data) {
    // One per file under process isolation, then the run's own without `file`.
    if (text(data.file) !== undefined) return
    const counts = isRecord(data.counts) ? data.counts : {}
    const count = (key: string) => number(counts[key]) ?? 0
    report.summary = {
      success: data.success === true,
      counts: {
        tests: count('tests'),
        passed: count('passed'),
        failed: count('failed'),
        cancelled: count('cancelled'),
        skipped: count('skipped'),
        todo: count('todo')
      },
      durationMs: number(data.duration_ms) ?? 0
    }
  }

  return {
    /** Reads one event; never throws. */
    add(event: IReporterEvent) {
      try {
        const data = isRecord(event.data) ? event.data : {}
        if (event.type === 'test:start') start(data)
        else if (event.type === 'test:pass') complete(data, false)
        else if (event.type === 'test:fail') complete(data, true)
        else if (event.type === 'test:diagnostic') diagnostic(data)
        else if (event.type === 'test:stdout') output(data, 'stdout')
        else if (event.type === 'test:stderr') output(data, 'stderr')
        else if (event.type === 'test:summary') summary(data)
      } catch (error) {
        report.readErrors.push(
          `${event.type}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    },
    report: () => report
  }
}

/**
 * Removes the repository root from paths and `file://` URLs, so the report shows
 * `integration/tests/hub.test.ts:12:5` rather than the runner's checkout.
 */
export function relativize(value: string, root: string): string {
  return value
    .split(pathToFileURL(root).href + '/')
    .join('')
    .split(root + '/')
    .join('')
}

/**
 * A `test:fail` event's error: Node's `ERR_TEST_FAILURE` wrapper, whose `cause` is what the test
 * threw. Errors cross from the file's process as plain objects (an `AssertionError` arrives as an
 * `Error` named `AssertionError`), so nothing here uses `instanceof`. The assertion's message
 * already holds its diff; `actual` and `expected` are not shown.
 */
export function describeFailure(error: unknown, root: string): IReportError {
  const failureType = isRecord(error) ? text(error.failureType) : undefined
  const cause = isRecord(error) && 'cause' in error ? error.cause : error
  const { head, frames } = describeCause(cause, 0)
  const wrapper = isRecord(error) ? text(error.message) : undefined
  // A hook's failure says which hook only in the wrapper ("failed running before hook").
  const message = failureType === 'hookFailed' && wrapper ? `${wrapper}\n\n${head}` : head
  return {
    failureType,
    message: relativize(message, root),
    stack: frames ? relativize(frames, root) : undefined
  }
}

const FRAME = /^\s+at /
// Node's own frames say nothing about the test.
const INTERNAL_FRAME = /\((node:|<anonymous>)|at (node:|new Promise)/

function describeCause(value: unknown, depth: number): { head: string; frames?: string } {
  if (depth > 4) return { head: '…' }
  if (typeof value === 'string') return { head: value }
  if (!isRecord(value) || (text(value.message) === undefined && text(value.stack) === undefined)) {
    return { head: inspect(value, { depth: 3, breakLength: 100 }) }
  }
  const name = text(value.name) ?? 'Error'
  const message = text(value.message) ?? ''
  const lines = (text(value.stack) ?? '').split('\n')
  const firstFrame = lines.findIndex((line) => FRAME.test(line))
  let head = (firstFrame < 0 ? lines : lines.slice(0, firstFrame)).join('\n').trim()
  if (!head || (message && !head.includes(message.trim()))) head = `${name}: ${message}`
  const frames =
    firstFrame < 0
      ? undefined
      : lines
          .slice(firstFrame)
          .filter((line) => !INTERNAL_FRAME.test(line))
          .join('\n') || undefined

  const extras = ['code', 'status', 'statusText', 'url']
    .filter((key) => key in value && ['string', 'number'].includes(typeof value[key]))
    .filter((key) => !(key === 'code' && head.includes(`[${String(value[key])}]`)))
    .map((key) => `${key}: ${String(value[key])}`)
  if (extras.length) head += `\n(${extras.join(', ')})`
  if (Array.isArray(value.errors)) {
    for (const inner of value.errors) head += `\n\n${describeCause(inner, depth + 1).head}`
  }
  if ('cause' in value && value.cause !== undefined) {
    head += `\n\nCaused by: ${describeCause(value.cause, depth + 1).head}`
  }
  return { head, frames }
}

/** Escapes text for HTML content and attribute values. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  if (ms < 59_950) return `${(ms / 1000).toFixed(1)} s`
  const seconds = Math.round(ms / 1000)
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`
}

function statuses(nodes: IReportNode[]): Status[] {
  return nodes.flatMap((node) => [node.status, ...statuses(node.children)])
}

/** The worst status in a tree: what a collapsed file shows. */
function worst(nodes: IReportNode[]): Status | undefined {
  const found = statuses(nodes)
  return (['failed', 'cancelled', 'passed', 'todo', 'skipped'] as const).find((status) =>
    found.includes(status)
  )
}

function fileStatus(file: IReportFile): Status {
  return file.loadFailed ? 'failed' : (worst(file.nodes) ?? 'skipped')
}

function renderError(error: IReportError): string {
  const kind = error.failureType ? `<div class="kind">${escapeHtml(error.failureType)}</div>` : ''
  const stack = error.stack
    ? `<details class="stack"><summary>Stack</summary><pre>${escapeHtml(error.stack)}</pre></details>`
    : ''
  return `<div class="error">${kind}<pre>${escapeHtml(error.message)}</pre>${stack}</div>`
}

function renderNode(node: IReportNode, id: string): string {
  const meta = [
    node.kind === 'suite' ? 'suite' : '',
    node.durationMs ? formatDuration(node.durationMs) : ''
  ]
    .filter(Boolean)
    .join(' · ')
  const note = node.note ? `<div class="note">${escapeHtml(node.note)}</div>` : ''
  const diagnostics = node.diagnostics
    .map((line) => `<div class="diagnostic">${escapeHtml(line)}</div>`)
    .join('')
  const error = node.error ? renderError(node.error) : ''
  const children = node.children.length
    ? `<ul>${node.children.map((child, index) => renderNode(child, `${id}-${index}`)).join('')}</ul>`
    : ''
  return (
    `<li id="${id}" class="node ${node.status}"><div class="row"><span class="pill ${node.status}">${node.status}</span>` +
    `<span class="name">${escapeHtml(node.name)}</span><span class="meta">${escapeHtml(meta)}</span></div>` +
    `${note}${diagnostics}${error}${children}</li>`
  )
}

function renderOutput(file: IReportFile): string {
  if (!file.output.length) return ''
  const blocks = file.output.map(
    ({ stream, text: chunk }) => `<span class="${stream}">${escapeHtml(chunk)}</span>`
  )
  const lines = file.output.reduce((sum, chunk) => sum + chunk.text.split('\n').length - 1, 0)
  return (
    `<details class="output"${file.loadFailed ? ' open' : ''}><summary>Output (${lines} lines; stderr in red)</summary>` +
    `<pre>${blocks.join('')}</pre></details>`
  )
}

/** Every failed test or suite with an error, with the path to it, for the list at the top. */
function failures(file: IReportFile, fileIndex: number) {
  const found: Array<{ path: string[]; node: IReportNode; id: string }> = []
  const visit = (node: IReportNode, path: string[], id: string) => {
    if (node.status === 'failed' && node.error) found.push({ path: [...path, node.name], node, id })
    node.children.forEach((child, index) => visit(child, [...path, node.name], `${id}-${index}`))
  }
  file.nodes.forEach((node, index) => visit(node, [], `f${fileIndex}-${index}`))
  return found
}

const STYLE = `
:root{color-scheme:light dark;--bg:#fff;--fg:#1f2328;--muted:#59636e;--line:#d1d9e0;--panel:#f6f8fa;
--passed:#1a7f37;--failed:#cf222e;--cancelled:#9a6700;--skipped:#59636e;--todo:#8250df;--errbg:#ffebe9}
@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#e6edf3;--muted:#9198a1;--line:#3d444d;--panel:#151b23;
--passed:#3fb950;--failed:#f85149;--cancelled:#d29922;--skipped:#9198a1;--todo:#ab7df8;--errbg:#25171c}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 16px 64px}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:32px 0 8px}
.context,.meta,.note,.diagnostic{color:var(--muted)}.context a{color:inherit}
.verdict{display:inline-block;margin:12px 0 4px;padding:4px 10px;border-radius:6px;font-weight:600;color:#fff}
.verdict.passed{background:var(--passed)}.verdict.failed{background:var(--failed)}
.counts span{margin-right:14px}details.file{border:1px solid var(--line);border-radius:6px;margin:8px 0;background:var(--panel)}
details.file>summary{cursor:pointer;padding:8px 12px;font-weight:600;display:flex;gap:8px;align-items:center}
details.file>.body{padding:4px 12px 12px;background:var(--bg);border-top:1px solid var(--line)}
ul{list-style:none;margin:0;padding-left:20px}.body>ul{padding-left:0}li.node{margin:4px 0}
.row{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.name{overflow-wrap:anywhere}.meta{font-size:12px}
.pill{font-size:11px;font-weight:600;text-transform:uppercase;padding:0 6px;border-radius:10px;border:1px solid currentColor;flex:none}
.pill.passed{color:var(--passed)}.pill.failed{color:var(--failed)}.pill.cancelled{color:var(--cancelled)}
.pill.skipped{color:var(--skipped)}.pill.todo{color:var(--todo)}
.note,.diagnostic{font-size:12px;margin-left:4px}.diagnostic::before{content:"# "}
.error{margin:6px 0;padding:8px 10px;border-left:3px solid var(--failed);background:var(--errbg);border-radius:4px}
.error .kind{font-size:12px;color:var(--muted)}pre{margin:4px 0;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace}
.stack summary,.output summary{cursor:pointer;font-size:12px;color:var(--muted)}.output pre .stderr{color:var(--failed)}
.failure{margin:8px 0}.failure a{color:inherit;font-weight:600}.warning{color:var(--cancelled)}`

/**
 * The report as one self-contained HTML page: no script, no external file. Its totals are also in
 * `<script type="application/json" id="report-summary">`, which the test report site reads
 * (`.tasks/publish-test-report.js`).
 */
export function renderReport(report: IReport, context: IReportContext): string {
  const summary = report.summary
  const success = summary
    ? summary.success
    : report.files.every((file) => fileStatus(file) !== 'failed')
  const counts = summary?.counts
  const countLine = summary
    ? [
        `${summary.counts.tests} tests`,
        `${summary.counts.passed} passed`,
        `${summary.counts.failed} failed`,
        summary.counts.cancelled ? `${summary.counts.cancelled} cancelled` : '',
        summary.counts.skipped ? `${summary.counts.skipped} skipped` : '',
        summary.counts.todo ? `${summary.counts.todo} todo` : '',
        formatDuration(summary.durationMs)
      ]
        .filter(Boolean)
        .map((part) => `<span>${escapeHtml(part)}</span>`)
        .join('')
    : '<span>No totals: the run did not finish.</span>'
  const contextLine = [
    context.branch ? escapeHtml(context.branch) : '',
    context.commit ? `<code>${escapeHtml(context.commit.slice(0, 7))}</code>` : '',
    context.runUrl ? `<a href="${escapeHtml(context.runUrl)}">workflow run</a>` : '',
    `generated ${escapeHtml(context.generatedAt.toISOString().replace('T', ' ').slice(0, 16))} UTC`
  ]
    .filter(Boolean)
    .join(' · ')

  const failed = report.files.flatMap((file, index) =>
    failures(file, index).map((item) => ({ ...item, file }))
  )
  const failureList = failed.length
    ? `<h2>Failures (${failed.length})</h2>` +
      failed
        .map(
          ({ file, path, node, id }) =>
            `<div class="failure"><a href="#${id}">${escapeHtml([file.path, ...path].join(' › '))}</a>` +
            `${node.error ? renderError(node.error) : ''}</div>`
        )
        .join('')
    : ''
  const loadFailures = report.files.filter((file) => file.loadFailed)
  const loadList = loadFailures.length
    ? `<h2>Files that did not load (${loadFailures.length})</h2>` +
      loadFailures.map((file) => `<div class="failure">${escapeHtml(file.path)}</div>`).join('')
    : ''
  const readErrors = report.readErrors.length
    ? `<h2 class="warning">Events the reporter could not read (${report.readErrors.length})</h2><pre>${escapeHtml(report.readErrors.join('\n'))}</pre>`
    : ''

  const fileSections = report.files
    .map((file, index) => {
      const status = fileStatus(file)
      const warnings = file.warnings
        .map((line) => `<div class="note warning">${escapeHtml(line)}</div>`)
        .join('')
      return (
        `<details class="file"${status === 'failed' || status === 'cancelled' ? ' open' : ''}>` +
        `<summary><span class="pill ${status}">${status}</span>${escapeHtml(file.path)}</summary>` +
        `<div class="body">${warnings}<ul>${file.nodes.map((node, nodeIndex) => renderNode(node, `f${index}-${nodeIndex}`)).join('')}</ul>` +
        `${renderOutput(file)}</div></details>`
      )
    })
    .join('')

  const embedded = JSON.stringify({
    success,
    counts: counts ?? null,
    durationMs: summary?.durationMs ?? null
  }).replace(/</g, '\\u003c')
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${escapeHtml(context.title)}</title><style>${STYLE}</style>` +
    `<script type="application/json" id="report-summary">${embedded}</script></head><body><main>` +
    `<h1>${escapeHtml(context.title)}</h1><div class="context">${contextLine}</div>` +
    `<div class="verdict ${success ? 'passed' : 'failed'}">${success ? 'Passed' : 'Failed'}</div>` +
    `<div class="counts">${countLine}</div>${readErrors}${loadList}${failureList}` +
    `<h2>Files (${report.files.length})</h2>${fileSections}</main></body></html>\n`
  )
}

/** The header's context from GitHub Actions' variables, when the run is in CI. */
export function contextFromEnvironment(generatedAt = new Date()): IReportContext {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_RUN_ATTEMPT } = process.env
  const runUrl =
    GITHUB_SERVER_URL && GITHUB_REPOSITORY && GITHUB_RUN_ID
      ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}` +
        (GITHUB_RUN_ATTEMPT && GITHUB_RUN_ATTEMPT !== '1' ? `/attempts/${GITHUB_RUN_ATTEMPT}` : '')
      : undefined
  return {
    title: 'PP365 integration tests',
    generatedAt,
    branch: process.env.GITHUB_REF_NAME || undefined,
    commit: process.env.GITHUB_SHA || undefined,
    runUrl
  }
}

/**
 * A `node --test` reporter that writes the run as one HTML page (`npm run test:ci` sends it to
 * `test-results/index.html`). It runs in the parent process beside the spec and JUnit reporters,
 * and never throws: a reporter that throws ends the whole run, the other reporters' output with it.
 */
export default async function* htmlReporter(
  source: AsyncIterable<IReporterEvent>
): AsyncGenerator<string> {
  const root = repositoryRoot()
  const collector = createReportCollector(root)
  for await (const event of source) collector.add(event)
  try {
    yield renderReport(collector.report(), contextFromEnvironment())
  } catch (error) {
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error)
    yield `<!doctype html><meta charset="utf-8"><title>Integration tests</title><h1>The HTML reporter failed</h1>` +
      `<p>The spec report in the job log has the results.</p><pre>${escapeHtml(message)}</pre>\n`
  }
}
