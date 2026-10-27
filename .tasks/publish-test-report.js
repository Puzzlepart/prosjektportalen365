/**
 * @fileoverview Publishes a CI test report to the test report site: a private GitHub Pages site
 * that shows the Playwright and integration reports in the browser, with no download.
 *
 * Why a site in another repository: this repository is public, so its artifacts can be downloaded
 * by anyone signed in to GitHub, and Pages here would be public too. The reports hold snapshots of
 * the test tenant, and Playwright's traces the test user's session cookies. Access-controlled Pages
 * works only from a private repository on GitHub Enterprise Cloud: the site lives on a branch of
 * one (`TEST_REPORTS_REPOSITORY`), and only people with read access to it can open it.
 *
 * Each test job calls this after its tests. It copies the report to `runs/<run id>-<attempt>/<suite>/`
 * on the site branch, writes the run's metadata beside it, drops runs older than the artifacts'
 * 7 days (and the oldest beyond the size budget), rebuilds `index.html` from what is left, and
 * pushes the result as one commit without parents, so the branch never grows a history of old
 * reports. The e2e and integration jobs run at once and both push: a push is conditional on the
 * branch being where it was fetched (`--force-with-lease`), and one that loses starts over.
 *
 * Usage, from the repo root (CI):
 *   node .tasks/publish-test-report.js --suite e2e --report e2e/playwright-report
 *     --results e2e/test-results/results.json --outcome success
 *   node .tasks/publish-test-report.js --suite integration --report integration/test-results --outcome failure
 *
 * Environment: TEST_REPORTS_REPOSITORY (owner/name), TEST_REPORTS_URL (the site's address) and
 * TEST_REPORTS_DEPLOY_KEY (an SSH deploy key with write access to that repository); COMMIT_SUBJECT;
 * GITHUB_TOKEN (the job's, for api.github.com) and GitHub's other GITHUB_* variables. Without the
 * three it says so and exits 0: the report is then only in the artifact. Before every push it
 * checks that the site is private, and refuses when it is not. TEST_REPORTS_REMOTE replaces the
 * SSH remote (and the check) with any git URL or path; the tests use a local bare repository.
 */
const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const SUITES = {
    e2e: { title: 'End-to-end', entry: 'index.html' },
    integration: { title: 'Integration', entry: 'index.html' }
}
const BRANCH = 'gh-pages'
/** As long as the artifacts are kept: the organization caps them at 7 days. */
const RETENTION_DAYS = 7
/** GitHub Pages publishes at most 1 GB; the rest is headroom for the next run. */
const MAX_SITE_BYTES = 800 * 1024 * 1024
/** git refuses files over 100 MiB. */
const MAX_FILE_BYTES = 95 * 1024 * 1024
const PUSH_ATTEMPTS = 5
/** A git call that takes longer has hung; the step's own timeout is the last resort. */
const GIT_TIMEOUT_MS = 5 * 60 * 1000

/** Parses `--name value` pairs. */
function parseArgs(argv) {
    const args = {}
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') ? 'true' : argv[++i]
    }
    return args
}

/** Total size of the files under `dir`, in bytes. */
function directorySize(dir) {
    if (!fs.existsSync(dir)) return 0
    let size = 0
    for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
        if (entry.isFile()) size += fs.statSync(path.join(entry.parentPath, entry.name)).size
    }
    return size
}

/** Reads a JSON file, or `undefined` when it is missing or not JSON. */
function readJson(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch {
        return undefined
    }
}

/**
 * The counts of a suite's report: Playwright's `results.json` stats for e2e, the summary the
 * integration reporter embeds in its page (`integration/src/reporters/html.ts`). `undefined` when
 * the report has none.
 *
 * @param {'e2e' | 'integration'} suite
 * @param {string} reportDir The report folder
 * @param {string} [resultsFile] Playwright's JSON report (e2e)
 * @returns {{ passed: number, failed: number, flaky: number, skipped: number, durationMs?: number } | undefined}
 */
