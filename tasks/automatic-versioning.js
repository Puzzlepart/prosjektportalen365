/**
 * -
 */

if (process.env.npm_package_version === undefined) {
    throw 'Package version cannot be evaluated'
}

const util = require('util')
const glob = require('glob')
const globAsync = util.promisify(glob)
const pkgVersion = process.env.npm_package_version
const version = pkgVersion.indexOf('-') === -1
    ? pkgVersion : pkgVersion.split('-')[0]

const _ = async () => {
    let pkgFiles = await globAsync('SharePointFramework/*/package.json')
    let pkgSolutionFiles = await globAsync('SharePointFramework/*/config/package-solution.json')
    let manifestFiles = await globAsync('SharePointFramework/*/src/*/manifest.json')
    console.log(manifestFiles)
}

_()