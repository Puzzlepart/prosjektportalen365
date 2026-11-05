/**
 * Tests for publish-test-report.js: the test report site keeps each run's reports apart, drops
 * runs older than the artifacts' 7 days, escapes commit subjects, and two jobs publishing at once
 * both land on the branch, which stays one commit without history, and nothing is pushed to a site
 * that answers without a GitHub sign-in. Another repository's reports (`--project`) stay in its
 * folder, which is all such a publish changes, and each publisher, also prosjektportalen365's as
 * deployed (the fixtures), keeps the other's files; a publish that would change anything else is
 * refused. Run with `npm run test:tasks` (needs git).
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync, spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const {
    addReport,
    assertSitePrivate,
    foreignChanges,
    listProjects,
    listRuns,
    main,
    prepareSsh,
    publish,
    readCounts,
    renderIndex,
    runFromEnvironment,
    MAX_PROJECT_BYTES,
    MAX_SITE_BYTES
} = require('./publish-test-report')

const NOW = new Date('2026-10-14T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const PUBLISHER = path.join(__dirname, 'publish-test-report.js')
/**
 * prosjektportalen365's publisher as deployed on releases/1.15, byte for byte: blob b37ae3bb3 from
 * 2026-10-26 until 3f0389819 (2026-11-04), then blob 5a0af8e8, which this file extends. A project's
 * publish must be safe with both, since a branch that has not taken this file still publishes with
 * one of them.
 */
const DEPLOYED = [
    { blob: 'b37ae3bb3b5b06afb6393783619207e0073a5602', file: path.join(__dirname, 'fixtures', 'publish-test-report.b37ae3bb3.js') },
    { blob: '5a0af8e89b024e9267dcdeec1def86359d049881', file: path.join(__dirname, 'fixtures', 'publish-test-report.5a0af8e8.js') }
]
/** The deployed publisher this file extends. */
const CURRENT = DEPLOYED[1].file
const PROJECT = 'sp-js-provisioning'
const PROJECTS_LINE = '<p class="projects">Also on this site: <a href="sp-js-provisioning/">sp-js-provisioning</a></p>\n'

function tempDir(name) {
    return fs.mkdtempSync(path.join(os.tmpdir(), `pp365-reports-${name}-`))
}

/** A report folder holding `files` (path → content). */
function reportFolder(files = { 'index.html': '<html>report</html>' }) {
    const dir = tempDir('report')
    for (const [file, content] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
        fs.writeFileSync(path.join(dir, file), content)
    }
    return dir
}

/** A run as GitHub's variables describe it. */
function run(id, attempt = 1, extra = {}) {
    return runFromEnvironment({
        GITHUB_RUN_ID: String(id),
        GITHUB_RUN_ATTEMPT: String(attempt),
        GITHUB_RUN_NUMBER: String(id - 1000),
        GITHUB_REF_NAME: 'releases/1.15',
        GITHUB_SHA: 'abcdef1234567890',
        COMMIT_SUBJECT: 'fix: something [apps-only]',
        ...extra
    })
}

/** A run of the project's repository. */
function projectRun(id) {
    return run(id, 1, { GITHUB_REPOSITORY: 'Puzzlepart/sp-js-provisioning', GITHUB_REF_NAME: 'main', COMMIT_SUBJECT: 'feat: a handler' })
}

function git(cwd, ...args) {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

/** The files under `dir`, relative to it, sorted. */
function filesIn(dir) {
    return fs
        .readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
        .sort()
}

/** A bare repository standing in for the site's. */
function siteRemote() {
    const remote = tempDir('remote')
    git(remote, 'init', '--bare', '--quiet')
    return remote
}

/** The site branch's files under `paths`, with their blob ids. */
function tree(remote, ...paths) {
    return git(remote, 'ls-tree', '-r', 'gh-pages', '--', ...paths)
}

/** The site branch's files outside the project's folder, with their blob ids: what a project must not change. */
function treeOutsideProject(remote) {
    return tree(remote)
        .split('\n')
        .filter((line) => !line.split('\t')[1].startsWith(`${PROJECT}/`))
        .join('\n')
}

/** The run folders on the site branch, under `runs/` or a project's. */
function runKeys(remote, project) {
    const prefix = project ? `${project}/runs/` : 'runs/'
    return [...new Set(git(remote, 'ls-tree', '-r', '--name-only', 'gh-pages', '--', prefix).split('\n').map((file) => file.slice(prefix.length).split('/')[0]))]
        .filter(Boolean)
        .sort()
}

/** The project's options for {@link publish} or {@link addReport}. */
function projectReport(id, now = NOW) {
    return { project: PROJECT, suite: 'unit', title: 'Unit', reportDir: reportFolder(), outcome: 'success', run: projectRun(id), now }
}

/** prosjektportalen365's options for {@link publish} or {@link addReport}. */
function siteReport(suite, id, now = NOW, reportDir = reportFolder()) {
    return { suite, reportDir, outcome: 'success', run: run(id), now }
}

/** The environment of a publisher started here: this job's GitHub variables (and summary) left out. */
function cleanEnv(extra = {}) {
    const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^(GITHUB_|TEST_REPORTS_|COMMIT_SUBJECT$)/.test(name)))
    return { ...env, ...extra }
}

/** Publishes as a CI step does: a publisher's command line, against the bare repository. */
function publishWith(script, remote, args, id) {
    const result = spawnSync(process.execPath, [script, ...args], {
        encoding: 'utf8',
        env: cleanEnv({ TEST_REPORTS_REMOTE: remote, GITHUB_RUN_ID: String(id), GITHUB_RUN_ATTEMPT: '1', GITHUB_REF_NAME: 'main' })
    })
    assert.equal(result.status, 0, result.stdout + result.stderr)
    return result
}

