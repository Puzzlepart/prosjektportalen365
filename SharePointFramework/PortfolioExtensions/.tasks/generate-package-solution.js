const argv = require('yargs').argv;
const fs = require('fs');
const path = require('path');

const name = argv.name;
const id = argv.id;
const zippedPackage = argv.zippedPackage;
const revert = argv.revert;

console.log(revert)

console.log(`\nPackaging solution '${name}' with '${id}'...`);

/**
 * Get file content for the given file path in JSON format
 * 
 * @param {*} file File path 
 * @returns File contents as JSON
 */
function getFileContent(file) {
    const fileContent = fs.readFileSync(path.resolve(__dirname, "..", file), 'UTF-8')
    const fileContentJson = JSON.parse(fileContent)
    return fileContentJson
}

function revertPackageSolutionFile() {
    const packageSolutionFile = path.join(__dirname, `../config/package-solution.json`);
    const packageSolutionFileCopy = path.join(__dirname, `../config/package-solution.json.bak`);
    fs.copyFileSync(packageSolutionFileCopy, packageSolutionFile);
    fs.unlinkSync(packageSolutionFileCopy);
}

function copyExistingPackageSolutionFile() {
    const packageSolutionFile = path.join(__dirname, `../config/package-solution.json`);
    const packageSolutionFileCopy = path.join(__dirname, `../config/package-solution.json.bak`);
    fs.copyFileSync(packageSolutionFile, packageSolutionFileCopy);
}

function generatePackageSolutionFile() {
    const packageSolutionFile = path.join(__dirname, `../config/package-solution.json`);
    const packageSolution = getFileContent(packageSolutionFile);
    packageSolution.solution.id = id;
    packageSolution.solution.name = name;
    packageSolution.paths.zippedPackage = zippedPackage
    fs.writeFileSync(packageSolutionFile, JSON.stringify(packageSolution, null, 2), { encoding: 'utf8', overwrite: true });
}

if (revert) {
    revertPackageSolutionFile();
} else {
    copyExistingPackageSolutionFile();
    generatePackageSolutionFile();
}