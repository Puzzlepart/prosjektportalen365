'use strict';
const fs = require('fs');
const path = require('path');
const find = require('find');
const gulp = require('gulp');
const build = require('@microsoft/sp-build-web');
const pkgDeploy = require('spfx-pkgdeploy').default;
const tsConfig = require('./tsconfig.json');
const WebpackBar = require('webpackbar');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const os = require('os');
const argv = require('yargs').argv;
const log = require('@microsoft/gulp-core-build').log;
const colors = require("colors");
let buildConfig = {
    parallel: os.cpus().length - 1,
    bundleAnalyzerEnabled: false
};
build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);
build.addSuppression(`Warning - [sass] The local CSS class '-webkit-filter' is not camelCase and will not be type-safe.`);

try {
    var env = require('./config/env.json');
    pkgDeploy(build, require('./config/package-solution.json'), env);
} catch (error) {
    log(`Skipping '${colors.cyan('pkgDeploy')}' due to missing ${colors.cyan('config/env.json')}...`);
}

try {
    buildConfig = require('./build.config.json');
} catch (error) {
    log(`Missing '${colors.cyan('./build.config.json')}'. Using defaults...`);
}

gulp.task('versionSync', () => {
    find.file(/\manifest.json$/, path.join(__dirname, "src", "webparts"), (files) => {
        var pkgSolution = require('./config/package-solution.json');
        var newVersionNumber = require('./package.json').version.split('-')[0];
        pkgSolution.solution.version = newVersionNumber + '.0';
        fs.writeFile('./config/package-solution.json', JSON.stringify(pkgSolution, null, 4), (_error) => { /* handle error */ });
        for (let i = 0; i < files.length; i++) {
            let manifest = require(files[i]);
            manifest.version = newVersionNumber;
            fs.writeFile(files[i], JSON.stringify(manifest, null, 4), (_error) => { /* handle error */ });
        }
    });
});

gulp.task('setHiddenToolbox', () => {
    find.file(/\manifest.json$/, path.join(__dirname, "src", "webparts"), (files) => {
        for (let i = 0; i < files.length; i++) {
            let manifest = require(files[i]);
            if (manifest.hiddenFromToolbox != !!argv.ship) {
                manifest.hiddenFromToolbox = !!argv.ship;
                fs.writeFile(files[i], JSON.stringify(manifest, null, 4), (_error) => { /* handle error */ });
            }
        }
    });
});

build.configureWebpack.mergeConfig({
    additionalConfiguration: (webpack) => {
        let { paths, outDir } = JSON.parse(JSON.stringify(tsConfig.compilerOptions).replace(/\/\*"/gm, '"'));
        webpack.resolve.alias = Object.keys(paths).reduce((alias, key) => {
            let _path = path.join(__dirname, outDir, paths[key][0]);
            log(`[${colors.cyan('configure-webpack')}] Added alias ${colors.cyan(key)} pointing to ${colors.cyan(_path)}...`);
            return { ...alias, [key]: _path };
        }, webpack.resolve.alias);
        webpack.externals = Object.assign(webpack.externals || {}, { 'XLSX': 'XLSX' });
        webpack.plugins = webpack.plugins || [];
        log(`[${colors.cyan('configure-webpack')}] Adding plugin ${colors.cyan('WebpackBar')}...`);
        webpack.plugins.push(new WebpackBar());
        if (buildConfig.bundleAnalyzerEnabled) {
            log(`[${colors.cyan('configure-webpack')}] Adding plugin ${colors.cyan('BundleAnalyzerPlugin')}...`);
            webpack.plugins.push(new BundleAnalyzerPlugin());
        }
        if (webpack.optimization) {
            log(`[${colors.cyan('configure-webpack')}] Setting ${colors.cyan('minimizer')} to run ${colors.cyan(buildConfig.parallel)} processes in parallel and enabling cache...`);
            webpack.optimization.minimizer[0].options.parallel = buildConfig.parallel;
            webpack.optimization.minimizer[0].options.cache = true;
        }
        return webpack;
    }
});

build.initialize(gulp);
