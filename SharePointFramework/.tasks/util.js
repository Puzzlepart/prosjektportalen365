const fs = require('fs');
const path = require('path');

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

module.exports = {
    getFileContent,
    joinPath
}