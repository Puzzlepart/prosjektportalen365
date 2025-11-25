## ➤ SBOM Generation

### What is SBOM?

SBOM (Software Bill of Materials) is a comprehensive list of all software components, libraries, and dependencies used in Prosjektportalen 365. It provides transparency about what open source and third-party components are included in the project, which is important for:

- **Security**: Identifying vulnerable dependencies
- **Compliance**: Meeting regulatory requirements
- **License Management**: Understanding license obligations
- **Transparency**: Providing stakeholders with insight into the project's components

### Automatic Generation

The SBOM is automatically generated when:

1. **Version Updates**: When you run `npm version patch` or `npm version minor`, the `postversion` hook automatically regenerates the SBOM
2. **GitHub Releases**: When a version tag (e.g., `v1.12.0`) is pushed to GitHub, the workflow automatically generates and commits the updated SBOM
3. **Manual Trigger**: The GitHub workflow can be manually triggered from the Actions tab

### Manual Generation

To manually generate the SBOM at any time:

```bash
npm run generate-sbom
```

This will:
- Scan all `package.json` files in the monorepo
- Collect all dependencies (both production and development)
- Generate a comprehensive SBOM.md file at the root of the repository
- Include metadata such as versions and which projects use each dependency

### SBOM Content

The generated SBOM includes:

- **Project Overview**: Total number of dependencies and projects
- **Projects in Monorepo**: List of all packages with their dependency counts
- **All Dependencies**: Consolidated list of all unique dependencies
  - Production dependencies
  - Development dependencies
  - Version information
  - Usage information (which projects use each dependency)
- **Detailed Breakdown**: Project-specific dependency lists
- **Documentation**: How to update the SBOM and compliance information

### File Location

The SBOM is generated as `SBOM.md` in the root of the repository and is committed to version control.

### GitHub Workflow

The SBOM generation workflow (`.github/workflows/generate-sbom.yml`) runs automatically when version tags are pushed. It can also be manually triggered through GitHub Actions.

The workflow:
1. Installs dependencies
2. Generates the SBOM
3. Commits the updated SBOM if it has changed
4. Uploads the SBOM as a build artifact

### Script Details

The SBOM generation script is located at `.tasks/generate-sbom.js` and follows these best practices:

- **CycloneDX-inspired format**: Based on industry standards
- **Complete coverage**: Includes all projects in the Rush monorepo
- **Readable format**: Generated as Markdown for easy viewing
- **Metadata-rich**: Includes version numbers and dependency relationships
- **Automated**: Integrates with existing build and versioning processes

### Updating Dependencies

When updating dependencies:

1. Update the relevant `package.json` file(s)
2. Run `npm install` or `rush update`
3. Run `npm run generate-sbom` to update the SBOM
4. Commit both the package.json changes and the updated SBOM.md

Note: The SBOM will be automatically regenerated during version updates, but it's good practice to update it when making significant dependency changes.

### Security Considerations

The SBOM can be used with security scanning tools to:
- Identify known vulnerabilities in dependencies
- Check for outdated packages
- Verify license compliance
- Monitor for security advisories

Recommended tools:
- `npm audit` - Built-in npm security scanner
- GitHub Dependabot - Automatic security updates
- Snyk - Continuous security monitoring
- OWASP Dependency-Check - Vulnerability detection
