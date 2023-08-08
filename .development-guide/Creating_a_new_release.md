## Creating a new release

For creating a new release, we have two options: Minor and patch. New minor version should be created when there is new functionality of interest to users, while patch versions can be created often with bug fixes, adjustments and minimal functional improvements.

Increasing the version number is done by npm scripts. This is done on the dev-branch when the functionality currently in dev is deemed ready for release.


### Patch-release
```powershell
npm version patch
git push --tags
```

### Minor-release
```powershell
npm version minor
git push --tags
```

Then create a Pull Request to merge `dev` into `main`. The output from GitHub Actions will include a release package that can be shared as a release on GitHub. No manual build required.