const integrationArgs = () => ['--suite', 'integration', '--report', reportFolder(), '--outcome', 'success']
const projectArgs = () => ['--project', PROJECT, '--suite', 'unit', '--title', 'Unit', '--report', reportFolder(), '--outcome', 'success']

/**
 * An ssh that answers every connection with `stderr` and exit code 255, as GitHub's did with the
 * deploy key on 2026-11-04, and counts the connections.
 */
function fakeSsh(stderr) {
    const dir = tempDir('ssh')
    const script = path.join(dir, 'ssh.js')
    const calls = path.join(dir, 'calls')
    fs.writeFileSync(
        script,
        `require('fs').appendFileSync(${JSON.stringify(calls)}, '.')\nprocess.stderr.write(${JSON.stringify(stderr + '\n')})\nprocess.exit(255)\n`
    )
    return {
        // The variant keeps git from probing the command with -G first.
        vars: { GIT_SSH_COMMAND: `"${process.execPath}" "${script}"`, GIT_SSH_VARIANT: 'ssh' },
        calls: () => (fs.existsSync(calls) ? fs.readFileSync(calls, 'utf8').length : 0)
    }
}

const GITHUB_REMOTE = 'git@github.com:Puzzlepart/pp365-reports.git'

test('adds a suite report under its run, with its metadata, .nojekyll and an index that links it', () => {
    const site = tempDir('site')
    const entry = addReport(site, {
        suite: 'e2e',
        reportDir: reportFolder({ 'index.html': 'e2e', 'data/abc.png': 'png' }),
        outcome: 'failure',
        counts: { passed: 30, failed: 2, flaky: 1, skipped: 0, durationMs: 330_000 },
        run: run(2001),
        now: NOW
    })
    assert.equal(entry, 'runs/2001-1/e2e/index.html')
    assert.equal(fs.readFileSync(path.join(site, 'runs/2001-1/e2e/data/abc.png'), 'utf8'), 'png')
    assert.ok(fs.existsSync(path.join(site, '.nojekyll')))
    const meta = JSON.parse(fs.readFileSync(path.join(site, 'runs/2001-1/e2e.json'), 'utf8'))
    assert.equal(meta.outcome, 'failure')
    assert.equal(meta.run.url, 'https://github.com/Puzzlepart/prosjektportalen365/actions/runs/2001/attempts/1')
    assert.equal(meta.run.repository, 'Puzzlepart/prosjektportalen365')
    const index = fs.readFileSync(path.join(site, 'index.html'), 'utf8')
    assert.match(index, /href="runs\/2001-1\/e2e\/index.html">failed<\/a>/)
    assert.match(index, /<b>2 failed<\/b> · 1 flaky · 5 min 30 s/)
    assert.match(index, />#1001<\/a>/)
    assert.match(index, /<div data-pp365-internal[^>]*>Internal only<\/div>\n<\/body>/)
})

test('tags the front page and every report as internal only, once, those published before the tag too', () => {
    const site = tempDir('site')
    const read = (file) => fs.readFileSync(path.join(site, file), 'utf8')
    // Playwright's report is one page of scripts: the tag goes before the last closing body tag.
    const page = '<html><body><script>const end = "</body>"</script><div id="root"></div></body></html>'
    addReport(site, { suite: 'e2e', reportDir: reportFolder({ 'index.html': page }), outcome: 'success', run: run(2001), now: NOW })
    assert.match(
        read('runs/2001-1/e2e/index.html'),
        /const end = "<\/body>"<\/script><div id="root"><\/div><div data-pp365-internal[^>]*>Internal only<\/div><\/body><\/html>$/
    )
    // A report published before the tag, as it was then.
    fs.writeFileSync(path.join(site, 'runs/2001-1/e2e/index.html'), '<html><body>earlier</body></html>')
    const later = new Date(NOW.getTime() + 1000)
    addReport(site, { suite: 'integration', reportDir: reportFolder(), outcome: 'success', run: run(2002), now: later })
    const tags = (file) => read(file).split('data-pp365-internal').length - 1
    assert.equal(tags('index.html'), 1)
    assert.equal(tags('runs/2001-1/e2e/index.html'), 1)
    assert.equal(tags('runs/2002-1/integration/index.html'), 1)
})

test('puts both suites of a run in one row, and a rerun in a row of its own', () => {
    const site = tempDir('site')
    const add = (suite, id, attempt, now) =>
        addReport(site, { suite, reportDir: reportFolder(), outcome: 'success', run: run(id, attempt), now })
    add('integration', 2001, 1, new Date(NOW.getTime() - 3000))
    add('e2e', 2001, 1, new Date(NOW.getTime() - 2000))
    add('e2e', 2001, 2, NOW)
    const runs = listRuns(site)
    assert.deepEqual(
        runs.map((entry) => [entry.key, Object.keys(entry.suites).sort()]),
        [
            ['2001-2', ['e2e']],
            ['2001-1', ['e2e', 'integration']]
        ]
    )
    assert.match(fs.readFileSync(path.join(site, 'index.html'), 'utf8'), /attempt 2/)
})

test('drops runs older than the 7 days the artifacts are kept, and keeps the newer ones', () => {
    const site = tempDir('site')
    const add = (id, daysAgo) =>
        addReport(site, {
            suite: 'e2e',
            reportDir: reportFolder(),
            outcome: 'success',
            run: run(id),
            now: new Date(NOW.getTime() - daysAgo * DAY)
        })
    add(2001, 8)
    add(2002, 6)
    add(2003, 0)
    assert.deepEqual(
        listRuns(site).map((entry) => entry.key),
        ['2003-1', '2002-1']
    )
})

test('drops the oldest runs while the site is over its size budget, but never the run being published', () => {
    const site = tempDir('site')
    const big = 'x'.repeat(4000)
    const add = (id, offset, maxSiteBytes) =>
        addReport(site, {
            suite: 'e2e',
            reportDir: reportFolder({ 'index.html': big }),
            outcome: 'success',
            run: run(id),
            now: new Date(NOW.getTime() + offset),
            maxSiteBytes
        })
    add(2001, 0, 100_000)
    add(2002, 1000, 100_000)
    add(2003, 2000, 12_000)
    assert.deepEqual(
        listRuns(site).map((entry) => entry.key),
        ['2003-1', '2002-1']
    )
    add(2004, 3000, 10)
    assert.deepEqual(
        listRuns(site).map((entry) => entry.key),
        ['2004-1']
    )
})

test('escapes the commit subject and branch, which anyone who can push writes', () => {
    const site = tempDir('site')
    addReport(site, {
        suite: 'e2e',
        reportDir: reportFolder(),
        outcome: 'success',
        run: run(2001, 1, { COMMIT_SUBJECT: 'feat: <img src=x onerror=alert(1)>', GITHUB_REF_NAME: 'a"b' }),
        now: NOW
    })
    const index = fs.readFileSync(path.join(site, 'index.html'), 'utf8')
    assert.ok(!index.includes('<img src=x'))
    assert.ok(index.includes('&lt;img src=x onerror=alert(1)&gt;'))
    assert.ok(index.includes('a&quot;b'))
})

test("reads the counts from Playwright's results.json when it is given, else from the report's embedded summary", () => {
    const dir = reportFolder({
        'results.json': JSON.stringify({ stats: { expected: 40, unexpected: 1, flaky: 2, skipped: 3, duration: 1234.5 } }),
        'index.html':
            '<html><script type="application/json" id="report-summary">' +
            JSON.stringify({ success: false, counts: { tests: 9, passed: 5, failed: 1, cancelled: 1, skipped: 1, todo: 1 }, durationMs: 99 }) +
            '</script></html>'
    })
    assert.deepEqual(readCounts(dir, path.join(dir, 'results.json')), {
        passed: 40,
        failed: 1,
        flaky: 2,
        skipped: 3,
        durationMs: 1234.5
    })
    assert.deepEqual(readCounts(dir), { passed: 5, failed: 2, flaky: 0, skipped: 2, durationMs: 99 })
    assert.equal(readCounts(dir, path.join(dir, 'missing.json')), undefined)
    assert.equal(readCounts(reportFolder({ 'index.html': '<html></html>' })), undefined)
})

test('pushes one commit without parents, and keeps what an earlier push published', () => {
    const remote = tempDir('remote')
    git(remote, 'init', '--bare', '--quiet')
    const options = (suite) => ({ suite, reportDir: reportFolder({ 'index.html': suite }), outcome: 'success', run: run(2001), now: NOW })
    publish({ remote, report: options('e2e'), log: () => undefined })
    publish({ remote, report: options('integration'), log: () => undefined })
    assert.equal(git(remote, 'rev-list', '--count', 'gh-pages'), '1')
    const files = git(remote, 'ls-tree', '-r', '--name-only', 'gh-pages').split('\n')
    for (const file of ['.nojekyll', 'index.html', 'runs/2001-1/e2e.json', 'runs/2001-1/e2e/index.html', 'runs/2001-1/integration/index.html']) {
        assert.ok(files.includes(file), `${file} in ${files.join(', ')}`)
    }
})

test('starts over when another job pushed between its fetch and its push, so neither report is lost', () => {
    const remote = tempDir('remote')
    git(remote, 'init', '--bare', '--quiet')
    const options = (suite) => ({ suite, reportDir: reportFolder({ 'index.html': suite }), outcome: 'success', run: run(2001), now: NOW })
    const messages = []
    const waits = []
    let raced = false
    publish({
        remote,
        report: options('e2e'),
        log: (message) => messages.push(message),
        sleep: (ms) => waits.push(ms),
        beforePush: () => {
            if (raced) return
            raced = true
            publish({ remote, report: options('integration'), log: () => undefined })
        }
    })
    assert.equal(messages.length, 1)
    assert.match(messages[0], /Attempt 1 of 5 lost to another job's push/)
    assert.deepEqual(waits, [1000])
    const files = git(remote, 'ls-tree', '-r', '--name-only', 'gh-pages').split('\n')
    assert.ok(files.includes('runs/2001-1/e2e/index.html'))
    assert.ok(files.includes('runs/2001-1/integration/index.html'))
    assert.equal(git(remote, 'rev-list', '--count', 'gh-pages'), '1')
})

test('tells a site repository it cannot reach from a race, waits longer for it, and says where to look', () => {
    // git says "Could not read from remote repository" for a path that is no repository, as it
    // does after GitHub's "Permission denied (publickey)": every push of run #1404 on 2026-11-04,
    // in a GitHub incident, was logged as lost to another job.
    const remote = path.join(tempDir('remote'), 'missing.git')
    const report = { suite: 'e2e', reportDir: reportFolder(), outcome: 'success', run: run(2001), now: NOW }
    const messages = []
    const waits = []
    assert.throws(
        () => publish({ remote, report, log: (message) => messages.push(message), sleep: (ms) => waits.push(ms) }),
        (error) => {
            const [warning] = error.message.split('\n')
            assert.match(warning, /could not reach the site repository/)
            assert.match(warning, /githubstatus\.com/)
            assert.match(error.message, /Could not read from remote repository/)
            return true
        }
    )
    assert.equal(messages.length, 4)
    assert.match(messages[0], /^Attempt 1 of 5 could not reach the site repository \(.+\); trying again in 10 s\.$/)
    assert.ok(messages.every((message) => !/another job/.test(message)), messages.join('\n'))
    assert.deepEqual(waits, [10_000, 20_000, 30_000, 40_000])
})

/**
 * A fetch that answers each URL with the given status (404 otherwise), or with `{ status, url }`
 * when its redirects end elsewhere, and records what it was asked.
 */
function fakeFetch(answers) {
    const asked = []
    const impl = async (url, init = {}) => {
        asked.push({ url, redirect: init.redirect, authorization: init.headers?.authorization })
        const answer = answers[url] ?? 404
        const { status, url: finalUrl = url } = typeof answer === 'number' ? { status: answer } : answer
        return { ok: status >= 200 && status < 300, status, url: finalUrl, json: async () => ({ ssh_keys: ['ssh-ed25519 AAAAC3'] }) }
    }
    return { impl, asked }
}

const SITE_ENV = {
    TEST_REPORTS_REPOSITORY: 'Puzzlepart/pp365-reports',
    TEST_REPORTS_URL: 'https://calm-word-1a2b.pages.github.io',
    GITHUB_TOKEN: 'job-token'
}

test('publishes only to a site that asks for a GitHub sign-in, since Pages is public by default', async () => {
    const privateSite = fakeFetch({ 'https://calm-word-1a2b.pages.github.io/': 302 })
    await assertSitePrivate(SITE_ENV, privateSite.impl)
    assert.deepEqual(
        privateSite.asked.map(({ url, redirect }) => [url, redirect]),
        [
            ['https://api.github.com/repos/Puzzlepart/pp365-reports', undefined],
            ['https://puzzlepart.github.io/pp365-reports/', 'follow'],
            ['https://calm-word-1a2b.pages.github.io/', 'manual']
        ]
    )
    assert.equal(privateSite.asked[0].authorization, 'Bearer job-token')
    for (const [statuses, reason] of [
        [{ 'https://api.github.com/repos/Puzzlepart/pp365-reports': 200 }, /is a public repository/],
        [{ 'https://api.github.com/repos/Puzzlepart/pp365-reports': 403 }, /could not be checked \(403\)/],
        [{ 'https://puzzlepart.github.io/pp365-reports/': 200 }, /public at https:\/\/puzzlepart\.github\.io\/pp365-reports\//],
        [
            { 'https://puzzlepart.github.io/pp365-reports/': { status: 200, url: 'https://calm-word-1a2b.pages.github.io/' } },
            /public at https:\/\/puzzlepart\.github\.io\/pp365-reports\//
        ],
        [{ 'https://calm-word-1a2b.pages.github.io/': 200 }, /answers without a GitHub sign-in/]
    ]) {
        await assert.rejects(assertSitePrivate(SITE_ENV, fakeFetch(statuses).impl), reason)
    }
})

test("accepts a private site whose public address redirects on to GitHub's sign-in", async () => {
    // What GitHub did once the first site was private (2026-10-26): the public address answers 301
    // to the site's own address, which sends an anonymous visitor to GitHub's sign-in, a page that
    // answers 200.
    const site = fakeFetch({
        'https://puzzlepart.github.io/pp365-reports/': {
            status: 200,
            url: 'https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Fpages%2Fauth%3Fpage_id%3D1'
        },
        'https://calm-word-1a2b.pages.github.io/': 302
    })
    await assertSitePrivate(SITE_ENV, site.impl)
})

test('writes the deploy key with LF line ends, for its owner only, and removes it again', async () => {
    const { impl } = fakeFetch({ 'https://api.github.com/meta': 200 })
    const ssh = await prepareSsh('-----BEGIN OPENSSH PRIVATE KEY-----\r\nabc\r\n-----END OPENSSH PRIVATE KEY-----\r\n', {}, impl)
    const keyFile = /-i '([^']+)'/.exec(ssh.sshCommand)[1]
    assert.equal(fs.readFileSync(keyFile, 'utf8'), '-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n-----END OPENSSH PRIVATE KEY-----\n')
    assert.equal(fs.statSync(keyFile).mode & 0o777, 0o600)
    assert.equal(fs.readFileSync(path.join(path.dirname(keyFile), 'known_hosts'), 'utf8'), 'github.com ssh-ed25519 AAAAC3\n')
    assert.match(ssh.sshCommand, /BatchMode=yes .*StrictHostKeyChecking=yes .*ConnectTimeout=30/)
    ssh.cleanup()
    assert.equal(fs.existsSync(path.dirname(keyFile)), false)
})

test("writes no key to disk when GitHub's host keys cannot be read", async () => {
    const keyDirs = () => fs.readdirSync(os.tmpdir()).filter((name) => name.startsWith('pp365-reports-ssh-')).length
    const before = keyDirs()
    await assert.rejects(prepareSsh('key', {}, fakeFetch({}).impl), /host keys could not be read: 404/)
    assert.equal(keyDirs(), before)
})

test("publishes a project's report in its folder: the run, its metadata, the project's page and project.json", () => {
    const site = tempDir('site')
    const entry = addReport(site, {
        ...projectReport(5001),
        reportDir: reportFolder({ 'index.html': '<html><body>unit</body></html>' }),
        counts: { passed: 12, failed: 0, flaky: 0, skipped: 1, durationMs: 4000 }
    })
    assert.equal(entry, 'sp-js-provisioning/runs/5001-1/unit/index.html')
    // Nothing outside its folder: the front page and .nojekyll are prosjektportalen365's.
    assert.deepEqual(filesIn(site), [
        'sp-js-provisioning/index.html',
        'sp-js-provisioning/project.json',
        'sp-js-provisioning/runs/5001-1/unit.json',
        'sp-js-provisioning/runs/5001-1/unit/index.html'
    ])
    const read = (file) => fs.readFileSync(path.join(site, file), 'utf8')
    const meta = JSON.parse(read('sp-js-provisioning/runs/5001-1/unit.json'))
    assert.deepEqual([meta.project, meta.suite, meta.title, meta.entry], [PROJECT, 'unit', 'Unit', entry])
    assert.equal(meta.run.url, 'https://github.com/Puzzlepart/sp-js-provisioning/actions/runs/5001/attempts/1')
    assert.equal(meta.run.repository, 'Puzzlepart/sp-js-provisioning')
    assert.deepEqual(JSON.parse(read('sp-js-provisioning/project.json')), {
        project: PROJECT,
        title: 'sp-js-provisioning test reports',
        repository: 'Puzzlepart/sp-js-provisioning',
        updatedAt: NOW.toISOString()
    })
    const page = read('sp-js-provisioning/index.html')
    assert.match(page, /<title>sp-js-provisioning test reports<\/title>/)
    assert.match(page, /<thead><tr><th>Run<\/th><th>Commit<\/th><th>Unit<\/th><\/tr><\/thead>/)
    assert.match(page, /href="runs\/5001-1\/unit\/index.html">passed<\/a><div class="counts">12 passed · 1 skipped · 4 s<\/div>/)
    assert.match(page, /The CI runs of the last 7 days, newest first\..*<a href="\.\.\/">All test reports<\/a>/)
    assert.match(page, /data-pp365-internal/)
    assert.match(read('sp-js-provisioning/runs/5001-1/unit/index.html'), /unit<div data-pp365-internal[^>]*>Internal only<\/div><\/body>/)
})

test("gives each suite a project published a column of its own, titled by the newest run's metadata", () => {
    const site = tempDir('site')
    addReport(site, { ...projectReport(5001, new Date(NOW.getTime() - 2000)), title: 'Unit tests' })
    addReport(site, { ...projectReport(5002, new Date(NOW.getTime() - 1000)), suite: 'integration', title: 'Integration' })
    addReport(site, projectReport(5002))
    const page = fs.readFileSync(path.join(site, PROJECT, 'index.html'), 'utf8')
    assert.match(page, /<th>Commit<\/th><th>Integration<\/th><th>Unit<\/th><\/tr>/)
    const rows = page.split('\n').filter((line) => line.startsWith('<tr><td class="run">'))
    assert.equal(rows.length, 2)
    assert.match(rows[0], />#4002<\/a>.*runs\/5002-1\/integration\/index.html.*runs\/5002-1\/unit\/index.html/)
    assert.match(rows[1], />#4001<\/a>.*<td class="none">–<\/td><td><a class="verdict passed" href="runs\/5001-1\/unit\/index.html">/)
})

test("drops only its own runs: a project's after 7 days or over its budget, never the site's or another project's", () => {
    const site = tempDir('site')
    const daysAgo = (days) => new Date(NOW.getTime() - days * DAY)
    addReport(site, { suite: 'e2e', reportDir: reportFolder(), outcome: 'success', run: run(2001), now: daysAgo(8) })
    addReport(site, { ...projectReport(5001, daysAgo(8)), project: 'another-project' })
    addReport(site, projectReport(5002, daysAgo(8)))
    addReport(site, projectReport(5003))
    const keys = (project) => listRuns(site, project).map((entry) => entry.key)
    assert.deepEqual(keys(PROJECT), ['5003-1'])
    assert.deepEqual(keys(), ['2001-1'])
    assert.deepEqual(keys('another-project'), ['5001-1'])
    addReport(site, { suite: 'e2e', reportDir: reportFolder(), outcome: 'success', run: run(2002), now: NOW })
    assert.deepEqual(keys(), ['2002-1'])
    assert.deepEqual(keys(PROJECT), ['5003-1'])
    assert.deepEqual(keys('another-project'), ['5001-1'])

    // The budget counts the project's own runs only: the site's bigger run is not its to drop.
    addReport(site, { suite: 'e2e', reportDir: reportFolder({ 'index.html': 'x'.repeat(20_000) }), outcome: 'success', run: run(2003), now: new Date(NOW.getTime() + 500) })
    const big = (id, offset) => ({ ...projectReport(id, new Date(NOW.getTime() + offset)), reportDir: reportFolder({ 'index.html': 'x'.repeat(4000) }) })
    addReport(site, { ...big(5004, 1000), maxSiteBytes: 100_000 })
    addReport(site, { ...big(5005, 2000), maxSiteBytes: 100_000 })
    const warnings = []
    addReport(site, { ...big(5006, 3000), maxSiteBytes: 12_000, warn: (message) => warnings.push(message) })
    assert.deepEqual(keys(PROJECT), ['5006-1', '5005-1'])
    assert.deepEqual(warnings, [
        'sp-js-provisioning is over its size budget: dropped run 5003-1.',
        'sp-js-provisioning is over its size budget: dropped run 5004-1.'
    ])
    assert.deepEqual(keys(), ['2003-1', '2002-1'])
    // Pages publishes at most 1 GB for the whole site.
    assert.ok(MAX_SITE_BYTES + MAX_PROJECT_BYTES < 1024 * 1024 * 1024)
})

test("keeps a project's runs to a budget of their own by default, 100 MB, not the site's 800 MB", (t) => {
    assert.equal(MAX_PROJECT_BYTES, 100 * 1024 * 1024)
    const site = tempDir('site')
    t.after(() => fs.rmSync(site, { recursive: true, force: true }))
    // Two earlier runs of 60 MB each, as sparse files (no disk is written): together over the
    // project's budget, far under the site's.
    for (const [id, offset] of [
        [5001, -2000],
        [5002, -1000]
    ]) {
        addReport(site, projectReport(id, new Date(NOW.getTime() + offset)))
        const trace = path.join(site, PROJECT, 'runs', `${id}-1`, 'unit', 'trace.zip')
        fs.writeFileSync(trace, '')
        fs.truncateSync(trace, 60 * 1024 * 1024)
    }
    const warnings = []
    addReport(site, { ...projectReport(5003), warn: (message) => warnings.push(message) })
    assert.deepEqual(
        listRuns(site, PROJECT).map((entry) => entry.key),
        ['5003-1', '5002-1']
    )
    assert.deepEqual(warnings, ['sp-js-provisioning is over its size budget: dropped run 5001-1.'])
})

test('lists as projects only the folders whose project.json names them', () => {
    const site = reportFolder({
        'sp-js-provisioning/project.json': JSON.stringify({ project: PROJECT }),
        'another/project.json': JSON.stringify({ project: 'something-else' }),
        'Upper/project.json': JSON.stringify({ project: 'Upper' }),
        'runs/project.json': JSON.stringify({ project: 'runs' }),
        'stray/index.html': '<html></html>',
        'a-project/project.json': JSON.stringify({ project: 'a-project' })
    })
    assert.deepEqual(listProjects(site), ['a-project', PROJECT])
})

test("links each project from prosjektportalen365's front page, which is otherwise the deployed publishers', byte for byte", () => {
    const site = tempDir('site')
    addReport(site, { suite: 'e2e', reportDir: reportFolder(), outcome: 'failure', run: run(2001), now: NOW })
    addReport(site, { suite: 'integration', reportDir: reportFolder(), outcome: 'success', run: run(2001), now: NOW })
    const runs = listRuns(site)
    const linked = renderIndex(runs, NOW, ['another-project', PROJECT])
    assert.match(
        linked,
        /\(Oslo time\)\.<\/p>\n<p class="projects">Also on this site: <a href="another-project\/">another-project<\/a> · <a href="sp-js-provisioning\/">sp-js-provisioning<\/a><\/p>\n<div class="table">/
    )
    assert.match(linked, /<title>PP365 test reports<\/title>/)
    for (const { file } of DEPLOYED) {
        const deployed = require(file).renderIndex(runs, NOW)
        assert.equal(renderIndex(runs, NOW), deployed, path.basename(file))
        assert.equal(linked.replace(/<p class="projects">.*<\/p>\n/, ''), deployed, path.basename(file))
    }

    // The line comes from the folders' project.json, when prosjektportalen365 publishes.
    addReport(site, projectReport(5001))
    assert.doesNotMatch(fs.readFileSync(path.join(site, 'index.html'), 'utf8'), /Also on this site/)
    addReport(site, { suite: 'e2e', reportDir: reportFolder(), outcome: 'success', run: run(2002), now: NOW })
    assert.ok(fs.readFileSync(path.join(site, 'index.html'), 'utf8').includes(`(Oslo time).</p>\n${PROJECTS_LINE}<div class="table">`))
})

test("refuses a change to what its publisher does not own: the site's runs, front page and .nojekyll, or a project's folder", () => {
    assert.deepEqual(foreignChanges(['.nojekyll', 'index.html', 'runs/2001-1/e2e.json', 'README.md', 'sp-js-provisioning/index.html']), [
        'README.md',
        'sp-js-provisioning/index.html'
    ])
    assert.deepEqual(
        foreignChanges(['.nojekyll', 'index.html', 'sp-js-provisioning/runs/5001-1/unit.json', 'runs/2001-1/e2e.json', 'another/index.html'], PROJECT),
        ['.nojekyll', 'index.html', 'runs/2001-1/e2e.json', 'another/index.html']
    )
})

test('pushes nothing, and does not try again, when a publish would change files its publisher does not own', () => {
    const remote = siteRemote()
    publish({ remote, report: siteReport('e2e', 2001), log: () => undefined })
    publish({ remote, report: projectReport(5001), log: () => undefined })
    const tip = git(remote, 'rev-parse', 'gh-pages')
    const messages = []
    const log = (message) => messages.push(message)
    const sleep = () => assert.fail('a refused publish waits for nothing')
    assert.throws(
        () => publish({ remote, report: projectReport(5002), log, sleep, beforePush: (dir) => fs.rmSync(path.join(dir, 'runs'), { recursive: true }) }),
        /^Error: Refused to publish: the commit would change runs\/2001-1\/e2e.json, runs\/2001-1\/e2e\/index.html, which sp-js-provisioning's reports do not own\. Nothing was pushed\.$/
    )
    for (const file of ['index.html', '.nojekyll']) {
        assert.throws(
            () => publish({ remote, report: projectReport(5002), log, sleep, beforePush: (dir) => fs.appendFileSync(path.join(dir, file), '\n') }),
            new RegExp(`the commit would change ${file.replace('.', '\\.')}, which sp-js-provisioning's reports do not own`)
        )
    }
    assert.throws(
        () => publish({ remote, report: siteReport('e2e', 2002), log, sleep, beforePush: (dir) => fs.writeFileSync(path.join(dir, PROJECT, 'index.html'), 'replaced') }),
        /the commit would change sp-js-provisioning\/index.html, which prosjektportalen365's reports do not own/
    )
    assert.deepEqual(messages, [])
    assert.equal(git(remote, 'rev-parse', 'gh-pages'), tip)
})

test("guards a site's first publish too, before it has a branch: a project's writes only its folder", () => {
    // With no branch to compare with, the guard checks every file the commit adds.
    const remote = siteRemote()
    const messages = []
    const sleep = () => assert.fail('a refused publish waits for nothing')
    assert.throws(
        () =>
            publish({
                remote,
                report: projectReport(5001),
                log: (message) => messages.push(message),
                sleep,
                beforePush: (dir) => fs.writeFileSync(path.join(dir, 'index.html'), 'a front page')
            }),
        /^Error: Refused to publish: the commit would change index\.html, which sp-js-provisioning's reports do not own\. Nothing was pushed\.$/
    )
    assert.deepEqual(messages, [])
    assert.equal(git(remote, 'for-each-ref'), '')
    publish({ remote, report: projectReport(5001), log: () => undefined })
    assert.deepEqual(git(remote, 'ls-tree', '-r', '--name-only', 'gh-pages').split('\n'), [
        'sp-js-provisioning/index.html',
        'sp-js-provisioning/project.json',
        'sp-js-provisioning/runs/5001-1/unit.json',
        'sp-js-provisioning/runs/5001-1/unit/index.html'
    ])
    assert.equal(git(remote, 'rev-list', '--count', 'gh-pages'), '1')
})

test("keeps a project's folder through prosjektportalen365's publishes, the deployed publishers' and this one's", () => {
    for (const { file } of DEPLOYED) {
        const remote = siteRemote()
        publishWith(PUBLISHER, remote, projectArgs(), 5001)
        const project = tree(remote, PROJECT)
        assert.ok(project.includes('sp-js-provisioning/runs/5001-1/unit/index.html'))
        publishWith(file, remote, integrationArgs(), 2001)
        assert.equal(tree(remote, PROJECT), project, path.basename(file))
        // The deployed publishers know no projects: their front page has no line.
        assert.doesNotMatch(git(remote, 'show', 'gh-pages:index.html'), /Also on this site/)
        publishWith(PUBLISHER, remote, ['--suite', 'e2e', '--report', reportFolder(), '--outcome', 'success'], 2002)
        assert.equal(tree(remote, PROJECT), project, path.basename(file))
        assert.ok(git(remote, 'show', 'gh-pages:index.html').includes(PROJECTS_LINE))
        assert.deepEqual(runKeys(remote), ['2001-1', '2002-1'])
        assert.equal(git(remote, 'rev-list', '--count', 'gh-pages'), '1')
    }
})

test("leaves everything outside its folder byte for byte as it was, after any of prosjektportalen365's publishers", () => {
    for (const file of [...DEPLOYED.map((deployed) => deployed.file), PUBLISHER]) {
        const remote = siteRemote()
        const sitePublish = require(file).publish
        sitePublish({ remote, report: siteReport('integration', 2001, NOW), log: () => undefined })
        const outside = treeOutsideProject(remote)
        // An hour later: a project's publish that rendered the front page again would change its
        // "Updated" time.
        publish({ remote, report: projectReport(5001, new Date(NOW.getTime() + 60 * 60 * 1000)), log: () => undefined })
        assert.equal(treeOutsideProject(remote), outside, path.basename(file))
        assert.deepEqual(runKeys(remote, PROJECT), ['5001-1'], path.basename(file))
        sitePublish({ remote, report: siteReport('integration', 2002, new Date(NOW.getTime() + 2 * 60 * 60 * 1000)), log: () => undefined })
        assert.deepEqual(runKeys(remote), ['2001-1', '2002-1'], path.basename(file))
        assert.deepEqual(runKeys(remote, PROJECT), ['5001-1'], path.basename(file))
        assert.equal(git(remote, 'rev-list', '--count', 'gh-pages'), '1')
    }
})

test('without a project, publishes what prosjektportalen365\'s current publisher publishes, and fails the same way', () => {
    // The same reports, published by both into a site of their own each: the same tree, byte for byte.
    const remotes = { current: siteRemote(), generic: siteRemote() }
    const reports = { e2e: reportFolder({ 'index.html': '<html><body>e2e</body></html>' }), integration: reportFolder() }
    const publishers = { current: require(CURRENT).publish, generic: publish }
    for (const [name, publishSite] of Object.entries(publishers)) {
        publishSite({ remote: remotes[name], report: siteReport('e2e', 2001, NOW, reports.e2e), log: () => undefined })
        publishSite({ remote: remotes[name], report: siteReport('integration', 2001, NOW, reports.integration), log: () => undefined })
    }
    assert.equal(tree(remotes.generic), tree(remotes.current))

    // With a project on the site, the front page has its line, and nothing else differs.
    for (const remote of Object.values(remotes)) publish({ remote, report: projectReport(5001), log: () => undefined })
    const later = new Date(NOW.getTime() + 1000)
    for (const [name, publishSite] of Object.entries(publishers)) {
        publishSite({ remote: remotes[name], report: siteReport('e2e', 2002, later, reports.e2e), log: () => undefined })
    }
    const without = (remote) => tree(remote).split('\n').filter((line) => !line.endsWith('\tindex.html'))
    assert.deepEqual(without(remotes.generic), without(remotes.current))
    assert.equal(git(remotes.generic, 'show', 'gh-pages:index.html'), git(remotes.current, 'show', 'gh-pages:index.html').replace('<div class="table">', `${PROJECTS_LINE}<div class="table">`))

    // A site repository it cannot reach: the same attempts, waits and messages.
    const missing = path.join(tempDir('remote'), 'missing.git')
    const failure = (publishSite) => {
        const messages = []
        const waits = []
        let message
        try {
            publishSite({ remote: missing, report: siteReport('e2e', 2003), log: (text) => messages.push(text), sleep: (ms) => waits.push(ms) })
        } catch (error) {
            message = error.message
        }
        return { messages, waits, message }
    }
    const current = failure(publishers.current)
    assert.match(current.message, /could not reach the site repository/)
    assert.deepEqual(failure(publishers.generic), current)
})

test("starts over when the other repository's publisher pushed first, so both reports are kept", () => {
    const remote = siteRemote()
    const messages = []
    let raced = false
    publish({
        remote,
        report: projectReport(5001),
        log: (message) => messages.push(message),
        sleep: () => undefined,
        beforePush: () => {
            if (raced) return
            raced = true
            publish({ remote, report: siteReport('e2e', 2001), log: () => undefined })
        }
    })
    assert.deepEqual(messages, ["Attempt 1 of 5 lost to another job's push; trying again."])
    const files = git(remote, 'ls-tree', '-r', '--name-only', 'gh-pages').split('\n')
    assert.ok(files.includes('runs/2001-1/e2e/index.html'))
    assert.ok(files.includes('sp-js-provisioning/runs/5001-1/unit/index.html'))
    // The front page gets the line with prosjektportalen365's next publish.
    assert.doesNotMatch(git(remote, 'show', 'gh-pages:index.html'), /Also on this site/)
})

test("waits 10 to 40 s between attempts when GitHub refuses the deploy key or cannot be reached, and says where to look", () => {
    // Run #1404 of prosjektportalen365 (2026-11-04): every push was refused with
    // "Permission denied (publickey)" in an incident with Git operations on GitHub.
    for (const stderr of ['git@github.com: Permission denied (publickey).', 'ssh: connect to host github.com port 22: Connection timed out']) {
        const ssh = fakeSsh(stderr)
        const messages = []
        const waits = []
        const escaped = stderr.replace(/[.()]/g, '\\$&')
        assert.throws(
            () =>
                publish({
                    remote: GITHUB_REMOTE,
                    gitEnv: { ...process.env, ...ssh.vars },
                    report: projectReport(5001),
                    log: (message) => messages.push(message),
                    sleep: (ms) => waits.push(ms)
                }),
            new RegExp(
                `^Error: The report could not be pushed after 5 attempts: could not reach the site repository \\(${escaped}\\)\\. ` +
                    'Check https://www\\.githubstatus\\.com first; if GitHub is up, check the deploy key and TEST_REPORTS_DEPLOY_KEY'
            )
        )
        assert.deepEqual(
            messages,
            [1, 2, 3, 4].map((attempt) => `Attempt ${attempt} of 5 could not reach the site repository (${stderr}); trying again in ${10 * attempt} s.`)
        )
        assert.deepEqual(waits, [10_000, 20_000, 30_000, 40_000])
        assert.equal(ssh.calls(), 5)
    }
})

test('writes a failed publish to the job summary as well as the error', async () => {
    const ssh = fakeSsh('git@github.com: Permission denied (publickey).')
    const summary = path.join(tempDir('summary'), 'summary.md')
    const messages = []
    await assert.rejects(
        main(projectArgs(), cleanEnv({ ...ssh.vars, TEST_REPORTS_REMOTE: GITHUB_REMOTE, GITHUB_STEP_SUMMARY: summary }), {
            log: (message) => messages.push(message),
            sleep: () => undefined
        }),
        /^Error: The report could not be pushed after 5 attempts: could not reach the site repository /
    )
    assert.match(
        fs.readFileSync(summary, 'utf8'),
        /^### Unit report\n\nNot published to the test report site: The report could not be pushed after 5 attempts: could not reach the site repository \(git@github\.com: Permission denied \(publickey\)\.\)\. Check https:\/\/www\.githubstatus\.com first; .*\.md\)\. The report is only in the artifact\.\n$/
    )
    assert.equal(messages.length, 4)
    assert.equal(ssh.calls(), 5)
})

test('waits between attempts with the sleep main is given, never for real', async (t) => {
    // A real wait would hold the tests 100 s before the waits are checked: it fails at once instead.
    t.mock.method(Atomics, 'wait', () => assert.fail('waited for real: main did not pass its sleep on to publish'))
    const ssh = fakeSsh('git@github.com: Permission denied (publickey).')
    const waits = []
    await assert.rejects(
        main(projectArgs(), cleanEnv({ ...ssh.vars, TEST_REPORTS_REMOTE: GITHUB_REMOTE }), {
            log: () => undefined,
            sleep: (ms) => waits.push(ms)
        }),
        /could not reach the site repository/
    )
    assert.deepEqual(waits, [10_000, 20_000, 30_000, 40_000])
    assert.equal(ssh.calls(), 5)
})

test('warns with the first line of the error, and exits 1, when it cannot publish', () => {
    const result = spawnSync(process.execPath, [PUBLISHER, '--project', 'runs', '--suite', 'unit', '--report', reportFolder()], { encoding: 'utf8', env: cleanEnv() })
    assert.equal(result.status, 1)
    assert.match(result.stdout, /^::warning title=Test report site::Usage: node \.tasks\/publish-test-report\.js --suite e2e\|integration .*\[--outcome <outcome>\]$/m)
})

test('says the site is not set up, and exits 0, without its variables and key', () => {
    const result = spawnSync(process.execPath, [PUBLISHER, ...projectArgs()], { encoding: 'utf8', env: cleanEnv() })
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /^::notice title=Unit report::The test report site is not set up /)
})

test("takes the commit's subject from the checkout when COMMIT_SUBJECT is empty, as on a run started by hand", () => {
    const checkout = tempDir('checkout')
    git(checkout, 'init', '--quiet')
    git(checkout, '-c', 'user.name=CI', '-c', 'user.email=ci@example.com', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '--allow-empty', '-m', 'fix: the subject', '-m', 'The body.')
    const remote = siteRemote()
    const result = spawnSync(process.execPath, [PUBLISHER, ...projectArgs()], {
        cwd: checkout,
        encoding: 'utf8',
        env: cleanEnv({ TEST_REPORTS_REMOTE: remote, GITHUB_RUN_ID: '5001', GITHUB_SHA: git(checkout, 'rev-parse', 'HEAD') })
    })
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.equal(JSON.parse(git(remote, 'show', 'gh-pages:sp-js-provisioning/runs/5001-1/unit.json')).run.subject, 'fix: the subject')
})

test('accepts a project and its suites only as lower-case names, and never the runs folder', async () => {
    const report = reportFolder()
    for (const args of [
        ['--project', 'runs', '--suite', 'unit'],
        ['--project', 'SP-JS', '--suite', 'unit'],
        ['--project', '../x', '--suite', 'unit'],
        ['--project', PROJECT, '--suite', 'Unit'],
        ['--suite', 'unit']
    ]) {
        await assert.rejects(main([...args, '--report', report], {}), /^Error: Usage: /, args.join(' '))
    }
})

test('checks against the publishers as they were deployed, unchanged', () => {
    for (const { blob, file } of DEPLOYED) assert.equal(git(__dirname, 'hash-object', file), blob)
})
