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
if (!fs.existsSync('.dist')) {
    fs.mkdirSync('.dist');
}

const TEMPLATES_PATH = path.resolve(__dirname, '..', 'Templates')
const PORTFOLIO_TEMPLATE_FOLDER = `${TEMPLATES_PATH}/Portfolio`
const CHANNEL_PORTFOLIO_TEMPLATE_FOLDER = '.dist/Templates/Portfolio'
const CURRENT_CHANNEL_CONFIG_PATH = '.current-channel-config.json'
const MAIN_CHANNEL_CONFIG_PATH = 'channels/main.json'

/**
 * Get file content for the given file path in JSON format
 * 
 * @param {*} file File path 
 * @returns File contents as JSON
 */
function getFileContent(file) {
    const filePath = path.resolve(__dirname, '..', file)
    const fileContent = fs.readFileSync(filePath, 'UTF-8')
    const fileContentJson = JSON.parse(fileContent)
    return fileContentJson
}

// Get the current channel config using constant CURRENT_CHANNEL_CONFIG_PATH
var currentChannelConfig = getFileContent(CURRENT_CHANNEL_CONFIG_PATH)

// Get the main channel config using constant MAIN_CHANNEL_CONFIG_PATH
var mainChannelConfig = getFileContent(MAIN_CHANNEL_CONFIG_PATH)

// Build the channel replace values using the current channel config and main channel config
var channelReplaceValues = Object.keys(currentChannelConfig.spfx.solutions).reduce((acc, key) => {
    const solution = currentChannelConfig.spfx.solutions[key]
    const mainSolution = mainChannelConfig.spfx.solutions[key]
    return Object.keys(solution.components).reduce((acc, componentKey) => {
        acc[mainSolution.components[componentKey]] = solution.components[componentKey]
        return acc
    }, acc)
}, {})


// Copy the portfolio template folder to a temporary folder Portfolio_<channel name>
fse.copySync(PORTFOLIO_TEMPLATE_FOLDER, CHANNEL_PORTFOLIO_TEMPLATE_FOLDER)

/**
 * Replace tokens in the given template path. The tokens are defined in the `.channel-replace-map.json` file
 * and the replacement values are generated from the current channel config file (`.current-channel-config.json`).
 * 
 * @param {*} templatePath Template path
 */
function replaceTokensInTemplate(templatePath) {
    for(let i = 0; i < Object.keys(channelReplaceValues).length; i++) {
        // Get the key from the channel replace values
        const originalGuid = Object.keys(channelReplaceValues)[i]

        // Replace the key with the value in the template path
        var replacementGuid = channelReplaceValues[originalGuid]

        replace({
            regex: originalGuid,
            replacement: replacementGuid,
            paths: [templatePath],
            recursive: true,
            silent: true,
        })
    }
}

replaceTokensInTemplate(CHANNEL_PORTFOLIO_TEMPLATE_FOLDER)