function readCounts(suite, reportDir, resultsFile) {
    if (suite === 'e2e') {
        const stats = resultsFile && readJson(resultsFile)?.stats
        if (!stats) return undefined
        return {
            passed: stats.expected ?? 0,
            failed: stats.unexpected ?? 0,
            flaky: stats.flaky ?? 0,
            skipped: stats.skipped ?? 0,
            durationMs: stats.duration
        }
    }
    const page = path.join(reportDir, SUITES.integration.entry)
    if (!fs.existsSync(page)) return undefined
    const match = /<script type="application\/json" id="report-summary">(.*?)<\/script>/s.exec(fs.readFileSync(page, 'utf8'))
    let summary
    try {
        summary = match ? JSON.parse(match[1]) : undefined
    } catch {
        return undefined
    }
    const counts = summary?.counts
    if (!counts) return undefined
    return {
        passed: counts.passed ?? 0,
        failed: (counts.failed ?? 0) + (counts.cancelled ?? 0),
        flaky: 0,
        skipped: (counts.skipped ?? 0) + (counts.todo ?? 0),
        durationMs: summary.durationMs ?? undefined
    }
}

/**
 * What the site records about a run, from GitHub's variables.
 *
 * @param {NodeJS.ProcessEnv} env
 */
function runFromEnvironment(env) {
    const server = env.GITHUB_SERVER_URL || 'https://github.com'
    const repository = env.GITHUB_REPOSITORY || 'Puzzlepart/prosjektportalen365'
    const id = env.GITHUB_RUN_ID || 'local'
    const attempt = env.GITHUB_RUN_ATTEMPT || '1'
    return {
        key: `${id}-${attempt}`,
        id,
        attempt: Number(attempt),
        number: env.GITHUB_RUN_NUMBER ? Number(env.GITHUB_RUN_NUMBER) : undefined,
        url: env.GITHUB_RUN_ID ? `${server}/${repository}/actions/runs/${id}/attempts/${attempt}` : undefined,
        branch: env.GITHUB_REF_NAME || undefined,
        sha: env.GITHUB_SHA || undefined,
        commitUrl: env.GITHUB_SHA ? `${server}/${repository}/commit/${env.GITHUB_SHA}` : undefined,
        subject: env.COMMIT_SUBJECT || undefined
    }
}

/** Removes files git would refuse from a report folder, and says which. */
function dropOversizedFiles(dir, warn) {
    for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
        const file = path.join(entry.parentPath, entry.name)
        if (entry.isFile() && fs.statSync(file).size > MAX_FILE_BYTES) {
            fs.rmSync(file)
            warn(`${path.relative(dir, file)} is over ${MAX_FILE_BYTES / 1024 / 1024} MiB and was left out of the site.`)
        }
    }
}

/**
 * The tag every page of the site carries at its bottom right: the reports hold the test tenant's
 * pages and, in the traces, the test user's session, so they are for Puzzlepart only. Styled
 * inline, since it goes into Playwright's report and the integration report as well as the front
 * page, white on red at 7:1, and clicks pass through it to what lies under it.
 */
const INTERNAL_TAG =
    '<div data-pp365-internal role="note" style="position:fixed;right:16px;bottom:16px;z-index:2147483647;' +
    'pointer-events:none;padding:4px 10px;border-radius:12px;background:#a4262c;color:#fff;' +
    "font:600 12px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.3)\">" +
    'Internal only</div>'

/**
 * Puts the internal tag into a page once: before its last closing body tag, since Playwright's
 * report is one page of scripts where an earlier one can be inside a script, or at its end.
 *
 * @param {string} html
 */
function markInternal(html) {
    if (html.includes('data-pp365-internal')) return html
    const at = html.toLowerCase().lastIndexOf('</body>')
    return at === -1 ? html + INTERNAL_TAG : html.slice(0, at) + INTERNAL_TAG + html.slice(at)
}

/** Tags every report on the site as internal only, those published before the tag too. */
function markReports(siteDir) {
    for (const { suites } of listRuns(siteDir)) {
        for (const { entry } of Object.values(suites)) {
            const file = path.join(siteDir, entry)
            if (!fs.existsSync(file)) continue
            const html = fs.readFileSync(file, 'utf8')
            const marked = markInternal(html)
            if (marked !== html) fs.writeFileSync(file, marked)
        }
    }
}

