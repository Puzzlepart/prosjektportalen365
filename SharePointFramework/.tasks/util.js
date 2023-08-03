const fs = require('fs')
const path = require('path')
const colors = require('colors/safe')

/**
 * Get file content for the given file path in JSON format
 * 
 * @param {*} file File path 
 * 
 * @returns File contents as JSON
 */
function getFileContent(file) {
    const fileContent = fs.readFileSync(path.resolve(process.cwd(), "..", file), 'UTF-8')
    const fileContentJson = JSON.parse(fileContent)
    return fileContentJson
}

/**
 * Join paths and replace backslashes with forward slashes to support Windows.
 * 
 * @param  {...any} paths Paths to join
 */
function joinPath(...paths) {
    return path.join(...paths).replace(/\\/g,'/')
}

/**
 * Logs a message with a colored prefix.
 * 
 * @param {*} message The message to log
 * @param {*} prefix The prefix to use - will be wrapped in square brackets
 */
function log(message, prefix) {
    console.log(`${colors.yellow(`[${prefix}]`)} ${message}`)
}
module.exports = {
    getFileContent,
    joinPath,
    log
}