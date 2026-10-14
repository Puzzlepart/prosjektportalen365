/**
 * Tests for SharePointFramework/.tasks/modifySolutionFiles.js, which a channel build
 * (`Build-Release.ps1 -Channel <name>`) runs in each solution: it writes the channel's ids into
 * `package-solution.json` and every `manifest.json`, stamps the CI run number into the versions,
 * and restores the files afterwards. A channel with ids of its own hides its web parts from the
 * toolbox, so a tenant with several channels does not list each web part twice; the main channel's
 * ids are the manifests' own, and its web parts stay in the toolbox. Run with `npm run test:tasks`.
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const SCRIPT = path.resolve(__dirname, '../SharePointFramework/.tasks/modifySolutionFiles.js')
const MAIN_IDS = { solution: '11111111-1111-4111-8111-111111111111', webPart: '22222222-2222-4222-8222-222222222222', extension: '33333333-3333-4333-8333-333333333333' }
const TEST_IDS = { solution: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', webPart: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', extension: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }

const write = (file, value) => {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(value, null, 2))
}
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

/** A solution folder with the main channel's ids in its files, as the repository has them. */
function solution() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp365-modify-solution-files-'))
    write(path.join(dir, 'config/package-solution.json'), {
        solution: {
            id: MAIN_IDS.solution,
            name: 'Prosjektportalen 365 - Test Web Parts',
            version: '1.15.0.0',
            features: [{ id: '44444444-4444-4444-8444-444444444444', version: '1.15.0.0' }]
        },
        paths: { zippedPackage: 'solution/pp-test-web-parts.sppkg' }
    })
    write(path.join(dir, 'src/webparts/a/manifest.json'), { id: MAIN_IDS.webPart, alias: 'AWebPart', componentType: 'WebPart' })
    write(path.join(dir, 'src/extensions/b/manifest.json'), { id: MAIN_IDS.extension, alias: 'BExtension', componentType: 'Extension' })
    return dir
}

/** The channel's config for the solution, as Build-Release.ps1 writes it before the script runs. */
function channel(dir, ids, zippedPackage) {
    write(path.join(dir, 'config/.generated-solution-config.json'), {
        id: ids.solution,
        name: 'Prosjektportalen 365 - Test Web Parts',
        zippedPackage,
        components: { AWebPart: ids.webPart, BExtension: ids.extension }
    })
}

function run(dir, args, buildNumber) {
    const env = { ...process.env, PP365_BUILD_NUMBER: buildNumber ?? '' }
    delete env.SERVE_CHANNEL
    execFileSync(process.execPath, [SCRIPT, ...args], { cwd: dir, env, stdio: 'pipe' })
}

const webPart = (dir) => read(path.join(dir, 'src/webparts/a/manifest.json'))
const extension = (dir) => read(path.join(dir, 'src/extensions/b/manifest.json'))
const packageSolution = (dir) => read(path.join(dir, 'config/package-solution.json'))

test('the main channel keeps its web parts in the toolbox and gets the run number in its versions', () => {
    const dir = solution()
    channel(dir, MAIN_IDS, 'solution/pp-test-web-parts.sppkg')
    run(dir, ['--force'], '123')
    assert.equal(webPart(dir).id, MAIN_IDS.webPart)
    assert.equal(webPart(dir).hiddenFromToolbox, undefined)
    assert.equal(packageSolution(dir).solution.id, MAIN_IDS.solution)
    assert.equal(packageSolution(dir).solution.version, '1.15.0.123')
    assert.equal(packageSolution(dir).solution.features[0].version, '1.15.0.123')
})

test('a channel with ids of its own hides its web parts, not its extensions', () => {
    const dir = solution()
    channel(dir, TEST_IDS, 'solution/pp-test-web-parts-test.sppkg')
    run(dir, ['--force'], '45')
    assert.equal(webPart(dir).id, TEST_IDS.webPart)
    assert.equal(webPart(dir).hiddenFromToolbox, true)
    assert.equal(extension(dir).id, TEST_IDS.extension)
    assert.equal(extension(dir).hiddenFromToolbox, undefined)
    assert.equal(packageSolution(dir).solution.id, TEST_IDS.solution)
    assert.equal(packageSolution(dir).paths.zippedPackage, 'solution/pp-test-web-parts-test.sppkg')
    assert.equal(packageSolution(dir).solution.version, '1.15.0.45')
})

test('keeps the version without a run number, and the revert restores the files', () => {
    const dir = solution()
    channel(dir, TEST_IDS, 'solution/pp-test-web-parts-test.sppkg')
    run(dir, ['--force'])
    assert.equal(packageSolution(dir).solution.version, '1.15.0.0')
    run(dir, ['--revert', '--force'])
    assert.equal(webPart(dir).id, MAIN_IDS.webPart)
    assert.equal(webPart(dir).hiddenFromToolbox, undefined)
    assert.equal(packageSolution(dir).solution.id, MAIN_IDS.solution)
})