/**
 * Adds a suite's report to a checked-out site, drops what is too old or too much, and rebuilds the
 * index. The current run is never dropped.
 *
 * @param {string} siteDir The site branch's working tree
 * @param {object} options
 * @param {'e2e' | 'integration'} options.suite
 * @param {string} options.reportDir The report folder to publish
 * @param {string} options.outcome The test step's outcome: success, failure, cancelled or skipped
 * @param {object} [options.counts] From {@link readCounts}
 * @param {ReturnType<typeof runFromEnvironment>} options.run
 * @param {Date} [options.now]
 * @param {number} [options.maxSiteBytes] Size budget of the runs on the site
 * @param {(message: string) => void} [options.warn]
 * @returns {string} The report's path in the site, such as `runs/123-1/e2e/index.html`
 */
function addReport(
    siteDir,
    { suite, reportDir, outcome, counts, run, now = new Date(), maxSiteBytes = MAX_SITE_BYTES, warn = () => undefined }
) {
    const runDir = path.join(siteDir, 'runs', run.key)
    const target = path.join(runDir, suite)
    fs.rmSync(target, { recursive: true, force: true })
    fs.mkdirSync(runDir, { recursive: true })
    fs.cpSync(reportDir, target, { recursive: true })
    dropOversizedFiles(target, warn)
    const entry = `runs/${run.key}/${suite}/${SUITES[suite].entry}`
    const meta = { suite, outcome, counts, publishedAt: now.toISOString(), entry, run }
    fs.writeFileSync(path.join(runDir, `${suite}.json`), JSON.stringify(meta, null, 2) + '\n')
    prune(siteDir, run.key, now, maxSiteBytes, warn)
    markReports(siteDir)
    fs.writeFileSync(path.join(siteDir, '.nojekyll'), '')
    fs.writeFileSync(path.join(siteDir, 'index.html'), renderIndex(listRuns(siteDir), now))
    return entry
}

/**
 * The runs on the site, newest first: each with the metadata of its suites.
 *
 * @param {string} siteDir
 */
function listRuns(siteDir) {
    const runsDir = path.join(siteDir, 'runs')
    if (!fs.existsSync(runsDir)) return []
    return fs
        .readdirSync(runsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
            const suites = {}
            for (const suite of Object.keys(SUITES)) {
                const meta = readJson(path.join(runsDir, entry.name, `${suite}.json`))
                if (meta) suites[suite] = meta
            }
            const metas = Object.values(suites)
            const publishedAt = metas.map((meta) => meta.publishedAt).sort().pop()
            return { key: entry.name, run: metas[0]?.run, suites, publishedAt }
        })
        .sort((a, b) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')))
}

/** Drops runs older than the retention, then the oldest while the site is over its size budget. */
function prune(siteDir, keep, now, maxSiteBytes, warn) {
    const oldest = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000
    const runs = listRuns(siteDir)
    const remove = (key) => fs.rmSync(path.join(siteDir, 'runs', key), { recursive: true, force: true })
    for (const run of runs) {
        if (run.key !== keep && (!run.publishedAt || Date.parse(run.publishedAt) < oldest)) remove(run.key)
    }
    const left = listRuns(siteDir)
    let size = directorySize(path.join(siteDir, 'runs'))
    while (size > maxSiteBytes) {
        const victim = left.filter((run) => run.key !== keep).pop()
        if (!victim) break
        size -= directorySize(path.join(siteDir, 'runs', victim.key))
        remove(victim.key)
        left.splice(left.indexOf(victim), 1)
        warn(`The site is over its size budget: dropped run ${victim.key}.`)
    }
}

/** Escapes text for HTML content and attribute values. */
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Oslo',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
})

