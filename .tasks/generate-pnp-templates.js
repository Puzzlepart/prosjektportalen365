/**
 * @fileoverview Generate PnP template for Portfolio
 * @author Puzzlepart
 */
const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')
const replace = require('replace')

/**
 * Create the .dist folder if it does not exist
 */
if (!fs.existsSync('.dist')){
    fs.mkdirSync('.dist');
}

var templatesPath = path.resolve(__dirname, '..', 'Templates')
var portfolioTemplateFolder = `${templatesPath}/Portfolio`
var channelPortfolioTemplateFolder = '.dist/Templates/Portfolio'

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

// Get the current channel config
var currentChannelConfig = getFileContent('.current-channel-config.json')

// Get the channel replace map
var channelReplaceMap = getFileContent('.channel-replace-map.json')

// Build the channel replace values
var channelReplaceValue = Object.keys(currentChannelConfig.spfx.solutions).reduce((acc, key) => {
    const solution = currentChannelConfig.spfx.solutions[key]
    return Object.keys(solution.components).reduce((acc, componentKey) => {
        acc[`ControlId_${componentKey}`] = solution.components[componentKey]
        return acc
    }, acc)
}, {})

// Copy the portfolio template folder to a temporary folder Portfolio_<channel name>
fse.copySync(portfolioTemplateFolder, channelPortfolioTemplateFolder)

/**
 * Replace tokens in the given template path. The tokens are defined in the `.channel-replace-map.json` file
 * and the replacement values are generated from the current channel config file (`.current-channel-config.json`).
 * 
 * @param {*} templatePath Template path
 */
function replaceTokensInTemplate(templatePath) {
    for (var key in channelReplaceMap) {
        var token = channelReplaceMap[key]
        var replacement = channelReplaceValue[token]
        replace({
            regex: key,
            replacement,
            paths: [templatePath],
            recursive: true,
            silent: true,
        });
    }
}

replaceTokensInTemplate(channelPortfolioTemplateFolder)