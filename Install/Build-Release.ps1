<#
.SYNOPSIS
Builds a release package for Prosjektportalen 365

.DESCRIPTION
Builds a release package for Prosjektportalen 365. The release package contains all files needed to install Prosjektportalen 365 in a tenant.
#>
[Diagnostics.CodeAnalysis.SuppressMessageAttribute("PSUseDeclaredVarsMoreThanAssignments", "")]
Param(
    [Parameter(Mandatory = $false, HelpMessage = "Skip building of SharePoint Framework solutions")]
    [switch]$SkipBuildSharePointFramework,
    [Parameter(Mandatory = $false, HelpMessage = "Clean node_modules for all SharePoint Framework solutions")]
    [switch]$Force,
    [Parameter(Mandatory = $false)]
    [string[]]$Solutions = @("shared-library", "PortfolioExtensions", "PortfolioWebParts", "ProgramWebParts", "ProjectExtensions", "ProjectWebParts"),
    [Parameter(Mandatory = $false, HelpMessage = "CI mode. Installs PnP.PowerShell.")]
    [switch]$CI,
    [Parameter(Mandatory = $false)]
    [switch]$SkipBundle,
    [Parameter(Mandatory = $false)]
    [ValidateSet("test")]
    [string]$Channel,
    [Parameter(Mandatory = $false, HelpMessage = "Skip import of PnP.PowerShell module")]
    [switch]$SkipImportModule
)  

#region Variables and functions
$USE_CHANNEL_CONFIG = -not ([string]::IsNullOrEmpty($Channel))
$CHANNEL_CONFIG_NAME = "main"

$global:ACTIONS_COUNT = $USE_CHANNEL_CONFIG ? 14 : 13
$global:ACTION_INDEX = 1

<#
Starts an action and writes the action name to the console. Make sure to update the $global:ACTIONS_COUNT before
adding a new action. Uses -NoNewline to avoid a line break before the elapsed time is written.
#>
function StartAction($Action) {
    $global:StopWatch_Action = [Diagnostics.Stopwatch]::StartNew()
    Write-Host "[$($global:ACTION_INDEX)/$($global:ACTIONS_COUNT)] $Action... " -NoNewline
    $global:ACTION_INDEX++
}

<#
Ends an action and writes the elapsed time to the console.
#>
function EndAction() {
    $global:StopWatch_Action.Stop()
    $ElapsedSeconds = [math]::Round(($global:StopWatch_Action.ElapsedMilliseconds) / 1000, 2)
    Write-Host "Completed in $($ElapsedSeconds)s" -ForegroundColor Green
}

<#
Checks if parameter $CHANNEL_CONFIG_PATH is set and if so, loads the channel config,
stores it as JSON in the root of the project and sets the $CHANNEL_CONFIG variable
#>
if ($USE_CHANNEL_CONFIG) {
    StartAction("Preparing channel configuration for channel $Channel")
    $CHANNEL_CONFIG_PATH = "$PSScriptRoot/../channels/$Channel.json"
    if (-not (Test-Path $CHANNEL_CONFIG_PATH)) {
        Write-Host "Channel config file not found at $CHANNEL_CONFIG_PATH. Aborting build of release." -ForegroundColor Red
        exit 1
    }
    $CHANNEL_CONFIG_SCHEMA = Get-Content "$PSScriptRoot/../channels/`$schema.json" -Raw
    $CHANNEL_CONFIG_JSON = Get-Content $CHANNEL_CONFIG_PATH -Raw 
    $VALID_CONFIG_JSON = Test-Json -Json $CHANNEL_CONFIG_JSON -Schema $CHANNEL_CONFIG_SCHEMA -ErrorAction SilentlyContinue
    if (-not $VALID_CONFIG_JSON) {
        Write-Host "Channel configuration is not valid (the JSON does not match the schema). Aborting build of release." -ForegroundColor Red
        exit 1
    }
    $CHANNEL_CONFIG = $CHANNEL_CONFIG_JSON | ConvertFrom-Json
    $CHANNEL_CONFIG_NAME = $CHANNEL_CONFIG.name
    $CHANNEL_CONFIG_JSON | Out-File -Path "$PSScriptRoot/../.current-channel-config.json" -Encoding UTF8 -Force
    EndAction
}

$NPM_PACKAGE_FILE = Get-Content "$PSScriptRoot/../package.json" -Raw | ConvertFrom-Json

$StopWatch = [Diagnostics.Stopwatch]::StartNew()
$global:StopWatch_Action = $null
#endregion

