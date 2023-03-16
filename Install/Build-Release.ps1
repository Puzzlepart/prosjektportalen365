[Diagnostics.CodeAnalysis.SuppressMessageAttribute("PSUseDeclaredVarsMoreThanAssignments", "")]
Param(
    [Parameter(Mandatory = $false, HelpMessage = "Skip building of SharePoint Framework solutions")]
    [switch]$SkipBuildSharePointFramework,
    [Parameter(Mandatory = $false, HelpMessage = "Clean node_modules for all SharePoint Framework solutions")]
    [switch]$Force,
    [Parameter(Mandatory = $false)]
    [string[]]$Solutions = @("PortfolioExtensions", "PortfolioWebParts", "ProgramWebParts", "ProjectExtensions", "ProjectWebParts"),
    [Parameter(Mandatory = $false, HelpMessage = "CI mode. Installs PnP.PowerShell.")]
    [switch]$CI,
    [Parameter(Mandatory = $false)]
    [switch]$SkipBundle,
    [Parameter(Mandatory = $false)]
    [string]$ChannelConfigPath
)  

<#
Checks if parameter $ChannelConfigPath is set and if so, loads the channel config,
stores it as JSON in the root of the project and sets the $CHANNEL_CONFIG variable
#>
if ($ChannelConfigPath) {
    $CHANNEL_CONFIG_JSON = Get-Content $ChannelConfigPath -Raw 
    $CHANNEL_CONFIG = $CHANNEL_CONFIG_JSON | ConvertFrom-Json
    $CHANNEL_CONFIG_JSON | Out-File -FilePath "$PSScriptRoot/../.current-channel-config.json" -Encoding UTF8 -Force
}

$PACKAGE_FILE = Get-Content "$PSScriptRoot/../package.json" -Raw | ConvertFrom-Json

$sw = [Diagnostics.Stopwatch]::StartNew()
$global:sw_action = $null

function StartAction($Action) {
    $global:sw_action = [Diagnostics.Stopwatch]::StartNew()
    Write-Host "[INFO] $Action...  " -NoNewline
}

function EndAction() {
    $global:sw_action.Stop()
    $ElapsedSeconds = [math]::Round(($global:sw_action.ElapsedMilliseconds) / 1000, 2)
    Write-Host "Completed in $($ElapsedSeconds)s" -ForegroundColor Green
}


#region Paths
$START_PATH = Get-Location
$ROOT_PATH = "$PSScriptRoot/.."
$SHAREPOINT_FRAMEWORK_BASEPATH = "$ROOT_PATH/SharePointFramework"
$PNP_TEMPLATES_BASEPATH = "$ROOT_PATH/Templates"
$SITE_SCRIPTS_BASEPATH = "$ROOT_PATH/SiteScripts/Src"
$PNP_BUNDLE_PATH = "$PSScriptRoot/PnP.PowerShell"
$GIT_HASH = git log --pretty=format:'%h' -n 1
$RELEASE_NAME = "$($PACKAGE_FILE.name)-$($PACKAGE_FILE.version).$($GIT_HASH)"
$RELEASE_PATH = "$ROOT_PATH/release/$($RELEASE_NAME)"
#endregion

if ($null -ne $CHANNEL_CONFIG) {
    Write-Host "[Building release $RELEASE_NAME for channel $($CHANNEL_CONFIG.name)]" -ForegroundColor Yellow
}
else {
    Write-Host "[Building release $RELEASE_NAME]" -ForegroundColor Yellow
}


if ($CI.IsPresent) {
    Write-Host "[Running in CI mode]" -ForegroundColor Yellow
}

if ($CI.IsPresent) {
    StartAction("Installing module PnP.PowerShell")
    Install-Module -Name PnP.PowerShell -Force -Scope CurrentUser
    EndAction
}
else {
    Import-Module $PNP_BUNDLE_PATH\PnP.PowerShell.psd1 -DisableNameChecking
}

if ($CI.IsPresent) {
    $RELEASE_PATH = "$ROOT_PATH/release"
}

$RELEASE_FOLDER = New-Item -Path "$RELEASE_PATH" -ItemType Directory -Force
$RELEASE_PATH = $RELEASE_FOLDER.FullName
StartAction("Creating release folder release/$($RELEASE_FOLDER.BaseName)")
$RELEASE_PATH_TEMPLATES = (New-Item -Path "$RELEASE_PATH/Templates" -ItemType Directory -Force).FullName
$RELEASE_PATH_SITESCRIPTS = (New-Item -Path "$RELEASE_PATH/SiteScripts" -ItemType Directory -Force).FullName
$RELEASE_PATH_SCRIPTS = (New-Item -Path "$RELEASE_PATH/Scripts" -ItemType Directory -Force).FullName
$RELEASE_PATH_APPS = (New-Item -Path "$RELEASE_PATH/Apps" -ItemType Directory -Force).FullName
EndAction

