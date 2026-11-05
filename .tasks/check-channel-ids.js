/**
 * @fileoverview Checks that the SPFx solutions carry the main channel's ids in their source.
 *
 * `npm run watch` (with `SERVE_CHANNEL` other than main) and the channel builds write another
 * channel's solution id, name and package, and every component id, into `config/package-solution.json`
 * and the `manifest.json` files while they run, and put them back after. A commit made in between
 * carries the other channel's ids, and a release build from it would package them: the main
 * package would then replace the test channel's on any tenant that has both. `Install/Build-Release.ps1`
 * runs this first and stops on a mismatch, whichever channel it builds, since a channel build
 * swaps its ids in from the main ones.
 *
 * Usage, from the repo root: `node .tasks/check-channel-ids.js [Solution ...]` (all six when none is
 * given). Exits 1 and lists every mismatch when there is one.
 */
const fs = require('fs')
const path = require('path')

const SOLUTIONS = ['shared-library', 'PortfolioExtensions', 'PortfolioWebParts', 'ProgramWebParts', 'ProjectExtensions', 'ProjectWebParts']

/** Reads a JSON file relative to `root`. */
function readJson(root, file) {
    return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
}

/** The `manifest.json` files under a solution's `src`, as paths relative to `root`, `/`-separated. */
function manifestFiles(root, solution) {
    const src = path.join(root, 'SharePointFramework', solution, 'src')
    if (!fs.existsSync(src)) return []
    return fs
        .readdirSync(src, { recursive: true })
        .map((file) => String(file).split(path.sep).join('/'))
        .filter((file) => file === 'manifest.json' || file.endsWith('/manifest.json'))
        .map((file) => `SharePointFramework/${solution}/src/${file}`)
        .sort()
}

/**
 * Lists where the given solutions' source differs from `channels/<channel>.json`: the solution's
 * id, name and package in `config/package-solution.json`, and each component manifest's id by its
 * alias. Empty when everything matches.
 *
 * @param {string} root Repository root
 * @param {string[]} solutions Solution folder names under `SharePointFramework`
 * @param {string} channel Channel whose ids the source must carry
 * @returns {string[]} One line per mismatch
 */
function findChannelIdMismatches(root, solutions = SOLUTIONS, channel = 'main') {
    const channelFile = `channels/${channel}.json`
    const config = readJson(root, channelFile).spfx.solutions
    const found = []
    for (const solution of solutions) {
        const expected = config[solution]
        if (!expected) {
            found.push(`${solution}: not in ${channelFile}`)
            continue
        }
        const packageSolution = readJson(root, `SharePointFramework/${solution}/config/package-solution.json`)
        const actual = {
            'solution.id': packageSolution.solution.id,
            'solution.name': packageSolution.solution.name,
            'paths.zippedPackage': packageSolution.paths.zippedPackage
        }
        const wanted = {
            'solution.id': expected.id,
            'solution.name': expected.name,
            'paths.zippedPackage': expected.zippedPackage
        }
        for (const key of Object.keys(wanted)) {
            if (actual[key] !== wanted[key]) {
                found.push(`${solution}: config/package-solution.json ${key} is "${actual[key]}", ${channelFile} has "${wanted[key]}"`)
            }
        }
        for (const file of manifestFiles(root, solution)) {
            const manifest = readJson(root, file)
            const id = expected.components && expected.components[manifest.alias]
            if (!id) found.push(`${solution}: ${manifest.alias} (${file}) is not in ${channelFile}`)
            else if (manifest.id !== id) found.push(`${solution}: ${manifest.alias} (${file}) has id "${manifest.id}", ${channelFile} has "${id}"`)
        }
    }
    return found
}

/** The upgrade step that removes another channel's footer from a site, by the ids it lists. */
const FOOTER_STEP = 'Install/Scripts/UpgradeAllSitesToLatest/EnsureFooterExtension.ps1'

const GUID = /[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/gi

/**
 * Lists where the footer ids in `$ChannelFooterIds` of the footer step differ from the footer of
 * each channel in `channels/`. A channel the step does not know keeps its footer on a site of
 * another channel, which then runs two footers. Empty when they match.
 *
 * @param {string} root Repository root
 * @returns {string[]} One line per channel the step lacks and per id no channel has
 */
function findFooterStepMismatches(root) {
    const channels = new Map()
    for (const file of fs.readdirSync(path.join(root, 'channels')).filter((f) => f.endsWith('.json') && !f.startsWith('$'))) {
        const footer = readJson(root, `channels/${file}`).spfx?.solutions?.PortfolioExtensions?.components?.Footer
        if (footer) channels.set(footer.toLowerCase(), file)
    }
    const block = /\$ChannelFooterIds\s*=\s*@\(([\s\S]*?)\)/.exec(fs.readFileSync(path.join(root, FOOTER_STEP), 'utf8'))
    const listed = new Set((block?.[1].match(GUID) ?? []).map((id) => id.toLowerCase()))
    const found = []
    for (const [id, file] of channels) {
        if (!listed.has(id)) found.push(`${FOOTER_STEP}: $ChannelFooterIds lacks the footer of channels/${file} (${id})`)
    }
    for (const id of listed) {
        if (!channels.has(id)) found.push(`${FOOTER_STEP}: $ChannelFooterIds has ${id}, the footer of no channel in channels/`)
    }
    return found
}

if (require.main === module) {
    const root = path.resolve(__dirname, '..')
    const solutions = process.argv.slice(2)
    const found = findChannelIdMismatches(root, solutions.length > 0 ? solutions : SOLUTIONS)
    if (found.length > 0) {
        console.error('The source does not carry the main channel ids:')
        for (const line of found) console.error(`  ${line}`)
        console.error(
            'A watch or channel build that did not finish leaves them behind: revert with ' +
            '`node ../.tasks/modifySolutionFiles.js --revert --force` and `node ../.tasks/setBundleConfig.js --revert` ' +
            'in the solution, and never commit channel ids.'
        )
        process.exit(1)
    }
    const footerStep = findFooterStepMismatches(root)
    if (footerStep.length > 0) {
        console.error("The footer step's channel ids differ from channels/:")
        for (const line of footerStep) console.error(`  ${line}`)
        console.error('List the footer of every channel in $ChannelFooterIds, as channels/<name>.json has it.')
        process.exit(1)
    }
    console.log(`Channel ids: ${solutions.length || SOLUTIONS.length} solution(s) carry the main channel ids; the footer step knows every channel.`)
}

module.exports = { findChannelIdMismatches, findFooterStepMismatches, FOOTER_STEP, SOLUTIONS }