function formatDuration(ms) {
    if (typeof ms !== 'number') return ''
    const seconds = Math.round(ms / 1000)
    return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`
}

/** One suite's cell: its verdict, counts and the link to its report. */
function renderSuiteCell(meta) {
    if (!meta) return '<td class="none">–</td>'
    const verdict = { success: 'passed', failure: 'failed', cancelled: 'cancelled', skipped: 'skipped' }[meta.outcome] ?? 'unknown'
    const counts = meta.counts
    const parts = counts
        ? [
              `${counts.passed} passed`,
              counts.failed ? `<b>${counts.failed} failed</b>` : '',
              counts.flaky ? `${counts.flaky} flaky` : '',
              counts.skipped ? `${counts.skipped} skipped` : '',
              formatDuration(counts.durationMs)
          ].filter(Boolean)
        : []
    return (
        `<td><a class="verdict ${verdict}" href="${escapeHtml(meta.entry)}">${verdict}</a>` +
        `<div class="counts">${parts.join(' · ')}</div></td>`
    )
}

/**
 * The site's front page: every run on it, newest first, with each suite's verdict and a link to
 * its report. Self-contained: no script, no external file.
 *
 * @param {ReturnType<typeof listRuns>} runs
 * @param {Date} now
 */
function renderIndex(runs, now) {
    const rows = runs
        .map(({ key, run = {}, suites, publishedAt }) => {
            const number = run.number ? `#${run.number}` : key
            const attempt = run.attempt > 1 ? ` <span class="muted">attempt ${run.attempt}</span>` : ''
            const runCell = run.url ? `<a href="${escapeHtml(run.url)}">${escapeHtml(number)}</a>${attempt}` : `${escapeHtml(number)}${attempt}`
            const sha = run.sha ? run.sha.slice(0, 7) : ''
            const commit = run.commitUrl ? `<a href="${escapeHtml(run.commitUrl)}"><code>${escapeHtml(sha)}</code></a>` : `<code>${escapeHtml(sha)}</code>`
            const published = publishedAt ? DATE_FORMAT.format(new Date(publishedAt)) : ''
            return (
                `<tr><td class="run">${runCell}<div class="muted">${escapeHtml(published)}</div></td>` +
                `<td><div class="branch">${escapeHtml(run.branch ?? '')}</div>${commit} ${escapeHtml(run.subject ?? '')}</td>` +
                `${Object.keys(SUITES).map((suite) => renderSuiteCell(suites[suite])).join('')}</tr>`
            )
        })
        .join('\n')
    const head = Object.values(SUITES)
        .map((suite) => `<th>${suite.title}</th>`)
        .join('')
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>PP365 test reports</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#1f2328;--muted:#59636e;--line:#d1d9e0;--head:#f6f8fa;--passed:#1a7f37;--failed:#cf222e;--cancelled:#9a6700;--skipped:#59636e}
@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#e6edf3;--muted:#9198a1;--line:#3d444d;--head:#151b23;--passed:#3fb950;--failed:#f85149;--cancelled:#d29922;--skipped:#9198a1}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1200px;margin:0 auto;padding:24px 16px 64px}h1{font-size:22px;margin:0 0 4px}p{color:var(--muted);margin:0 0 16px}
.table{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:640px}th,td{text-align:left;vertical-align:top;padding:8px 10px;border-bottom:1px solid var(--line)}
th{background:var(--head);font-weight:600}a{color:inherit}.muted,.counts,.none{color:var(--muted)}.counts{font-size:12px}.run{white-space:nowrap}
.branch{font-size:12px;color:var(--muted)}code{font:12px ui-monospace,SFMono-Regular,Menlo,monospace}
.verdict{display:inline-block;font-weight:600;text-transform:uppercase;font-size:12px;padding:0 8px;border-radius:10px;border:1px solid currentColor;text-decoration:none}
.verdict.passed{color:var(--passed)}.verdict.failed{color:var(--failed)}.verdict.cancelled{color:var(--cancelled)}.verdict.skipped,.verdict.unknown{color:var(--skipped)}
</style>
</head>
<body>
<main>
<h1>PP365 test reports</h1>
<p>The test channel's end-to-end and integration runs of the last ${RETENTION_DAYS} days, newest first. Updated ${escapeHtml(DATE_FORMAT.format(now))} (Oslo time).</p>
<div class="table"><table>
<thead><tr><th>Run</th><th>Commit</th>${head}</tr></thead>
<tbody>
${rows || `<tr><td colspan="${2 + Object.keys(SUITES).length}" class="none">No runs yet.</td></tr>`}
</tbody>
</table></div>
</main>
${INTERNAL_TAG}
</body>
</html>
`
}

/** Runs git with the given environment and returns its trimmed output; a hung call is killed. */
function git(args, options) {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: GIT_TIMEOUT_MS, ...options }).trim()
}

/**
 * fetch with a timeout, tried again on a network error, a 429 or a 5xx.
 *
 * @param {typeof fetch} fetchImpl
 * @param {string} url
 * @param {RequestInit} [init]
 */
async function fetchWithRetry(fetchImpl, url, init = {}) {
    let lastError
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(15_000) })
            if (response.status !== 429 && response.status < 500) return response
            lastError = new Error(`${url} answered ${response.status}`)
        } catch (error) {
            lastError = error
        }
        if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
    }
    throw lastError
}

/**
 * Whether a URL is GitHub's sign-in, where a private Pages site sends an anonymous visitor.
 *
 * @param {string | undefined} url
 */
function isGitHubSignIn(url) {
    try {
        const { hostname, pathname } = new URL(url)
        return hostname === 'github.com' && (pathname === '/login' || pathname.startsWith('/pages/auth'))
    } catch {
        return false
    }
}

/** Headers for api.github.com: the job's token, when there is one, lifts the anonymous rate limit. */
function apiHeaders(env) {
    return { accept: 'application/vnd.github+json', ...(env.GITHUB_TOKEN ? { authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}) }
}

/**
 * Refuses to publish unless the reports can be read only after signing in to GitHub. On GitHub
 * Enterprise Cloud a Pages site is public by default even from a private repository (every
 * private Puzzlepart repository with Pages was public on 2026-10-14), and any admin of the
 * repository can switch it back, so this is checked on every publish rather than trusted:
 * the site repository is not public (this job's token sees no other private repository: 404),
 * the repository's public Pages address serves nothing without a sign-in, and the site's own
 * address answers an anonymous request with no content (a private site redirects to GitHub's
 * sign-in). A private site's public address redirects to the site's own address and on to the
 * sign-in, a page that answers 200, so where the redirects end decides, not the last status: the
 * first private site was refused for it on 2026-10-26.
 *
 * @param {NodeJS.ProcessEnv} env TEST_REPORTS_REPOSITORY, TEST_REPORTS_URL, GITHUB_TOKEN
 * @param {typeof fetch} [fetchImpl]
 */
async function assertSitePrivate(env, fetchImpl = fetch) {
    const [owner, name] = env.TEST_REPORTS_REPOSITORY.split('/')
    const refuse = (reason) => {
        throw new Error(`${reason} Nothing was published: the reports hold the test tenant's pages and the test user's session.`)
    }
    const repo = await fetchWithRetry(fetchImpl, `https://api.github.com/repos/${owner}/${name}`, { headers: apiHeaders(env) })
    if (repo.ok) refuse(`${env.TEST_REPORTS_REPOSITORY} is a public repository.`)
    if (repo.status !== 404) refuse(`Whether ${env.TEST_REPORTS_REPOSITORY} is private could not be checked (${repo.status}).`)
    const publicSite = `https://${owner.toLowerCase()}.github.io/${name}/`
    const atPublicSite = await fetchWithRetry(fetchImpl, publicSite, { redirect: 'follow' })
    if (atPublicSite.ok && !isGitHubSignIn(atPublicSite.url)) {
        refuse(`The site is public at ${publicSite}: set its Pages visibility to Private.`)
    }
    const site = await fetchWithRetry(fetchImpl, env.TEST_REPORTS_URL.replace(/\/+$/, '') + '/', { redirect: 'manual' })
    if (site.status >= 200 && site.status < 300) {
        refuse(`${env.TEST_REPORTS_URL} answers without a GitHub sign-in: set the site's Pages visibility to Private.`)
    }
}