#region Copying source files
StartAction("Copying Install.ps1, PostInstall.ps1 and site script source files")
Copy-Item -Path "$SITE_SCRIPTS_BASEPATH/*.txt" -Filter *.txt -Destination $RELEASE_PATH_SITESCRIPTS -Force
Copy-Item -Path "$PSScriptRoot/Install.ps1" -Destination $RELEASE_PATH -Force
Copy-Item -Path "$PSScriptRoot/Scripts/*" -Recurse -Destination $RELEASE_PATH_SCRIPTS -Force
Copy-Item -Path "$PSScriptRoot/SearchConfiguration.xml" -Destination $RELEASE_PATH -Force
EndAction

if (-not $SkipBundle.IsPresent) {
    StartAction("Copying PnP.PowerShell bundle")
    Copy-Item -Path $PNP_BUNDLE_PATH -Filter * -Destination $RELEASE_PATH -Force -Recurse
    EndAction
}

(Get-Content "$RELEASE_PATH/Install.ps1") -Replace '{VERSION_PLACEHOLDER}', "$($PACKAGE_FILE.version).$($GIT_HASH)" | Set-Content "$RELEASE_PATH/Install.ps1"
#endregion

#region Clean node_modules for all SharePoint Framework solutions
if ($Force.IsPresent) {
    $Solutions | ForEach-Object {
        StartAction("Clearing node_modules for SPFx solution [$_]")
        rimraf "$SHAREPOINT_FRAMEWORK_BASEPATH\$_\node_modules\"
        EndAction
    }
}
#endregion

#region Package SharePoint Framework solutions
if (-not $SkipBuildSharePointFramework.IsPresent) {
    StartAction("Building SharePointFramework\@Shared")
    Set-Location "$SHAREPOINT_FRAMEWORK_BASEPATH\@Shared"
    if ($CI.IsPresent) {  
        npm ci --silent --no-audit --no-fund >$null 2>&1
    }
    else {
        npm install --no-progress --silent --no-audit --no-fund
    }
    npm run build
    EndAction
}

if (-not $SkipBuildSharePointFramework.IsPresent) {
    $Solutions | ForEach-Object {
        Set-Location "$SHAREPOINT_FRAMEWORK_BASEPATH\$_"
        $Version = (Get-Content "./config/package-solution.json" -Raw | ConvertFrom-Json).solution.version
        StartAction("Packaging SPFx solution $_")
        if ($CI.IsPresent) {  
            npm ci --silent --no-audit --no-fund >$null 2>&1
        }
        else {
            npm install --no-progress --silent --no-audit --no-fund
        }
        $SOLUTION_CONFIG = $CHANNEL_CONFIG.spfx.solutions.($_)
        $SOLUTION_CONFIG_JSON = ($SOLUTION_CONFIG | ConvertTo-Json)
        $SOLUTION_CONFIG_JSON | Out-File -FilePath "./config/generated-solution-config.json" -Encoding UTF8 -Force
        node ./.tasks/generate-package-solution.js
        npm run package
        node ./.tasks/generate-package-solution.js --revert
        Get-ChildItem "./sharepoint/solution/" *.sppkg -Recurse -ErrorAction SilentlyContinue | Where-Object { -not ($_.PSIsContainer -or (Test-Path "$RELEASE_PATH/Apps/$_")) } | Copy-Item -Destination $RELEASE_PATH_APPS -Force
        EndAction
    }
}
#endregion


#region Build PnP templates
Set-Location $PSScriptRoot
node ./tasks/generate-pnp-templates.js
StartAction("Building Portfolio PnP template")
Convert-PnPFolderToSiteTemplate -Out "$RELEASE_PATH_TEMPLATES/Portfolio.pnp" -Folder "$PNP_TEMPLATES_BASEPATH/Portfolio" -Force
EndAction

StartAction("Building PnP content templates")
Set-Location $PNP_TEMPLATES_BASEPATH

if ($CI.IsPresent) {  
    npm ci --silent --no-audit --no-fund >$null 2>&1
}
else {
    npm install --no-progress --silent --no-audit --no-fund
}
npm run generateJsonTemplates

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


if (-not $CI.IsPresent) {
    rimraf "$($RELEASE_PATH).zip"l
    Add-Type -Assembly "System.IO.Compression.FileSystem"
    [IO.Compression.ZipFile]::CreateFromDirectory($RELEASE_PATH, "$($RELEASE_PATH).zip")  
    $sw.Stop()
    Write-Host "Done building release $RELEASE_NAME in $($sw.ElapsedMilliseconds/1000)s" -ForegroundColor Green
    Set-Location $START_PATH
}
else {
    $sw.Stop()
    Write-Host "Done building release $RELEASE_NAME in $($sw.ElapsedMilliseconds/1000)s" -ForegroundColor Green
}
