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
    [Parameter(Mandatory = $false, HelpMessage = "Skip building of PnP templates")]
    [switch]$SkipBuildPnPTemplates,
    [Parameter(Mandatory = $false, HelpMessage = "Clean node_modules for all SharePoint Framework solutions")]
    [switch]$Force,
    [Parameter(Mandatory = $false)]
    [string[]]$Solutions = @("shared-library", "PortfolioExtensions", "PortfolioWebParts", "ProgramWebParts", "ProjectExtensions", "ProjectWebParts"),
    [Parameter(Mandatory = $false, HelpMessage = "CI mode. Installs PnP.PowerShell.")]
    [switch]$CI,
    [Parameter(Mandatory = $false)]
    [switch]$SkipBundle,
    [Parameter(Mandatory = $false)]
    [ValidateSet("test", "kurs", "i18n")]
    [string]$Channel,
    [Parameter(Mandatory = $false, HelpMessage = "Skip import of PnP.PowerShell module")]
    [switch]$SkipImportModule
)  

#region Normalize selected solutions
# Canonical SPFx solution folder names. The -Solutions parameter (and the
# [apps-only:<names>] CI commit tag) is matched case- and dash-insensitively
# against these, so 'SharedLibrary'/'sharedlibrary' resolves to 'shared-library',
# 'portfolioextensions' to 'PortfolioExtensions', and so on.
$ALL_SOLUTIONS = @("shared-library", "PortfolioExtensions", "PortfolioWebParts", "ProgramWebParts", "ProjectExtensions", "ProjectWebParts")
$Solutions = @($Solutions | ForEach-Object {
        $Name = $_.Trim()
        $Match = $ALL_SOLUTIONS | Where-Object { ($_ -replace '-', '') -ieq ($Name -replace '-', '') }
        if ($Match) { $Match } else { Write-Host "[WARNING] Unknown solution '$Name' - skipping" -ForegroundColor Yellow }
    })
if ($Solutions.Count -eq 0) {
    Write-Host "[ERROR] No valid solutions selected. Aborting build of release." -ForegroundColor Red
    exit 1
}
#endregion

#region Variables and functions
$USE_CHANNEL_CONFIG = -not ([string]::IsNullOrEmpty($Channel))
$CHANNEL_CONFIG_NAME = "main"

$global:ACTIONS_COUNT = $USE_CHANNEL_CONFIG ? 14 : 13
$global:ACTION_INDEX = 1

<#
If running in CI mode, set the number of actions to 11. This is used to display the progress of the script.
#>
if ($CI.IsPresent) {
    $global:ACTIONS_COUNT = 11
}

<#
Starts an action and writes the action name to the console. Make sure to update the $global:ACTIONS_COUNT before
adding a new action. Uses -NoNewline to avoid a line break before the elapsed time is written.
#>
function StartAction($Action) {
    $global:ACTION_SW = [Diagnostics.Stopwatch]::StartNew()
    Write-Host "[$($global:ACTION_INDEX)/$($global:ACTIONS_COUNT)] $Action... " -NoNewline
    $global:ACTION_INDEX++
}

<#
Ends an action and writes the elapsed time to the console.
#>
function EndAction() {
    $global:ACTION_SW.Stop()
    $ElapsedSeconds = [math]::Round(($global:ACTION_SW.ElapsedMilliseconds) / 1000, 2)
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
    $CHANNEL_CONFIG = $CHANNEL_CONFIG_JSON | ConvertFrom-Json
    $CHANNEL_CONFIG_NAME = $CHANNEL_CONFIG.name
    $CHANNEL_CONFIG_JSON | Out-File -Path "$PSScriptRoot/../.current-channel-config.json" -Encoding UTF8 -Force
    EndAction
    if (-not $VALID_CONFIG_JSON) {
        Write-Host "Channel configuration might not be valid (the JSON does not match the schema). Manually check schema, build continues..." -ForegroundColor Yellow
    }
}

$NPM_PACKAGE_FILE = Get-Content "$PSScriptRoot/../package.json" -Raw | ConvertFrom-Json

$StopWatch = [Diagnostics.Stopwatch]::StartNew()
$global:ACTION_SW = $null
#endregion

