// util.js

const fs = require('fs')
const path = require('path')

/**
 * Get file content for the given file path in JSON format. If the file 
 * does not exist or the JSON is invalid, the fallback value is returned.
 * 
 * By default the function goes up one folder from the current folder.
 * 
 * @param {*} file File path 
 * @param {*} fallbackValue Fallback value if file does not exist
 * 
 * @returns File contents as JSON
 */
function getFileContent(file, fallbackValue = {}) {
    try {
        const fileContent = fs.readFileSync(path.resolve(__dirname, '..', file), 'UTF-8')
        const fileContentJson = JSON.parse(fileContent)
        return fileContentJson
    } catch (error) {
        return fallbackValue
    }
}

module.exports = {
    getFileContent
}