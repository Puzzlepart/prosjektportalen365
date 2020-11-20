Param(
    [Parameter(Mandatory = $false, HelpMessage = "Skip building of SharePoint Framework solutions")]
    [switch]$SkipBuildSharePointFramework,
    [Parameter(Mandatory = $false, HelpMessage = "Clean node_modules for all SharePoint Framework solutions")]
    [switch]$CleanNodeModules,
    [Parameter(Mandatory = $false)]
    [string[]]$Solutions = @("ProjectWebParts", "PortfolioWebParts", "ProjectExtensions"),
    [Parameter(Mandatory = $false)]
    [switch]$Silent,
    [Parameter(Mandatory = $false, HelpMessage = "CI mode. Installs SharePointPnPPowerShellOnline.")]
    [switch]$CI
)   

if($CI.IsPresent) {
    Write-Host "[Running in CI mode. Installing module SharePointPnPPowerShellOnline.]" -ForegroundColor Yellow
    Install-Module -Name SharePointPnPPowerShellOnline -Force -Verbose -Scope CurrentUser    
}

$sw = [Diagnostics.Stopwatch]::StartNew()

$PackageJson = Get-Content "$PSScriptRoot/../package.json" -Raw | ConvertFrom-Json

#region Creating release path
$GitHash = git log --pretty=format:'%h' -n 1
$ReleasePath = "$PSScriptRoot/../Release/$($PackageJson.name)-$($PackageJson.version).$($GitHash)"
if($CI.IsPresent) {
    $ReleasePath = "$PSScriptRoot/../Release"
}
mkdir $ReleasePath >$null 2>&1
mkdir "$ReleasePath/Templates" >$null 2>&1
mkdir "$ReleasePath/SiteScripts" >$null 2>&1
mkdir "$ReleasePath/Scripts" >$null 2>&1
mkdir "$ReleasePath/Apps" >$null 2>&1
#endregion

Write-Host "[Building release v$($PackageJson.version)]" -ForegroundColor Cyan


if ($Silent.IsPresent) {
    Write-Host "[Running in silent mode. All output from npm will be surpressed.]" -ForegroundColor Yellow
}

#region Copying source files
Write-Host "[INFO] Copying Install.ps1, PostInstall.ps1 and site script source files...  " -NoNewline
Copy-Item -Path "$PSScriptRoot/../SiteScripts/Src/*.txt" -Filter *.txt -Destination "$ReleasePath/SiteScripts" -Force
Copy-Item -Path "$PSScriptRoot/Install.ps1" -Destination $ReleasePath -Force
Copy-Item -Path "$PSScriptRoot/Scripts/*.ps1" -Destination "$ReleasePath/Scripts" -Force
Copy-Item -Path "$PSScriptRoot/SearchConfiguration.xml" -Destination $ReleasePath -Force
Write-Host "DONE" -ForegroundColor Green

Write-Host "[INFO] Copying SharePointPnPPowerShellOnline bundle...  " -NoNewline
Copy-Item -Path "$PSScriptRoot/SharePointPnPPowerShellOnline" -Filter * -Destination $ReleasePath -Force -Recurse
Write-Host "DONE" -ForegroundColor Green

(Get-Content "$ReleasePath/Install.ps1") -Replace 'VERSION_PLACEHOLDER', $PackageJson.version | Set-Content "$ReleasePath/Install.ps1"
#endregion


#region Clean node_modules for all SharePoint Framework solutions
if ($CleanNodeModules.IsPresent) {
    $Solutions | ForEach-Object {
        Write-Host "[INFO] Clearing node_modules for SPFx solution [$_]...  " -NoNewline
        rimraf "$($PSScriptRoot)\..\SharePointFramework\$_\node_modules\"
        Write-Host "DONE" -ForegroundColor Green
    }
}
#endregion

#region Package SharePoint Framework solutions
Write-Host "[INFO] Building SharePointFramework\@Shared...  " -NoNewline
Set-Location "$PSScriptRoot\..\SharePointFramework\@Shared"

# https://github.com/SharePoint/sp-dev-docs/issues/2916
if (-not $SkipBuildSharePointFramework.IsPresent) {
    if ($Silent.IsPresent) {
        npm install --no-package-lock --no-progress --silent --no-audit >$null 2>&1
        npm run build >$null 2>&1
    }
    else {
        npm install --no-package-lock
        npm run build   
    }
}
Write-Host "DONE" -ForegroundColor Green

$Solutions | ForEach-Object {
    Set-Location "$($PSScriptRoot)\..\SharePointFramework\$_"
    $PackageSolutionJson = Get-Content "./config/package-solution.json" -Raw | ConvertFrom-Json
    Write-Host "[INFO] Packaging SPFx solution [$_] [v$($PackageSolutionJson.solution.version)]...  " -NoNewline
    # https://github.com/SharePoint/sp-dev-docs/issues/2916
    if (-not $SkipBuildSharePointFramework.IsPresent) {
        if ($Silent.IsPresent) {
            npm install --no-package-lock --no-progress --silent --no-audit >$null 2>&1
            npm run package >$null 2>&1
        }
        else {
            npm install --no-package-lock
            npm run package 
        }
    }
    Write-Host "DONE" -ForegroundColor Green
    Get-ChildItem "./sharepoint/solution/" *.sppkg -Recurse | Where-Object { -not ($_.PSIsContainer -or (Test-Path "$ReleasePath/Apps/$_")) } | Copy-Item -Destination "$ReleasePath/Apps" -Force
}
#endregion


#region Build PnP templates
Set-Location $PSScriptRoot
Write-Host "[INFO] Building [Portfolio] PnP template...  " -NoNewline
Convert-PnPFolderToProvisioningTemplate -Out "$ReleasePath/Templates/Portfolio.pnp" -Folder "$PSScriptRoot/../Templates/Portfolio" -Force
Write-Host "DONE" -ForegroundColor Green

Write-Host "[INFO] Building PnP content templates...  " -NoNewline
Set-Location "$PSScriptRoot/../Templates"
if ($Silent.IsPresent) {
    npm install --no-package-lock --no-progress --silent --no-audit >$null 2>&1
    npm run generateJsonTemplates >$null 2>&1
}
else {
    npm install --no-package-lock
    npm run generateJsonTemplates
}
Get-ChildItem "./Content" -Directory -Filter "*no-NB*" | ForEach-Object {
    Convert-PnPFolderToProvisioningTemplate -Out "$ReleasePath/Templates/$($_.BaseName).pnp" -Folder $_.FullName -Force
}
Write-Host "DONE" -ForegroundColor Green
Set-Location $PSScriptRoot

Write-Host "[INFO] Building [Taxonomy] PnP template....  " -NoNewline
Convert-PnPFolderToProvisioningTemplate -Out "$ReleasePath/Templates/Taxonomy.pnp" -Folder "$PSScriptRoot/../Templates/Taxonomy" -Force
Write-Host "DONE" -ForegroundColor Green
#endregion

$sw.Stop()

if(-not $CI.IsPresent) {
    Add-Type -Assembly "System.IO.Compression.FileSystem"
    [IO.Compression.ZipFile]::CreateFromDirectory($ReleasePath, "$($ReleasePath).zip")  
    Write-Host "Done building release [v$($PackageJson.version)] in [$($sw.Elapsed)]" -ForegroundColor Cyan
}
