Param(
    [Parameter(Mandatory = $false, HelpMessage = "Skip building of SharePoint Framework solutions")]
    [switch]$SkipBuildSharePointFramework,
    [Parameter(Mandatory = $false, HelpMessage = "Clean node_modules for all SharePoint Framework solutions")]
    [switch]$CleanNodeModules,
    [Parameter(Mandatory = $false)]
    [string[]]$Solutions = @("ProjectWebParts", "PortfolioWebParts", "ProjectExtensions")
)

npm config set loglevel warn    

$sw = [Diagnostics.Stopwatch]::StartNew()

$PackageJson = Get-Content "$PSScriptRoot/../package.json" -Raw | ConvertFrom-Json

#region Creating release path
$GitHash = git log --pretty=format:'%h' -n 1
$ReleasePath = "$PSScriptRoot/../Release/$($PackageJson.name)-$($PackageJson.version).$($GitHash)"
mkdir $ReleasePath >$null 2>&1
mkdir "$ReleasePath/Templates" >$null 2>&1
mkdir "$ReleasePath/SiteScripts" >$null 2>&1
mkdir "$ReleasePath/Scripts" >$null 2>&1
mkdir "$ReleasePath/Apps" >$null 2>&1
#endregion

Write-Host "[INFO] Building release [v$($PackageJson.version)]"

#region Copying source files
Write-Host "[INFO] Copying Install.ps1, PostInstall.ps1 and site script source files"
Copy-Item -Path "$PSScriptRoot/../SiteScripts/Src/*.txt" -Filter *.txt -Destination "$ReleasePath/SiteScripts" -Force
Copy-Item -Path "$PSScriptRoot/Install.ps1" -Destination $ReleasePath -Force
Copy-Item -Path "$PSScriptRoot/Scripts/*.ps1" -Destination "$ReleasePath/Scripts" -Force
Copy-Item -Path "$PSScriptRoot/SearchConfiguration.xml" -Destination $ReleasePath -Force

Write-Host "[INFO] Copying SharePointPnPPowerShellOnline bundle"
Copy-Item -Path "$PSScriptRoot/SharePointPnPPowerShellOnline" -Filter * -Destination $ReleasePath -Force -Recurse

(Get-Content "$ReleasePath/Install.ps1") -Replace 'VERSION_PLACEHOLDER', $PackageJson.version | Set-Content "$ReleasePath/Install.ps1"
#endregion


#region Clean node_modules for all SharePoint Framework solutions
if ($CleanNodeModules.IsPresent) {
    foreach ($Solution in $Solutions) {
        Write-Host "[INFO] Clearing node_modules for SharePoint Framework solution [$($Solution)]"
        rimraf "$($PSScriptRoot)\..\SharePointFramework\$($Solution)\node_modules\"
    }
}
#endregion

#region Package SharePoint Framework solutions
Write-Host "[INFO] Building SharePointFramework\@Shared"
Set-Location "$PSScriptRoot\..\SharePointFramework\@Shared"
# https://github.com/SharePoint/sp-dev-docs/issues/2916
if (-not $SkipBuildSharePointFramework.IsPresent) {
    npm install --no-package-lock
    tsc
}

foreach ($Solution in $Solutions) {
    Set-Location "$($PSScriptRoot)\..\SharePointFramework\$($Solution)"
    $PackageSolutionJson = Get-Content "./config/package-solution.json" -Raw | ConvertFrom-Json
    Write-Host "[INFO] Packaging SharePoint Framework solution [$($Solution)] [v$($PackageSolutionJson.solution.version)]"
    # https://github.com/SharePoint/sp-dev-docs/issues/2916
    if (-not $SkipBuildSharePointFramework.IsPresent) {
        npm install --no-package-lock
        npm run package
    }
    Get-ChildItem "./sharepoint/solution/" *.sppkg -Recurse
    | Where-Object { -not ($_.PSIsContainer -or (Test-Path "$ReleasePath/Apps/$_")) }
    | Copy-Item -Destination "$ReleasePath/Apps" -Force
}
#endregion

Set-Location $PSScriptRoot

#region Build PnP templates
Write-Host "[INFO] Building [Portfolio] PnP template"
Convert-PnPFolderToProvisioningTemplate -Out "$ReleasePath/Templates/Portfolio.pnp" -Folder "$PSScriptRoot/../Templates/Portfolio" -Force

Write-Host "[INFO] Building PnP content templates"
Set-Location "$PSScriptRoot/../Templates"
npm install --no-package-lock
npm run generateJsonTemplates
Get-ChildItem "./Content" -Directory | ForEach-Object {
    Convert-PnPFolderToProvisioningTemplate -Out "$ReleasePath/Templates/$($_.BaseName).pnp" -Folder $_.FullName -Force
}
Set-Location $PSScriptRoot

Write-Host "[INFO] Building [Taxonomy] PnP template"
Convert-PnPFolderToProvisioningTemplate -Out "$ReleasePath/Templates/Taxonomy.pnp" -Folder "$PSScriptRoot/../Templates/Taxonomy" -Force
#endregion

$sw.Stop()


Add-Type -Assembly "System.IO.Compression.FileSystem"

[IO.Compression.ZipFile]::CreateFromDirectory($ReleasePath, "$($ReleasePath).zip") 

Write-Host "[INFO] Done building release [v$($PackageJson.version)] in [$($sw.Elapsed)]"