#region Paths
$START_PATH = Get-Location
$ROOT_PATH = "$PSScriptRoot/.."
$SHAREPOINT_FRAMEWORK_BASEPATH = "$ROOT_PATH/SharePointFramework"
$PNP_TEMPLATES_BASEPATH = "$ROOT_PATH/Templates"
$SITE_SCRIPTS_BASEPATH = "$ROOT_PATH/SiteScripts/Src"
$PNP_BUNDLE_PATH = "$PSScriptRoot/PnP.PowerShell"
$GIT_HASH = git log --pretty=format:'%h' -n 1
$RELEASE_NAME = "$($NPM_PACKAGE_FILE.name)-$($NPM_PACKAGE_FILE.version).$($GIT_HASH)"
if ($USE_CHANNEL_CONFIG) {
    $RELEASE_NAME = "$($RELEASE_NAME)-$($CHANNEL_CONFIG_NAME)"
}
$RELEASE_PATH = "$ROOT_PATH/release/$($RELEASE_NAME)"
#endregion

#region Pre-build
if ($null -ne $CHANNEL_CONFIG) {
    Write-Host "[Building release $RELEASE_NAME for channel $($CHANNEL_CONFIG_NAME)]" -ForegroundColor Cyan
    Write-Host "IMPORTANT: Make sure to delete the .current-channel-config.json file if you abort the build process" -ForegroundColor Yellow
}
else {
    Write-Host "[Building release $RELEASE_NAME]" -ForegroundColor Cyan
}


if ($CI.IsPresent) {
    Write-Host "[Running in CI mode]" -ForegroundColor Yellow
    StartAction("Updating npm packages using rush")
    npm ci >$null
    npm i @microsoft/rush
    rush update >$null 2>&1
    npm run generate-channel-replace-map >$null 2>&1
    EndAction
}
else {
    StartAction("Updating npm packages using rush")
    rush update >$null 2>&1
    npm run generate-channel-replace-map >$null 2>&1
    EndAction
}

if ($CI.IsPresent) {
    StartAction("Installing module PnP.PowerShell")
    Install-Module -Name PnP.PowerShell -Force -Scope CurrentUser
    EndAction
}
else {
    if(-not $SkipImportModule.IsPresent) {
        Import-Module $PNP_BUNDLE_PATH/PnP.PowerShell.psd1 -DisableNameChecking -ErrorAction SilentlyContinue
    }
}

if ($CI.IsPresent) {
    $RELEASE_PATH = "$ROOT_PATH/release"
}
#endregion

#region Creating release folder
$RELEASE_FOLDER = New-Item -Path "$RELEASE_PATH" -ItemType Directory -Force
$RELEASE_PATH = $RELEASE_FOLDER.FullName
StartAction("Creating release folder release/$($RELEASE_FOLDER.BaseName)")
$RELEASE_PATH_TEMPLATES = (New-Item -Path "$RELEASE_PATH/Templates" -ItemType Directory -Force).FullName
$PNP_TEMPLATES_DIST_BASEPATH = "$ROOT_PATH/.dist/Templates"
$RELEASE_PATH_SITESCRIPTS = (New-Item -Path "$RELEASE_PATH/SiteScripts" -ItemType Directory -Force).FullName
$RELEASE_PATH_SCRIPTS = (New-Item -Path "$RELEASE_PATH/Scripts" -ItemType Directory -Force).FullName
$RELEASE_PATH_APPS = (New-Item -Path "$RELEASE_PATH/Apps" -ItemType Directory -Force).FullName
EndAction
#endregion  

#region Copying source files
StartAction("Copying Install.ps1, PostInstall.ps1 and site script source files")
if ($USE_CHANNEL_CONFIG) {
    npm run generate-site-scripts >$null 2>&1
    $SITE_SCRIPTS_BASEPATH = "$ROOT_PATH/.dist/SiteScripts"
    Copy-Item -Path "$SITE_SCRIPTS_BASEPATH/*.txt" -Filter *.txt -Destination $RELEASE_PATH_SITESCRIPTS -Force
}
else {
    Copy-Item -Path "$SITE_SCRIPTS_BASEPATH/*.txt" -Filter *.txt -Destination $RELEASE_PATH_SITESCRIPTS -Force
}
Copy-Item -Path "$PSScriptRoot/Install.ps1" -Destination $RELEASE_PATH -Force
Copy-Item -Path "$PSScriptRoot/Scripts/*" -Recurse -Destination $RELEASE_PATH_SCRIPTS -Force
Copy-Item -Path "$PSScriptRoot/SearchConfiguration.xml" -Destination $RELEASE_PATH -Force
EndAction

if (-not $SkipBundle.IsPresent) {
    StartAction("Copying PnP.PowerShell bundle")
    Copy-Item -Path $PNP_BUNDLE_PATH -Filter * -Destination $RELEASE_PATH -Force -Recurse
    EndAction
}

(Get-Content "$RELEASE_PATH/Install.ps1") -Replace '{VERSION_PLACEHOLDER}', "$($NPM_PACKAGE_FILE.version).$($GIT_HASH)" -Replace "{CHANNEL_PLACEHOLDER}", $CHANNEL_CONFIG_NAME | Set-Content "$RELEASE_PATH/Install.ps1"
#endregion

#region Clean node_modules for all SharePoint Framework solutions
if ($Force.IsPresent) {
    $Solutions | ForEach-Object {
        StartAction("Clearing node_modules for SPFx solution [$_]")
        rimraf "$SHAREPOINT_FRAMEWORK_BASEPATH/$_/node_modules/"
        EndAction
    }
}
#endregion