/**
 * Sets up SSH for the deploy key: the key in a file only this user can read, and GitHub's host
 * keys from its API (over HTTPS), so the first connection is checked rather than trusted.
 *
 * @returns {Promise<{ sshCommand: string, cleanup: () => void }>}
 */
async function prepareSsh(deployKey, env, fetchImpl = fetch) {
    const response = await fetchWithRetry(fetchImpl, 'https://api.github.com/meta', { headers: apiHeaders(env) })
    if (!response.ok) throw new Error(`GitHub's host keys could not be read: ${response.status}`)
    const { ssh_keys: hostKeys } = await response.json()
    if (!Array.isArray(hostKeys) || hostKeys.length === 0) throw new Error("GitHub's API listed no SSH host keys.")
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp365-reports-ssh-'))
    const cleanup = () => fs.rmSync(dir, { recursive: true, force: true })
    try {
        const keyFile = path.join(dir, 'key')
        // A secret pasted from Windows can carry CRLF line ends, which OpenSSH refuses.
        fs.writeFileSync(keyFile, deployKey.replace(/\r\n?/g, '\n').trim() + '\n', { mode: 0o600 })
        fs.writeFileSync(path.join(dir, 'known_hosts'), hostKeys.map((key) => `github.com ${key}`).join('\n') + '\n')
        const quote = (value) => `'${value.replace(/'/g, `'\\''`)}'`
        return {
            // BatchMode: never wait for a prompt; the timeouts end a connection that stalls.
            sshCommand:
                `ssh -i ${quote(keyFile)} -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes ` +
                `-o UserKnownHostsFile=${quote(path.join(dir, 'known_hosts'))} ` +
                '-o ConnectTimeout=30 -o ServerAliveInterval=15 -o ServerAliveCountMax=4',
            cleanup
        }
    } catch (error) {
        cleanup()
        throw error
    }
}

/**
 * Fetches the site branch, adds the report and pushes one parentless commit, conditional on the
 * branch not having moved; starts over when another job pushed in between.
 *
 * @param {object} options
 * @param {string} options.remote git URL or path of the site repository
 * @param {NodeJS.ProcessEnv} [options.gitEnv] Environment for git (GIT_SSH_COMMAND)
 * @param {Parameters<typeof addReport>[1]} options.report
 * @param {(workDir: string) => void} [options.beforePush] For the tests: runs before each push
 * @param {(message: string) => void} [options.log]
 * @returns {string} The report's path in the site
 */
function publish({ remote, gitEnv = process.env, report, beforePush, log = console.log }) {
    const env = {
        ...gitEnv,
        GIT_AUTHOR_NAME: 'github-actions[bot]',
        GIT_AUTHOR_EMAIL: '41898282+github-actions[bot]@users.noreply.github.com',
        GIT_COMMITTER_NAME: 'github-actions[bot]',
        GIT_COMMITTER_EMAIL: '41898282+github-actions[bot]@users.noreply.github.com',
        GIT_TERMINAL_PROMPT: '0'
    }
    let lastError
    for (let attempt = 1; attempt <= PUSH_ATTEMPTS; attempt++) {
        const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp365-reports-'))
        const run = (args) => git(args, { cwd: workDir, env })
        try {
            run(['init', '--quiet'])
            // The lease is the commit actually fetched: if the branch moves after this, the push fails.
            let tip = ''
            if (run(['ls-remote', remote, `refs/heads/${BRANCH}`])) {
                run(['fetch', '--quiet', '--depth=1', remote, `refs/heads/${BRANCH}`])
                tip = run(['rev-parse', 'FETCH_HEAD'])
                run(['checkout', '--quiet', '--detach', tip])
            }
            const entry = addReport(workDir, { ...report, warn: report.warn ?? log })
            run(['add', '--all'])
            const message = `${report.suite} report for run ${report.run.key}${report.run.branch ? ` (${report.run.branch})` : ''}`
            const commit = run(['commit-tree', run(['write-tree']), '-m', message])
            beforePush?.(workDir)
            run(['push', '--quiet', `--force-with-lease=refs/heads/${BRANCH}:${tip}`, remote, `${commit}:refs/heads/${BRANCH}`])
            return entry
        } catch (error) {
            lastError = error
            if (attempt < PUSH_ATTEMPTS) {
                log(`Attempt ${attempt} of ${PUSH_ATTEMPTS} failed (another job may have published first); trying again.`)
                // The other job pushes within seconds; waiting a little longer each time spreads the retries.
                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000 * attempt)
            }
        } finally {
            fs.rmSync(workDir, { recursive: true, force: true })
        }
    }
    throw new Error(`The report could not be pushed after ${PUSH_ATTEMPTS} attempts: ${lastError?.stderr || lastError?.message}`)
}

/** Appends to the job summary on the run's page, when there is one. */
function writeSummary(env, markdown) {
    if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, markdown + '\n')
}

async function main(argv, env) {
    const args = parseArgs(argv)
    const suite = args.suite
    if (!SUITES[suite] || !args.report) {
        throw new Error('Usage: node .tasks/publish-test-report.js --suite e2e|integration --report <dir> [--results <file>] [--outcome <outcome>]')
    }
    const title = `${SUITES[suite].title} report`
    const remoteOverride = env.TEST_REPORTS_REMOTE
    if (!remoteOverride && (!env.TEST_REPORTS_REPOSITORY || !env.TEST_REPORTS_URL || !env.TEST_REPORTS_DEPLOY_KEY)) {
        console.log(
            `::notice title=${title}::The test report site is not set up (TEST_REPORTS_REPOSITORY, TEST_REPORTS_URL, ` +
            'TEST_REPORTS_DEPLOY_KEY); the report is only in the artifact.'
        )
        return
    }
    const reportDir = path.resolve(args.report)
    if (!fs.existsSync(reportDir) || fs.readdirSync(reportDir).length === 0) {
        console.log(`::notice title=${title}::${args.report} is missing or empty: nothing to publish.`)
        return
    }
    const report = {
        suite,
        reportDir,
        outcome: args.outcome || 'unknown',
        counts: readCounts(suite, reportDir, args.results && path.resolve(args.results)),
        run: runFromEnvironment(env),
        warn: (message) => console.log(`::warning title=${title}::${message}`)
    }
    if (!remoteOverride) await assertSitePrivate(env)
    const ssh = remoteOverride ? undefined : await prepareSsh(env.TEST_REPORTS_DEPLOY_KEY, env)
    try {
        const entry = publish({
            remote: remoteOverride || `git@github.com:${env.TEST_REPORTS_REPOSITORY}.git`,
            gitEnv: ssh ? { ...env, GIT_SSH_COMMAND: ssh.sshCommand } : env,
            report
        })
        const site = env.TEST_REPORTS_URL ? env.TEST_REPORTS_URL.replace(/\/+$/, '') + '/' : undefined
        console.log(`Published ${entry}${site ? `: ${site}${entry}` : ''} (GitHub Pages deploys it within a minute or two).`)
        writeSummary(
            env,
            site
                ? `### ${title}\n\n[Open the report](${site}${entry}) · [all runs](${site}) (private site; it deploys a minute or two after this step)`
                : `### ${title}\n\nPublished to \`${entry}\` on the test report site (set the TEST_REPORTS_URL variable for a link).`
        )
    } finally {
        ssh?.cleanup()
    }
}

if (require.main === module) {
    main(process.argv.slice(2), process.env).catch((error) => {
        console.log(`::warning title=Test report site::${String(error.message).split('\n')[0]}`)
        console.error(error)
        process.exit(1)
    })
}

module.exports = {
    addReport,
    assertSitePrivate,
    listRuns,
    parseArgs,
    prepareSsh,
    publish,
    readCounts,
    renderIndex,
    runFromEnvironment,
    MAX_SITE_BYTES,
    RETENTION_DAYS
}
