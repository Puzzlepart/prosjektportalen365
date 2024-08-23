# SPFx tasks

One shared place for node tasks used by our SPFx solutions.

## createEnviromentFile.js

Creates a `.env` file in the current folder (`process.cwd()`). This is ran as a part of the `pre-watch.js` task.

## createServeConfig.js

Creates a `config/serve.json` file from the template `config/serve.sample.json` for the current folder.

## modifySolutionFiles.js

Modify `config/package-solution.json` and all `manifest.json` files for a solution to match IDs from the selected channel.

## post-watch.js

Runs `modifySolutionFiles.js` and `setBundleConfig.js`.

## pre-watch.js

Runs `createEnviromentFile.js` and `modifySolutionFiles.js`. Also generates a `config/.generated-solution-config.json` if the channel environment variable `SERVE_CHANNEL` is set and not **main**.

## setBundleConfig.js

Updates `config/config.json` for the solution based on the environment variable `SERVE_BUNDLE_REGEX`.
