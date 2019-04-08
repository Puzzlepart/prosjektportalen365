$PackageJson = Get-Content "$PSScriptRoot/../package.json" -Raw | ConvertFrom-Json
$ReleasePath = "$PSScriptRoot/../Release/$($PackageJson.version)"
mkdir $ReleasePath >$null 2>&1
mkdir "$ReleasePath/Templates" >$null 2>&1
mkdir "$ReleasePath/SiteScripts" >$null 2>&1
mkdir "$ReleasePath/Apps" >$null 2>&1

Write-Host "[INFO] Building release v$($PackageJson.version)"

Write-Host "[INFO] Copying resources"
Copy-Item -Path "$PSScriptRoot/../SiteScripts/Src/" -Filter *.txt -Destination "$ReleasePath/SiteScripts" -Recurse
Copy-Item -Path "$PSScriptRoot/Install.ps1" -Destination $ReleasePath

foreach ($Solution in @("PortfolioWebParts", "ProjectExtensions", "ProjectWebParts")) {
    Set-Location "$PSScriptRoot\..\SharePointFramework\$Solution"
    $PackageSolutionJson = Get-Content "./config/package-solution.json" -Raw | ConvertFrom-Json
    Write-Host "[INFO] Building SharePoint Framework solution [$($Solution)] [v$($PackageSolutionJson.solution.version)]"
    npm run-script package >$null 2>&1
    Get-ChildItem "./sharepoint/solution/" *.sppkg -Recurse | ?{-not ($_.PSIsContainer -or (Test-Path "$ReleasePath/Apps/$_"))} | Copy-Item -Destination "$ReleasePath/Apps"
}

Set-Location $PSScriptRoot

Write-Host "[INFO] Building [Portal] PnP template"
Convert-PnPFolderToProvisioningTemplate -Out "$ReleasePath/Templates/Portal.pnp" -Folder "$PSScriptRoot/../Templates/Portal" -Force


Write-Host "[INFO] Done building release v$($PackageJson.version)"