#region Paths
$START_PATH = Get-Location
$ROOT_PATH = "$PSScriptRoot/.."
$SHAREPOINT_FRAMEWORK_BASEPATH = "$ROOT_PATH/SharePointFramework"
$PNP_TEMPLATES_BASEPATH = "$ROOT_PATH/Templates"
$SITE_SCRIPTS_BASEPATH = "$ROOT_PATH/SiteScripts/src"
$PNP_BUNDLE_PATH = "$PSScriptRoot/PnP.PowerShell"
# Get-PnPVersion hentes fra SharedFunctions.ps1 i et isolert scope,
# slik at StartAction/EndAction definert i denne filen ikke overskrives
$PNP_VERSION = & {
    . "$PSScriptRoot/Scripts/SharedFunctions.ps1"
    Get-PnPVersion
}
$GIT_HASH = git log --pretty=format:'%h' -n 1
$RELEASE_NAME = "$($NPM_PACKAGE_FILE.name)-$($NPM_PACKAGE_FILE.version).$($GIT_HASH)"
if ($USE_CHANNEL_CONFIG) {
    $RELEASE_NAME = "$($RELEASE_NAME)-$($CHANNEL_CONFIG_NAME)"
}
$RELEASE_PATH = "$ROOT_PATH/release/$($RELEASE_NAME)"
#endregion

#region Node version guard
# The SPFx 1.23 Heft toolchain requires Node 22 (see rush.json nodeSupportedVersionRange and the
# .nvmrc files). Building on another major silently produces a stale or broken .sppkg, so fail here
# rather than shipping one.
$NODE_VERSION_RAW = (node -v) 2>$null
if ($LASTEXITCODE -ne 0 -or -not $NODE_VERSION_RAW) {
    Write-Host "[ERROR] Node.js was not found on PATH. Node.js 22 is required." -ForegroundColor Red
    exit 1
}
$NODE_MAJOR = [int]($NODE_VERSION_RAW.TrimStart('v').Split('.')[0])
if ($NODE_MAJOR -ne 22) {
    Write-Host "[ERROR] Node.js 22 is required for the SPFx Heft toolchain, found $NODE_VERSION_RAW." -ForegroundColor Red
    Write-Host "        Run 'nvm use' in the repository root (see .nvmrc) and try again." -ForegroundColor Yellow
    exit 1
}
#endregion

#region Node heap
# Heft runs TypeScript and webpack in one Node process per solution, and the largest solution
# (PortfolioWebParts) needs more than V8's default heap on machines with 8 GB or less (it fails at
# a 2 GB cap and passes at 3 GB). Give every heft process the same 8 GB ceiling the gulp toolchain
# used, unless the caller already set NODE_OPTIONS. RUSH_PARALLELISM is left to the caller.
if ([string]::IsNullOrEmpty($env:NODE_OPTIONS)) {
    $env:NODE_OPTIONS = "--max-old-space-size=8192"
}
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
    npm ci >$null 2>&1
    # Rush is launched through the repo-pinned bootstrap script, so the version always
    # follows rush.json (no global install to keep in sync). `install` requires the
    # committed lockfile to match; use `update` locally when dependencies change.
    node "$ROOT_PATH/common/scripts/install-run-rush.js" install >$null 2>&1
    npm run generate-channel-replace-map >$null 2>&1
    EndAction
}
else {
    StartAction("Updating npm packages using rush")
    node "$ROOT_PATH/common/scripts/install-run-rush.js" update >$null 2>&1
    npm run generate-channel-replace-map >$null 2>&1
    EndAction
}

if ($CI.IsPresent) {
    StartAction("Installing module PnP.PowerShell")
    Install-Module -Name PnP.PowerShell -Force -Scope CurrentUser
    EndAction
}
else {
    if (-not $SkipImportModule.IsPresent) {
        Import-Module $PNP_BUNDLE_PATH/$PNP_VERSION/PnP.PowerShell.psd1 -DisableNameChecking -ErrorAction SilentlyContinue
    }
}

if ($null -eq (Get-Command Connect-PnPOnline) -or (Get-Command Connect-PnPOnline).Version -lt [version]$PNP_VERSION) {
    Write-Host "[ERROR] Correct PnP.PowerShell module not found. Please install it from PowerShell Gallery or do not use -SkipLoadingBundle." -ForegroundColor Red
    exit 0
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
    npm run generate-site-scripts
    $SITE_SCRIPTS_BASEPATH = "$ROOT_PATH/.dist/SiteScripts"
    Copy-Item -Path "$SITE_SCRIPTS_BASEPATH/*.txt" -Filter *.txt -Destination $RELEASE_PATH_SITESCRIPTS -Force 
}
else {
    Copy-Item -Path "$SITE_SCRIPTS_BASEPATH/*.txt" -Filter *.txt -Destination $RELEASE_PATH_SITESCRIPTS -Force
}
Copy-Item -Path "$PSScriptRoot/../Templates/Portfolio/*.resx" -Filter *.resx -Destination $RELEASE_PATH -Force
Copy-Item -Path "$PSScriptRoot/Install.ps1" -Destination $RELEASE_PATH -Force
Copy-Item -Path "$PSScriptRoot/Scripts/*" -Recurse -Destination $RELEASE_PATH_SCRIPTS -Force
Copy-Item -Path "$PSScriptRoot/SearchConfiguration.xml" -Destination $RELEASE_PATH -Force
Copy-Item -Path "$PSScriptRoot/../.current-channel-config.json" -Destination $RELEASE_PATH -Force -ErrorAction SilentlyContinue
EndAction

