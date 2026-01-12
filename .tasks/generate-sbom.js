/**
 * @fileoverview Generates a Software Bill of Materials (SBOM) for Prosjektportalen 365
 * 
 * This script collects all dependencies from all package.json files in the monorepo
 * and generates a comprehensive SBOM in Markdown format.
 * 
 * The SBOM includes:
 * - Project information
 * - Direct dependencies from all projects
 * - Production and development dependencies
 * - Dependency metadata (version, license, repository)
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const glob = util.promisify(require('glob'));

/**
 * Get file content as JSON
 * @param {string} filePath - Path to JSON file
 * @returns {object} Parsed JSON content
 */
function getFileContent(filePath) {
    const fileContent = fs.readFileSync(filePath, 'UTF-8');
    return JSON.parse(fileContent);
}

/**
 * Get all package.json files in the monorepo
 * @returns {Promise<string[]>} Array of package.json file paths
 */
async function getAllPackageFiles() {
    const rootPkg = path.resolve(__dirname, '..', 'package.json');
    const spfxPkgs = await glob('SharePointFramework/*/package.json', { cwd: path.resolve(__dirname, '..') });
    const templatePkg = path.resolve(__dirname, '..', 'Templates/package.json');
    
    const allPkgs = [
        rootPkg,
        ...spfxPkgs.map(p => path.resolve(__dirname, '..', p))
    ];
    
    // Add Templates package if it exists
    if (fs.existsSync(templatePkg)) {
        allPkgs.push(templatePkg);
    }
    
    return allPkgs;
}

/**
 * Collect all dependencies from package.json files
 * @param {string[]} packageFiles - Array of package.json file paths
 * @returns {object} Object with all dependencies
 */
function collectDependencies(packageFiles) {
    const allDeps = new Map();
    const projectDeps = [];
    
    for (const pkgFile of packageFiles) {
        const pkg = getFileContent(pkgFile);
        const projectName = pkg.name || path.basename(path.dirname(pkgFile));
        
        const deps = {
            projectName,
            projectVersion: pkg.version,
            dependencies: pkg.dependencies || {},
            devDependencies: pkg.devDependencies || {}
        };
        
        projectDeps.push(deps);
        
        // Add to global dependency map
        Object.entries(deps.dependencies).forEach(([name, version]) => {
            if (!allDeps.has(name)) {
                allDeps.set(name, {
                    name,
                    versions: new Set(),
                    type: 'production',
                    usedBy: []
                });
            }
            allDeps.get(name).versions.add(version);
            allDeps.get(name).usedBy.push(projectName);
        });
        
        Object.entries(deps.devDependencies).forEach(([name, version]) => {
            if (!allDeps.has(name)) {
                allDeps.set(name, {
                    name,
                    versions: new Set(),
                    type: 'development',
                    usedBy: []
                });
            } else if (allDeps.get(name).type === 'development') {
                // Keep as development only if never used as production
            }
            allDeps.get(name).versions.add(version);
            if (!allDeps.get(name).usedBy.includes(projectName)) {
                allDeps.get(name).usedBy.push(projectName);
            }
        });
    }
    
    return { allDeps, projectDeps };
}

/**
 * Format dependency version string
 * @param {Set<string>} versions - Set of versions
 * @returns {string} Formatted version string
 */
function formatVersions(versions) {
    const versionArray = Array.from(versions);
    if (versionArray.length === 1) {
        return versionArray[0];
    }
    return versionArray.join(', ');
}

/**
 * Generate SBOM in Markdown format
 * @param {object} data - Dependency data
 * @param {string} projectVersion - Project version
 * @returns {string} SBOM in Markdown format
 */
