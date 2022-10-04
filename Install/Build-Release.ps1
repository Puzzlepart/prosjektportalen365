[Diagnostics.CodeAnalysis.SuppressMessageAttribute("PSUseDeclaredVarsMoreThanAssignments", "")]
Param(
    [Parameter(Mandatory = $false, HelpMessage = "Skip building of SharePoint Framework solutions")]
    [switch]$SkipBuildSharePointFramework,
    [Parameter(Mandatory = $false, HelpMessage = "Clean node_modules for all SharePoint Framework solutions")]
    [switch]$Force,
    [Parameter(Mandatory = $false)]
    [string[]]$Solutions = @("PortfolioExtensions", "PortfolioWebParts", "ProgramWebParts", "ProjectExtensions", "ProjectWebParts"),
    [Parameter(Mandatory = $false, HelpMessage = "CI mode. Installs SharePointPnPPowerShellOnline.")]
    [switch]$CI
)  

$PACKAGE_FILE = Get-Content "$PSScriptRoot/../package.json" -Raw | ConvertFrom-Json

Write-Host "[Building release v$($PACKAGE_FILE.version)]" -ForegroundColor Cyan

#region Paths
$START_PATH                     = Get-Location
$ROOT_PATH                      = "$PSScriptRoot/.."
$SHAREPOINT_FRAMEWORK_BASEPATH  = "$ROOT_PATH/SharePointFramework"
$PNP_TEMPLATES_BASEPATH         = "$ROOT_PATH/Templates"
$SITE_SCRIPTS_BASEPATH          = "$ROOT_PATH/SiteScripts/Src"
$PNP_BUNDLE_PATH                = "$PSScriptRoot/SharePointPnPPowerShellOnline"
$GIT_HASH                       = git log --pretty=format:'%h' -n 1
$RELEASE_NAME                   = "$($PACKAGE_FILE.name)-$($PACKAGE_FILE.version).$($GIT_HASH)"
$RELEASE_PATH                   = "$ROOT_PATH/release/$($RELEASE_NAME)"
#endregion

if ($CI.IsPresent) {
    Write-Host "[Running in CI mode. Installing module SharePointPnPPowerShellOnline.]" -ForegroundColor Yellow
    Install-Module -Name SharePointPnPPowerShellOnline -Force -Scope CurrentUser
} else {
    Import-Module $PSScriptRoot\SharePointPnPPowerShellOnline\SharePointPnPPowerShellOnline.psd1 -DisableNameChecking
}

$sw = [Diagnostics.Stopwatch]::StartNew()


if ($CI.IsPresent) {
    $RELEASE_PATH = "$ROOT_PATH/release"
}

Write-Host "[INFO] Creating release folder $RELEASE_PATH...  " -NoNewline
$RELEASE_PATH  = (New-Item -Path "$RELEASE_PATH" -ItemType Directory -Force).FullName
$RELEASE_PATH_TEMPLATES     = (New-Item -Path "$RELEASE_PATH/Templates" -ItemType Directory -Force).FullName
$RELEASE_PATH_SITESCRIPTS   = (New-Item -Path "$RELEASE_PATH/SiteScripts" -ItemType Directory -Force).FullName
$RELEASE_PATH_SCRIPTS       = (New-Item -Path "$RELEASE_PATH/Scripts" -ItemType Directory -Force).FullName
$RELEASE_PATH_APPS          = (New-Item -Path "$RELEASE_PATH/Apps" -ItemType Directory -Force).FullName
Write-Host "DONE" -ForegroundColor Green

#region Copying source files
Write-Host "[INFO] Copying Install.ps1, PostInstall.ps1 and site script source files...  " -NoNewline
Copy-Item -Path "$SITE_SCRIPTS_BASEPATH/*.txt" -Filter *.txt -Destination $RELEASE_PATH_SITESCRIPTS -Force
Copy-Item -Path "$PSScriptRoot/Install.ps1" -Destination $RELEASE_PATH -Force
Copy-Item -Path "$PSScriptRoot/Scripts/*.ps1" -Destination $RELEASE_PATH_SCRIPTS -Force
Copy-Item -Path "$PSScriptRoot/SearchConfiguration.xml" -Destination $RELEASE_PATH -Force
Write-Host "DONE" -ForegroundColor Green

Write-Host "[INFO] Copying SharePointPnPPowerShellOnline bundle...  " -NoNewline
Copy-Item -Path $PNP_BUNDLE_PATH -Filter * -Destination $RELEASE_PATH -Force -Recurse
Write-Host "DONE" -ForegroundColor Green

