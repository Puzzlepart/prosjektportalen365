/**
 * @fileoverview This file generates temporary package solution file and component manifest files
 * with the solution ID and component IDs generated by the solution config file. This is required
 * to deploy a unique solution to the tenant app catalog.
 */
const argv = require('yargs').argv;
const fs = require('fs');
const path = require('path');
const globMod = require('glob')
const util = require('util')
const glob = util.promisify(globMod)
const revert = argv.revert;

// Config folder path
const configFolder = path.join(process.cwd(), `config`);

// Generated solution config file path
const solutionConfigFile = path.join(configFolder, `generated-solution-config.json`);

/**
 * Get file content for the given file path in JSON format
 * 
 * @param {*} file File path 
 * @returns File contents as JSON
 */
function getFileContent(file) {
    const fileContent = fs.readFileSync(path.resolve(process.cwd(), "..", file), 'UTF-8')
    const fileContentJson = JSON.parse(fileContent)
    return fileContentJson
}

/**
 * Revert package solution file to the backup file and delete the backup file. Also deletes
 * the generated solution config file.
 */
function revertPackageSolutionFile() {
    const packageSolutionFile = path.join(configFolder, `package-solution.json`);
    const packageSolutionFileCopy = path.join(configFolder, `package-solution.json.bak`);
    fs.copyFileSync(packageSolutionFileCopy, packageSolutionFile);
    fs.unlinkSync(packageSolutionFileCopy);
    fs.unlinkSync(solutionConfigFile)
}

/**
 * Revert component manifest files to the backup files and delete the backup files.
 * 
 * @param {*} componentManifestFiles Component manifest files
 */
function revertComponentManifestFiles(componentManifestFiles) {
    for (let i = 0; i < componentManifestFiles.length; i++) {
        const componentManifestFile = componentManifestFiles[i];
        const componentManifestFileCopy = componentManifestFile + '.bak';
        fs.copyFileSync(componentManifestFileCopy, componentManifestFile);
        fs.unlinkSync(componentManifestFileCopy);
    }
}

/**
 * Copy existing package solution file to a backup file
 */
function copyExistingPackageSolutionFile() {
    const packageSolutionFile = path.join(configFolder, `package-solution.json`);
    const packageSolutionFileCopy = path.join(configFolder, `package-solution.json.bak`);
    fs.copyFileSync(packageSolutionFile, packageSolutionFileCopy);
}

/**
 * Generate package solution file with the given parameters
 * 
 * @param {*} id ID of the solution
 * @param {*} name Name of the solution
 * @param {*} zippedPackage Zipped package path
 */
function generatePackageSolutionFile(id, name, zippedPackage) {
    const packageSolutionFile = path.join(configFolder, `package-solution.json`);
    const packageSolution = getFileContent(packageSolutionFile);
    packageSolution.solution.id = id;
    packageSolution.solution.name = name;
    packageSolution.paths.zippedPackage = zippedPackage
    fs.writeFileSync(packageSolutionFile, JSON.stringify(packageSolution, null, 2), { encoding: 'utf8', overwrite: true });
}

/**
 * Copy existing manifest files to backup files.
 * 
 * @param {*} componentManifestFiles Component manifest files
 */
async function copyExistingComponentManifestFiles(componentManifestFiles) {
    for (let i = 0; i < componentManifestFiles.length; i++) {
        const componentManifestFile = componentManifestFiles[i];
        const componentManifestFileCopy = componentManifestFile + '.bak';
        fs.copyFileSync(componentManifestFile, componentManifestFileCopy);
    }
}

/**
 * Generate component manifest files with a new ID based on the solution config file.
 * 
 * @param {*} solutionConfig Solution config
 * @param {*} componentManifestFiles Component manifest files
 */
function generateComponentManifestFiles(solutionConfig, componentManifestFiles) {
    for (let i = 0; i < componentManifestFiles.length; i++) {
        const componentManifestFile = componentManifestFiles[i];
        const componentManifest = getFileContent(componentManifestFile);
        componentManifest.id = solutionConfig.components[componentManifest.alias]
        fs.writeFileSync(componentManifestFile, JSON.stringify(componentManifest, null, 2), { encoding: 'utf8', overwrite: true });
    }
}



(async () => {
    const componentManifestFiles = await glob(path.join(process.cwd(), `src/**/manifest.json`));

    if (revert) {
        revertPackageSolutionFile();
        revertComponentManifestFiles(componentManifestFiles);
    } else {
        const solutionConfig = getFileContent(solutionConfigFile);
        copyExistingPackageSolutionFile();
        generatePackageSolutionFile(solutionConfig.id, solutionConfig.name, solutionConfig.zippedPackage);
        await copyExistingComponentManifestFiles(componentManifestFiles);
        generateComponentManifestFiles(solutionConfig, componentManifestFiles);
    }
})();