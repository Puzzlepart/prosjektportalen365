/**
 * Tests for publish-test-report.js: the test report site keeps each run's reports apart, drops
 * runs older than the artifacts' 7 days, escapes commit subjects, and two jobs publishing at once
 * both land on the branch, which stays one commit without history, and nothing is pushed to a site
 * that answers without a GitHub sign-in. Run with `npm run test:tasks` (needs git).
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { addReport, assertSitePrivate, listRuns, prepareSsh, publish, readCounts, runFromEnvironment } = require('./publish-test-report')

const NOW = new Date('2026-10-14T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000

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

function git(cwd, ...args) {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

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

test("reads the counts from Playwright's results.json and from the integration report's embedded summary", () => {
    const dir = reportFolder({
        'results.json': JSON.stringify({ stats: { expected: 40, unexpected: 1, flaky: 2, skipped: 3, duration: 1234.5 } }),
        'index.html':
            '<html><script type="application/json" id="report-summary">' +
            JSON.stringify({ success: false, counts: { tests: 9, passed: 5, failed: 1, cancelled: 1, skipped: 1, todo: 1 }, durationMs: 99 }) +
            '</script></html>'
    })
    assert.deepEqual(readCounts('e2e', dir, path.join(dir, 'results.json')), {
        passed: 40,
        failed: 1,
        flaky: 2,
        skipped: 3,
        durationMs: 1234.5
    })
    assert.deepEqual(readCounts('integration', dir), { passed: 5, failed: 2, flaky: 0, skipped: 2, durationMs: 99 })
    assert.equal(readCounts('e2e', dir, path.join(dir, 'missing.json')), undefined)
    assert.equal(readCounts('integration', reportFolder({ 'index.html': '<html></html>' })), undefined)
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
    let raced = false
    publish({
        remote,
        report: options('e2e'),
        log: (message) => messages.push(message),
        beforePush: () => {
            if (raced) return
            raced = true
            publish({ remote, report: options('integration'), log: () => undefined })
        }
    })
    assert.equal(messages.length, 1)
    assert.match(messages[0], /Attempt 1 of 5 failed/)
    const files = git(remote, 'ls-tree', '-r', '--name-only', 'gh-pages').split('\n')
    assert.ok(files.includes('runs/2001-1/e2e/index.html'))
    assert.ok(files.includes('runs/2001-1/integration/index.html'))
    assert.equal(git(remote, 'rev-list', '--count', 'gh-pages'), '1')
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
