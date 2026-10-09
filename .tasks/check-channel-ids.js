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
    console.log(`Channel ids: ${solutions.length || SOLUTIONS.length} solution(s) carry the main channel ids.`)
}

module.exports = { findChannelIdMismatches, SOLUTIONS }
