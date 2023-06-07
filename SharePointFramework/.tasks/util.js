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

module.exports = {
    getFileContent
}