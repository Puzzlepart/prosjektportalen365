Execute in bash
-----------------------
npm un -D @types/chai @types/mocha
npm i -SE @microsoft/sp-core-library@1.12.1 @microsoft/sp-lodash-subset@1.12.1 @microsoft/sp-office-ui-fabric-core@1.12.1 @microsoft/sp-webpart-base@1.12.1 @microsoft/sp-dialog@1.12.1 @microsoft/sp-application-base@1.12.1 @microsoft/decorators@1.12.1 @microsoft/sp-listview-extensibility@1.12.1 @microsoft/sp-property-pane@1.12.1 @microsoft/sp-page-context@1.12.1 react@16.9.0 react-dom@16.9.0 office-ui-fabric-react@7.156.0
npm i -DE @microsoft/sp-build-web@1.12.1 @microsoft/sp-module-interfaces@1.12.1 @microsoft/sp-webpart-workbench@1.12.1 @microsoft/sp-tslint-rules@1.12.1 @microsoft/rush-stack-compiler-3.7@0.2.3 @types/react@16.9.36 @types/react-dom@16.9.8
npm dedupe
rm ".editorconfig"

./config/copy-assets.json
-------------------------
Update copy-assets.json deployCdnPath:
{
  "deployCdnPath": "./release/assets/"
}


./config/deploy-azure-storage.json
----------------------------------
Update deploy-azure-storage.json workingDir:
{
  "workingDir": "./release/assets/"
}


./.yo-rc.json
-------------
Update version in .yo-rc.json:
{
  "@microsoft/generator-sharepoint": {
    "version": "1.12.1"
  }
}


./.gitignore
------------
To .gitignore add the 'release' folder:
release


./tsconfig.json
---------------
Remove tsconfig.json exclude property:
{
  "exclude": []
}

Update tsconfig.json extends property:
{
  "extends": "./node_modules/@microsoft/rush-stack-compiler-3.7/includes/tsconfig-web.json"
}

Add es2015.promise lib in tsconfig.json:
{
  "compilerOptions": {
    "lib": [
      "es2015.promise"
    ]
  }
}

Remove es6-promise type in tsconfig.json:
{
  "compilerOptions": {
    "types": [
      "es6-promise"
    ]
  }
}


./gulpfile.js
-------------
Before 'build.initialize(require('gulp'));' add the serve task:
var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set('serve', result.get('serve-deprecated'));

  return result;
};



./package.json
--------------
Remove package.json property:
{
  "engines": "undefined"
}