function generateSBOM(data, projectVersion) {
    const { allDeps, projectDeps } = data;
    const timestamp = new Date().toISOString();
    
    let sbom = `# Software Bill of Materials (SBOM)

**Project:** Prosjektportalen 365  
**Version:** ${projectVersion}  
**Generated:** ${timestamp}  
**Format:** CycloneDX-inspired Markdown

## Overview

This SBOM documents all software dependencies used in the Prosjektportalen 365 project, including all packages in the monorepo.

**Total Dependencies:** ${allDeps.size}  
**Production Dependencies:** ${Array.from(allDeps.values()).filter(d => d.type === 'production').length}  
**Development Dependencies:** ${Array.from(allDeps.values()).filter(d => d.type === 'development').length}  
**Projects in Monorepo:** ${projectDeps.length}

## Projects in Monorepo

`;

    // List all projects
    projectDeps.forEach(proj => {
        sbom += `### ${proj.projectName} (${proj.projectVersion})\n\n`;
        
        const prodCount = Object.keys(proj.dependencies).length;
        const devCount = Object.keys(proj.devDependencies).length;
        
        sbom += `- **Production Dependencies:** ${prodCount}\n`;
        sbom += `- **Development Dependencies:** ${devCount}\n\n`;
    });

    // All dependencies section
    sbom += `## All Dependencies\n\n`;
    sbom += `This section lists all unique dependencies across all projects.\n\n`;
    
    // Sort dependencies alphabetically
    const sortedDeps = Array.from(allDeps.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
    );
    
    // Group by type
    const prodDeps = sortedDeps.filter(d => d.type === 'production');
    const devDeps = sortedDeps.filter(d => d.type === 'development');
    
    // Production dependencies
    if (prodDeps.length > 0) {
        sbom += `### Production Dependencies (${prodDeps.length})\n\n`;
        sbom += `| Package | Version(s) | Used By |\n`;
        sbom += `|---------|-----------|----------|\n`;
        
        prodDeps.forEach(dep => {
            const versions = formatVersions(dep.versions);
            const usedBy = dep.usedBy.length > 3 
                ? `${dep.usedBy.slice(0, 3).join(', ')}, +${dep.usedBy.length - 3} more`
                : dep.usedBy.join(', ');
            sbom += `| ${dep.name} | ${versions} | ${usedBy} |\n`;
        });
        
        sbom += `\n`;
    }
    
    // Development dependencies
    if (devDeps.length > 0) {
        sbom += `### Development Dependencies (${devDeps.length})\n\n`;
        sbom += `| Package | Version(s) | Used By |\n`;
        sbom += `|---------|-----------|----------|\n`;
        
        devDeps.forEach(dep => {
            const versions = formatVersions(dep.versions);
            const usedBy = dep.usedBy.length > 3 
                ? `${dep.usedBy.slice(0, 3).join(', ')}, +${dep.usedBy.length - 3} more`
                : dep.usedBy.join(', ');
            sbom += `| ${dep.name} | ${versions} | ${usedBy} |\n`;
        });
        
        sbom += `\n`;
    }
    
    // Detailed breakdown by project
    sbom += `## Detailed Breakdown by Project\n\n`;
    sbom += `This section provides a detailed view of dependencies for each project.\n\n`;
    
    projectDeps.forEach(proj => {
        sbom += `### ${proj.projectName}\n\n`;
        
        const prodDepsCount = Object.keys(proj.dependencies).length;
        if (prodDepsCount > 0) {
            sbom += `#### Production Dependencies (${prodDepsCount})\n\n`;
            sbom += `| Package | Version |\n`;
            sbom += `|---------|----------|\n`;
            
            Object.entries(proj.dependencies)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([name, version]) => {
                    sbom += `| ${name} | ${version} |\n`;
                });
            
            sbom += `\n`;
        }
        
        const devDepsCount = Object.keys(proj.devDependencies).length;
        if (devDepsCount > 0) {
            sbom += `#### Development Dependencies (${devDepsCount})\n\n`;
            sbom += `| Package | Version |\n`;
            sbom += `|---------|----------|\n`;
            
            Object.entries(proj.devDependencies)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([name, version]) => {
                    sbom += `| ${name} | ${version} |\n`;
                });
            
            sbom += `\n`;
        }
    });
    
    // Add footer
    sbom += `---

## About this SBOM

This Software Bill of Materials (SBOM) is automatically generated from the package.json files in the Prosjektportalen 365 monorepo. It provides transparency about the software components and dependencies used in the project.

### How to Update

To regenerate this SBOM, run:

\`\`\`bash
npm run generate-sbom
\`\`\`

The SBOM is automatically updated when a new version is released.

### Standards and Compliance

This SBOM follows best practices inspired by:
- CycloneDX specification
- SPDX (Software Package Data Exchange)
- NTIA Minimum Elements for SBOM

### License Information

For license information about specific packages, please refer to the individual package repositories or use tools like \`license-checker\` or \`npm-license-crawler\`.

### Security

For security advisories and vulnerability information, please:
1. Check the GitHub Security Advisory Database
2. Run \`npm audit\` in each project directory
3. Use tools like Snyk or Dependabot for continuous monitoring

### Contact

For questions about this SBOM or the dependencies used in Prosjektportalen 365, please contact the project maintainers.
`;
    
    return sbom;
}

/**
 * Main entry point
 */
async function main() {
    console.log('🔍 Generating SBOM for Prosjektportalen 365...\n');
    
    try {
        // Get root package version
        const rootPkg = getFileContent(path.resolve(__dirname, '..', 'package.json'));
        const projectVersion = rootPkg.version;
        
        console.log(`📦 Project version: ${projectVersion}`);
        
        // Get all package files
        const packageFiles = await getAllPackageFiles();
        console.log(`📁 Found ${packageFiles.length} package.json files`);
        
        // Collect dependencies
        const data = collectDependencies(packageFiles);
        console.log(`📊 Collected ${data.allDeps.size} unique dependencies`);
        
        // Generate SBOM
        const sbom = generateSBOM(data, projectVersion);
        
        // Write to file
        const outputPath = path.resolve(__dirname, '..', 'SBOM.md');
        fs.writeFileSync(outputPath, sbom, 'UTF-8');
        
        console.log(`✅ SBOM generated successfully: ${outputPath}`);
        console.log(`\n📈 Summary:`);
        console.log(`   - Total dependencies: ${data.allDeps.size}`);
        console.log(`   - Production: ${Array.from(data.allDeps.values()).filter(d => d.type === 'production').length}`);
        console.log(`   - Development: ${Array.from(data.allDeps.values()).filter(d => d.type === 'development').length}`);
        console.log(`   - Projects: ${data.projectDeps.length}`);
        
    } catch (error) {
        console.error('❌ Error generating SBOM:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main, generateSBOM, collectDependencies };
