'use strict';
const fs = require('fs');
const path = require('path');
const find = require('find');
const gulp = require('gulp');
const build = require('@microsoft/sp-build-web');
const pkgDeploy = require('spfx-pkgdeploy').default;
const tsConfig = require('./tsconfig.json');
build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);
build.addSuppression(`Warning - [sass] The local CSS class '-webkit-filter' is not camelCase and will not be type-safe.`);

try {
    var env = require('./config/env.json');
    pkgDeploy(build, require('./config/package-solution.json'), env);
} catch (error) {
    build.log("Skipping pkgDeploy due to missing config/env.json");
}

gulp.task('version-sync', () => {
    find.file(/\.manifest.json$/, path.join(__dirname, "src", "extensions"), manifests => {
        var pkgSolution = require('./config/package-solution.json');
        var newVersionNumber = require('./package.json').version.split('-')[0];
        pkgSolution.solution.version = newVersionNumber + '.0';
        fs.writeFile('./config/package-solution.json', JSON.stringify(pkgSolution, null, 4), (_error) => { /* handle error */ });
        for (let i = 0; i < manifests.length; i++) {
            let manifestJson = require(manifests[i]);
            manifestJson.version = newVersionNumber;
            fs.writeFile(manifests[i], JSON.stringify(manifestJson, null, 4), (_error) => { /* handle error */ });
        }
    });
});

build.configureWebpack.mergeConfig({
    additionalConfiguration: (generatedConfiguration) => {
        let { paths, outDir } = JSON.parse(JSON.stringify(tsConfig.compilerOptions).replace(/\/\*"/gm, '"'));
        generatedConfiguration.resolve.alias = Object.keys(paths).reduce((alias, key) => {
            let _path = path.join(__dirname, outDir, paths[key][0]);
            return { ...alias, [key]: _path };
        }, generatedConfiguration.resolve.alias);
        return generatedConfiguration;
    }
});

build.initialize(gulp);