#region Package SharePoint Framework solutions
if (-not $SkipBuildSharePointFramework.IsPresent) {
    StartAction("Packaging SPFx solutions")
    if ($USE_CHANNEL_CONFIG) {
        foreach ($Solution in $Solutions) {
            Set-Location "$SHAREPOINT_FRAMEWORK_BASEPATH/$Solution"
            $SOLUTION_CONFIG = $CHANNEL_CONFIG.spfx.solutions.($Solution)
            $SOLUTION_CONFIG_JSON = ($SOLUTION_CONFIG | ConvertTo-Json)
            $SOLUTION_CONFIG_JSON | Out-File -FilePath "./config/.generated-solution-config.json" -Encoding UTF8 -Force
            node ../.tasks/modifySolutionFiles.js --force >$null 2>&1
        }
    }
    Set-Location $SHAREPOINT_FRAMEWORK_BASEPATH
    rush build >$null 2>&1
    Get-ChildItem "*/sharepoint/solution/" *.sppkg -Recurse -ErrorAction SilentlyContinue | Where-Object { -not ($_.PSIsContainer -or (Test-Path "$RELEASE_PATH/Apps/$_")) } | Copy-Item -Destination $RELEASE_PATH_APPS -Force
    if ($USE_CHANNEL_CONFIG) {
        foreach ($Solution in $Solutions) {
            Set-Location "$SHAREPOINT_FRAMEWORK_BASEPATH/$Solution"
            node ../.tasks/modifySolutionFiles.js --revert --force >$null 2>&1 
        }
    }
    EndAction
}
#endregion

#region Build PnP templates
Set-Location $PSScriptRoot
StartAction("Building Portfolio PnP template")
if ($USE_CHANNEL_CONFIG) {
    npm run generate-pnp-templates >$null 2>&1
    Convert-PnPFolderToSiteTemplate -Out "$RELEASE_PATH_TEMPLATES/Portfolio.pnp" -Folder "$PNP_TEMPLATES_DIST_BASEPATH/Portfolio" -Force
}
else {
    Convert-PnPFolderToSiteTemplate -Out "$RELEASE_PATH_TEMPLATES/Portfolio.pnp" -Folder "$PNP_TEMPLATES_BASEPATH/Portfolio" -Force
}
EndAction

StartAction("Building PnP content templates")
Set-Location $PNP_TEMPLATES_BASEPATH

if ($CI.IsPresent) {  
    npm ci --silent --no-audit --no-fund >$null 2>&1
}
else {
    npm install --no-progress --silent --no-audit --no-fund  >$null 2>&1
}

npm run generate-project-templates >$null 2>&1

Get-ChildItem "./Content" -Directory -Filter "*no-NB*" | ForEach-Object {
    Convert-PnPFolderToSiteTemplate -Out "$RELEASE_PATH_TEMPLATES/$($_.BaseName).pnp" -Folder $_.FullName -Force
}
EndAction

StartAction("Building PnP upgrade templates")
Set-Location $PNP_TEMPLATES_BASEPATH

Get-ChildItem "./Upgrade" -Directory | ForEach-Object {
    Convert-PnPFolderToSiteTemplate -Out "$RELEASE_PATH_TEMPLATES/$($_.BaseName).pnp" -Folder $_.FullName -Force
}
EndAction

Set-Location $PSScriptRoot

StartAction("Building Taxonomy PnP template")
Convert-PnPFolderToSiteTemplate -Out "$RELEASE_PATH_TEMPLATES/Taxonomy.pnp" -Folder "$PNP_TEMPLATES_BASEPATH/Taxonomy" -Force
EndAction

StartAction("Building Taxonomy BA PnP template")
Convert-PnPFolderToSiteTemplate -Out "$RELEASE_PATH_TEMPLATES/TaxonomyBA.pnp" -Folder "$PNP_TEMPLATES_BASEPATH/TaxonomyBA" -Force
EndAction

#endregion

#region Compressing release to a zip file
if (-not $CI.IsPresent) {
    rimraf "$($RELEASE_PATH).zip"
    Add-Type -Assembly "System.IO.Compression.FileSystem"
    [IO.Compression.ZipFile]::CreateFromDirectory($RELEASE_PATH, "$($RELEASE_PATH).zip")  
    $StopWatch.Stop()
    Write-Host "Done building release $RELEASE_NAME in $($StopWatch.ElapsedMilliseconds/1000)s" -ForegroundColor Green
    Set-Location $START_PATH
}
else {
    $StopWatch.Stop()
    Write-Host "Done building release $RELEASE_NAME in $($StopWatch.ElapsedMilliseconds/1000)s" -ForegroundColor Green
}

if ($USE_CHANNEL_CONFIG) {
    Remove-Item -Path "$PSScriptRoot/../.current-channel-config.json" -Force -ErrorAction SilentlyContinue
}
#endregion
