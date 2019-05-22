
$sw = [Diagnostics.Stopwatch]::StartNew()

$PackageJson = Get-Content "$PSScriptRoot/../package.json" -Raw | ConvertFrom-Json
$ReleasePath = "$PSScriptRoot/../Release/$($PackageJson.version)"
mkdir $ReleasePath >$null 2>&1
mkdir "$ReleasePath/Templates" >$null 2>&1
mkdir "$ReleasePath/SiteScripts" >$null 2>&1
mkdir "$ReleasePath/Apps" >$null 2>&1

Write-Host "[INFO] Building release [v$($PackageJson.version)]"

Write-Host "[INFO] Copying Install.ps1 and site script source files"
Copy-Item -Path "$PSScriptRoot/../SiteScripts/Src/*.txt" -Filter *.txt -Destination "$ReleasePath/SiteScripts" -Force
Copy-Item -Path "$PSScriptRoot/Install.ps1" -Destination $ReleasePath -Force

foreach ($Solution in @("PortfolioWebParts", "ProjectExtensions", "ProjectWebParts")) {
    Set-Location "$PSScriptRoot\..\SharePointFramework\$Solution"
    $PackageSolutionJson = Get-Content "./config/package-solution.json" -Raw | ConvertFrom-Json
    Write-Host "[INFO] Packaging SharePoint Framework solution [$($Solution)] [v$($PackageSolutionJson.solution.version)]"
    npm run-script package >$null 2>&1
    Get-ChildItem "./sharepoint/solution/" *.sppkg -Recurse | Where-Object{-not ($_.PSIsContainer -or (Test-Path "$ReleasePath/Apps/$_"))} | Copy-Item -Destination "$ReleasePath/Apps" -Force
}

Set-Location $PSScriptRoot

Write-Host "[INFO] Building [Portal] PnP template"
Convert-PnPFolderToProvisioningTemplate -Out "$ReleasePath/Templates/Portal.pnp" -Folder "$PSScriptRoot/../Templates/Portal" -Force

Write-Host "[INFO] Building [Taxonomy] PnP template"
Convert-PnPFolderToProvisioningTemplate -Out "$ReleasePath/Templates/Taxonomy.pnp" -Folder "$PSScriptRoot/../Templates/Taxonomy" -Force

$sw.Stop()

Write-Host "[INFO] Done building release [v$($PackageJson.version)] in [$($sw.Elapsed)]"