/**
 * @fileoverview Sets the release version on every Rush project.
 *
 * `npm version` sets the version in the root package.json and runs this script from `postversion`.
 * Updates the following files:
 * * package.json of every project in rush.json: the six SPFx solutions, `Templates`, the shared
 *   tooling in `SharePointFramework/.tasks`, `.eslint-config` and `.jest-config`, and `e2e`
 * * config/package-solution.json of each SPFx solution, as `x.y.z.0`
 * * every src/**\/manifest.json of each SPFx solution
 *
 * Every project follows the release: none is published, and the solutions link the shared ones
 * with `workspace:*` (`link:` in the lockfile), so the version only names the release a project
 * belongs to. The projects come from rush.json, so a new one is covered without a change here.
 *
 * Usage, from the repo root: `npm run sync-version`, or `npm run sync-version -- --dry-run` to
 * list the changes without writing them.
 */
if (process.env.npm_package_version === undefined) {
    throw 'Package version cannot be evaluated'
}

const util = require('util')
const fs = require('fs')
const path = require('path')
const globMod = require('glob')
const glob = util.promisify(globMod)
const root = path.resolve(__dirname, '..')
const dryRun = process.argv.includes('--dry-run')
const pkgVersion = process.env.npm_package_version
const version = pkgVersion.indexOf('-') === -1
    ? pkgVersion : pkgVersion.split('-')[0]

/**
 * Get file content
 *
 * @param {*} file - File path, relative to the repo root
 * @returns file content as JSON
 */
function getFileContent(file) {
    const fileContent = fs.readFileSync(path.resolve(root, file), 'UTF-8')
    const fileContentJson = JSON.parse(fileContent)
    return fileContentJson
}

/**
 * Set file content, keeping the file's final newline (or its lack of one), so a version bump
 * neither adds nor drops one
 *
 * @param {*} file - File path, relative to the repo root
 * @param {*} json - JSON
 */
function setFileContent(file, json) {
    const filePath = path.resolve(root, file)
    const eol = fs.readFileSync(filePath, 'UTF-8').endsWith('\n') ? '\n' : ''
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + eol, 'UTF-8')
}

/**
 * Set a version in each file, writing only the files whose version differs
 *
 * @param {string[]} files - File paths, relative to the repo root
 * @param {string} newVersion - Version to set
 * @param {(json: any) => any} owner - Returns the object holding `version` in the file's JSON
 */
function setVersion(files, newVersion, owner = (json) => json) {
    for (const file of files) {
        const content = getFileContent(file)
        const oldVersion = owner(content).version
        if (oldVersion === newVersion) continue
        console.log(`${dryRun ? '[dry run] ' : ''}${file}: ${oldVersion} -> ${newVersion}`)
        if (dryRun) continue
        owner(content).version = newVersion
        setFileContent(file, content)
    }
}

/**
 * Main entry point for the task
 */
const _ = async () => {
    const projectFolders = getFileContent('rush.json').projects.map((p) => p.projectFolder)
    const pkgFiles = projectFolders.map((folder) => `${folder}/package.json`)
    const pkgSolutionFiles = projectFolders
        .map((folder) => `${folder}/config/package-solution.json`)
        .filter((file) => fs.existsSync(path.resolve(root, file)))
    const manifestFiles = []
    for (const folder of projectFolders) {
        manifestFiles.push(...(await glob(`${folder}/src/**/manifest.json`, { cwd: root })))
    }
    setVersion(pkgFiles, version)
    setVersion(pkgSolutionFiles, version + '.0', (json) => json.solution)
    setVersion(manifestFiles, version)
    console.log(`${dryRun ? '[dry run] ' : ''}Version ${version}: ${pkgFiles.length} projects, ${pkgSolutionFiles.length} solutions, ${manifestFiles.length} manifests`)
}

_().catch((error) => {
    console.error(error)
    process.exit(1)
})
