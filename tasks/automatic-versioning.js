/**
 * Automatically updates version for SPFx packages.
 * 
 * Updates the following files:
 * * package.json
 * * package-solution.js
 * * manifest.json
 */

if (process.env.npm_package_version === undefined) {
    throw 'Package version cannot be evaluated'
}

const util = require('util')
const fs = require('fs')
const path = require('path')
const globMod = require('glob')
const glob = util.promisify(globMod)
const readFileAsync = util.promisify(fs.readFileSync)
const pkgVersion = process.env.npm_package_version
const version = pkgVersion.indexOf('-') === -1
    ? pkgVersion : pkgVersion.split('-')[0]

function getFileContent(file) {
    const fileContent = fs.readFileSync(path.resolve(__dirname, "..", file), 'UTF-8')
    const fileContentJson = JSON.parse(fileContent)
    return fileContentJson
}

function setFileContent(file, json) {
    fs.writeFileSync(path.resolve(__dirname, "..", file), JSON.stringify(json, null, 2), 'UTF-8')
}

function setPkgVersion(files) {
    for (let i = 0; i < files.length; i++) {
        let pkgContent = getFileContent(files[i])
        pkgContent.version = version
        setFileContent(files[i], pkgContent)
    }
}

function setPkgSolutionVersion(files) {
    for (let i = 0; i < files.length; i++) {
        let pkgSolutionContent = getFileContent(files[i])
        pkgSolutionContent.solution.version = version + '.0'
        setFileContent(files[i], pkgSolutionContent)
    }
}

function setManifestVersion(files) {
    for (let i = 0; i < files.length; i++) {
        let manifestContent = getFileContent(files[i])
        manifestContent.version = version
        setFileContent(files[i], manifestContent)
    }
}

const _ = async () => {
    let pkgFiles = await glob('SharePointFramework/*/package.json')
    let pkgSolutionFiles = await glob('SharePointFramework/*/config/package-solution.json')
    let manifestFiles = await glob('SharePointFramework/*/src/**/manifest.json')
    setPkgVersion(pkgFiles)
    setPkgSolutionVersion(pkgSolutionFiles)
    setManifestVersion(manifestFiles)
}

_()