if (-not $SkipBundle.IsPresent) {
    StartAction("Copying PnP.PowerShell bundle")
    Copy-Item -Path $PNP_BUNDLE_PATH -Filter * -Destination $RELEASE_PATH -Force -Recurse
    EndAction
}

(Get-Content "$RELEASE_PATH/Install.ps1") -Replace '{VERSION_PLACEHOLDER}', "$($NPM_PACKAGE_FILE.version).$($GIT_HASH)" -Replace "{CHANNEL_PLACEHOLDER}", $CHANNEL_CONFIG_NAME | Set-Content "$RELEASE_PATH/Install.ps1"
#endregion

#region Build PnP templates
if (-not $SkipBuildPnPTemplates.IsPresent) {
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

    Get-ChildItem "./Content" -Directory | ForEach-Object {
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
}
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
    # Always run the full, dependency-ordered `rush rebuild`. Building a subset
    # with `rush --to <project>` did not reliably emit the .sppkg in CI (shared-library
    # is a workspace-linked dependency), so the scope is applied at the *packaging*
    # step below instead: only the selected solutions' .sppkg are copied into the
    # release, and Install.ps1 deploys every .sppkg in the Apps folder — so an
    # [apps-only:<solution>] run still packages and deploys only those apps.
    # The build output is captured to a log file (kept out of the release and
    # gitignored via **/*.build.log) and dumped if the build fails, so compile
    # errors are never silently swallowed.
    $RUSH_REBUILD_LOG = "$SHAREPOINT_FRAMEWORK_BASEPATH/rush-rebuild.build.log"
    $RUSH_REBUILD_STARTED = (Get-Date).ToUniversalTime()
    node "$ROOT_PATH/common/scripts/install-run-rush.js" rebuild 2>&1 | Out-File -FilePath $RUSH_REBUILD_LOG -Encoding utf8
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] rush rebuild failed with exit code $LASTEXITCODE. Last 200 lines of $($RUSH_REBUILD_LOG):" -ForegroundColor Red
        Get-Content $RUSH_REBUILD_LOG -Tail 200 | Write-Host
        exit 1
    }
    foreach ($Solution in $Solutions) {
        # Copy ONLY the package this solution declares in config/package-solution.json, not every
        # .sppkg lying in sharepoint/solution. That folder is gitignored build output and accumulates
        # stale packages from earlier channel builds (pp-*-test.sppkg) and older releases
        # (pp-*-arkiv.sppkg); Install.ps1 deploys every .sppkg it finds in Apps, so copying them all
        # would deploy obsolete and wrong-channel apps to the tenant. On a fresh CI clone the folder
        # happens to hold only the current build, which is why this never bit in CI.
        $SOLUTION_CONFIG_PATH = "$SHAREPOINT_FRAMEWORK_BASEPATH/$Solution/config/package-solution.json"
        $ZIPPED_PACKAGE = (Get-Content $SOLUTION_CONFIG_PATH -Raw | ConvertFrom-Json).paths.zippedPackage
        $SPPKG_PATH = "$SHAREPOINT_FRAMEWORK_BASEPATH/$Solution/sharepoint/$ZIPPED_PACKAGE"
        # Packaging proof, part 1: every selected solution must have emitted its declared package
        # during THIS run. A missing or stale .sppkg (left over from an earlier build) means the
        # build did not produce what Install.ps1 will deploy, so fail instead of shipping it.
        if (-not (Test-Path $SPPKG_PATH)) {
            Write-Host "[ERROR] $Solution did not emit $ZIPPED_PACKAGE. See $RUSH_REBUILD_LOG." -ForegroundColor Red
            exit 1
        }
        if ((Get-Item $SPPKG_PATH).LastWriteTimeUtc -lt $RUSH_REBUILD_STARTED) {
            Write-Host "[ERROR] $ZIPPED_PACKAGE for $Solution predates this build ($((Get-Item $SPPKG_PATH).LastWriteTimeUtc) UTC); rush rebuild did not re-emit it." -ForegroundColor Red
            exit 1
        }
        # Packaging proof, part 2: the shared library must be bundled, never a runtime dependency
        # (Decision A in docs/plans/spfx-1.23-heft-toolchain.md). Heft externalizes a linked
        # workspace package when its dist holds exactly one manifest, and the only symptom at
        # runtime is a missing-module error in the browser. Catch it here: no AMD define header
        # in dist may list a pp365-* package.
        $ExternalHits = Get-ChildItem "$SHAREPOINT_FRAMEWORK_BASEPATH/$Solution/dist" -Filter *.js -File -ErrorAction SilentlyContinue |
            Select-String -Pattern 'define\(\[[^\]]*pp365-[^\]]*\]' -List
        if ($ExternalHits) {
            Write-Host "[ERROR] $Solution bundles reference a pp365-* package as an external (shared library not bundled):" -ForegroundColor Red
            $ExternalHits | ForEach-Object { Write-Host "        $($_.Filename)" -ForegroundColor Red }
            exit 1
        }
        # Packaging proof, part 3: third-party stylesheets must stay global. The Heft rig compiles
        # every .css as a CSS module unless spfx-customize-webpack.js exempts node_modules; when that
        # exemption is missing, react-calendar-timeline's and Fabric's class names are hashed, the
        # library DOM no longer matches its own rules, and the timeline renders as an unclickable
        # overlay. A hashed third-party class name in a bundle is therefore a build error.
        $HashedCssHits = Get-ChildItem "$SHAREPOINT_FRAMEWORK_BASEPATH/$Solution/dist" -Filter *.js -File -ErrorAction SilentlyContinue |
            Select-String -Pattern '(react-calendar-timeline|rct-(outer|scroll|header-root|sidebar|calendar-header|items)|ms-Fabric|ms-Grid-row|ms-Grid-col)_[0-9a-f]{8}\b' -List
        if ($HashedCssHits) {
            Write-Host "[ERROR] $Solution bundles contain hashed class names from third-party stylesheets (node_modules CSS compiled as CSS modules):" -ForegroundColor Red
            $HashedCssHits | ForEach-Object { Write-Host "        $($_.Filename): $($_.Matches[0].Value)" -ForegroundColor Red }
            exit 1
        }
        Copy-Item $SPPKG_PATH -Destination $RELEASE_PATH_APPS -Force
    }
    # Fail loudly rather than ship a release with no apps (e.g. an unrecognised
    # solution name, or a solution that built without emitting an .sppkg).
    $PackagedApps = @(Get-ChildItem "$RELEASE_PATH_APPS" -Filter *.sppkg -ErrorAction SilentlyContinue)
    if ($PackagedApps.Count -eq 0) {
        Write-Host "[ERROR] No .sppkg were packaged for solutions: $($Solutions -join ', '). See $RUSH_REBUILD_LOG for build output. Aborting." -ForegroundColor Red
        exit 1
    }
    Write-Host "Packaged $($PackagedApps.Count) app(s): $(($PackagedApps | ForEach-Object { $_.Name }) -join ', ')" -ForegroundColor Green
    if ($USE_CHANNEL_CONFIG) {
        foreach ($Solution in $Solutions) {
            Set-Location "$SHAREPOINT_FRAMEWORK_BASEPATH/$Solution"
            node ../.tasks/modifySolutionFiles.js --revert --force >$null 2>&1 
        }
    }
    EndAction
}
#endregion

#region Compressing release to a zip file
if (-not $CI.IsPresent) {
    # Remove-Item instead of rimraf: rimraf is not a dependency of this repo, so the call only
    # worked on machines that happened to have it installed globally.
    Remove-Item -Path "$($RELEASE_PATH).zip" -Force -ErrorAction SilentlyContinue
    Add-Type -Assembly "System.IO.Compression.FileSystem"
    [IO.Compression.ZipFile]::CreateFromDirectory($RELEASE_PATH, "$($RELEASE_PATH).zip")  
    $StopWatch.Stop()
    Write-Host "Done building release $RELEASE_NAME in $($StopWatch.ElapsedMilliseconds/1000)s" -ForegroundColor Green
    Set-Location $START_PATH
}
else {
    $StopWatch.Stop()
    Write-Host "Done building release $RELEASE_NAME in $($StopWatch.ElapsedMilliseconds/1000)s" -ForegroundColor Green
    Set-Location $START_PATH
}

if ($USE_CHANNEL_CONFIG) {
    Remove-Item -Path "$PSScriptRoot/../.current-channel-config.json" -Force -ErrorAction SilentlyContinue
}

exit 0
#endregion