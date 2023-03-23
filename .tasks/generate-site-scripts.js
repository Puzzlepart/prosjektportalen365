/**
 * @fileoverview Generates Site Scripts for the current channel
 * @author Puzzlepart
 */
const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')
const replace = require('replace')
const argv = require('yargs').argv

// Run replace in silent mode if the --silent flag is set
const silent = argv.silent || false

/**
 * Create the .dist folder if it does not exist
 */
if (!fs.existsSync('.dist')){
    fs.mkdirSync('.dist');
}

// Site scripts source folder path
var siteScriptsPath = path.resolve(__dirname, '..', 'SiteScripts/src')

// Destination folder for the site scripts
var channelSiteScriptsFolder = '.dist/SiteScripts'

/**
 * Get file content for the given file path in JSON format
 * 
 * @param {*} file File path 
 * @returns File contents as JSON
 */
function getFileContent(file) {
    const fileContent = fs.readFileSync(path.resolve(__dirname, '..', file), 'UTF-8')
    const fileContentJson = JSON.parse(fileContent)
    return fileContentJson
}

var currentChannelConfig = getFileContent('.current-channel-config.json')
var channelReplaceMap = getFileContent('.channel-replace-map.json')
var channelReplaceValue = Object.keys(currentChannelConfig.spfx.solutions).reduce((acc, key) => {
    const solution = currentChannelConfig.spfx.solutions[key]
    return Object.keys(solution.components).reduce((acc, componentKey) => {
        acc[`ControlId_${componentKey}`] = solution.components[componentKey]
        return acc
    }, acc)
}, {})

// Copy the site scripts to the .dist folder
fse.copySync(siteScriptsPath, channelSiteScriptsFolder)

/**
 * Replace tokens in the given site scripts path. The tokens are defined in the `.channel-replace-map.json` file
 * and the replacement values are generated from the current channel config file (`.current-channel-config.json`).
 * 
 * @param {*} siteScriptsPath Template path
 */
function replaceTokensInSiteScripts(siteScriptsPath) {
    for (var key in channelReplaceMap) {
        var token = channelReplaceMap[key]
        var replacement = channelReplaceValue[token]
        replace({
            regex: key,
            replacement,
            paths: [siteScriptsPath],
            recursive: true,
            silent,
        });
    }
}

replaceTokensInSiteScripts(channelSiteScriptsFolder)