Write-Host "[INFO] Replacing VERSION_PLACEHOLDER...  " -NoNewline
(Get-Content "$RELEASE_PATH/Install.ps1") -Replace 'VERSION_PLACEHOLDER', "$($PACKAGE_FILE.version).$($GIT_HASH)" | Set-Content "$RELEASE_PATH/Install.ps1"
Write-Host "DONE" -ForegroundColor Green
#endregion

#region Clean node_modules for all SharePoint Framework solutions
if ($Force.IsPresent) {
    $Solutions | ForEach-Object {
        Write-Host "[INFO] Clearing node_modules for SPFx solution [$_]...  " -NoNewline
        rimraf "$SHAREPOINT_FRAMEWORK_BASEPATH\$_\node_modules\"
        Write-Host "DONE" -ForegroundColor Green
    }
}
#endregion

#region Package SharePoint Framework solutions
if (-not $SkipBuildSharePointFramework.IsPresent) {
    Write-Host "[INFO] Building SharePointFramework\@Shared...  " -NoNewline
    Set-Location "$SHAREPOINT_FRAMEWORK_BASEPATH\@Shared"
    npm install --no-progress --silent --no-audit --no-fund
    npm run build   
    Write-Host "DONE" -ForegroundColor Green
}

$Solutions | ForEach-Object {
    Set-Location "$SHAREPOINT_FRAMEWORK_BASEPATH\$_"
    $Version = (Get-Content "./config/package-solution.json" -Raw | ConvertFrom-Json).solution.version
    Write-Host "[INFO] Packaging SPFx solution [$_] v$Version...  " -NoNewline
    if (-not $SkipBuildSharePointFramework.IsPresent) {  
        npm install --no-progress --silent --no-audit --no-fund
        npm run package
    }
    Get-ChildItem "./sharepoint/solution/" *.sppkg -Recurse -ErrorAction SilentlyContinue | Where-Object { -not ($_.PSIsContainer -or (Test-Path "$RELEASE_PATH/Apps/$_")) } | Copy-Item -Destination $RELEASE_PATH_APPS -Force
    Write-Host "DONE" -ForegroundColor Green
}
#endregion


#region Build PnP templates
Set-Location $PSScriptRoot
Write-Host "[INFO] Building [Portfolio] PnP template...  " -NoNewline
Convert-PnPFolderToProvisioningTemplate -Out "$RELEASE_PATH_TEMPLATES/Portfolio.pnp" -Folder "$PNP_TEMPLATES_BASEPATH/Portfolio" -Force
Write-Host "DONE" -ForegroundColor Green

Write-Host "[INFO] Building PnP content templates...  " -NoNewline
Set-Location $PNP_TEMPLATES_BASEPATH

npm install --no-progress --silent --no-audit --no-fund
npm run generateJsonTemplates

Get-ChildItem "./Content" -Directory -Filter "*no-NB*" | ForEach-Object {
    Convert-PnPFolderToProvisioningTemplate -Out "$RELEASE_PATH_TEMPLATES/$($_.BaseName).pnp" -Folder $_.FullName -Force
}
Write-Host "DONE" -ForegroundColor Green

Write-Host "[INFO] Building PnP upgrade templates...  " -NoNewline
Set-Location $PNP_TEMPLATES_BASEPATH

Get-ChildItem "./Upgrade" -Directory | ForEach-Object {
    Convert-PnPFolderToProvisioningTemplate -Out "$RELEASE_PATH_TEMPLATES/$($_.BaseName).pnp" -Folder $_.FullName -Force
}
Write-Host "DONE" -ForegroundColor Green

Set-Location $PSScriptRoot

Write-Host "[INFO] Building [Taxonomy] PnP template....  " -NoNewline
Convert-PnPFolderToProvisioningTemplate -Out "$RELEASE_PATH_TEMPLATES/Taxonomy.pnp" -Folder "$PNP_TEMPLATES_BASEPATH/Taxonomy" -Force
Write-Host "DONE" -ForegroundColor Green

#endregion

$sw.Stop()

if (-not $CI.IsPresent) {
    Add-Type -Assembly "System.IO.Compression.FileSystem"
    [IO.Compression.ZipFile]::CreateFromDirectory($RELEASE_PATH, "$($RELEASE_PATH).zip")  
    Write-Host "Done building release [v$($PACKAGE_FILE.version)] in [$($sw.Elapsed)]" -ForegroundColor Cyan
    Set-Location $START_PATH
}
