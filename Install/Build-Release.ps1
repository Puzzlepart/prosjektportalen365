
$sw = [Diagnostics.Stopwatch]::StartNew()

$PackageJson = Get-Content "$PSScriptRoot/../package.json" -Raw | ConvertFrom-Json

#region Creating release path
$GitHash = git log --pretty=format:'%h' -n 1
$ReleasePath = "$PSScriptRoot/../Release/$($PackageJson.name)-$($PackageJson.version).$($GitHash)"
mkdir $ReleasePath >$null 2>&1
mkdir "$ReleasePath/Templates" >$null 2>&1
mkdir "$ReleasePath/SiteScripts" >$null 2>&1
mkdir "$ReleasePath/Apps" >$null 2>&1
#endregion

Write-Host "[INFO] Building release [v$($PackageJson.version)]"

#region Copying source files
Write-Host "[INFO] Copying Install.ps1 and site script source files"
Copy-Item -Path "$PSScriptRoot/../SiteScripts/Src/*.txt" -Filter *.txt -Destination "$ReleasePath/SiteScripts" -Force
Copy-Item -Path "$PSScriptRoot/Install.ps1" -Destination $ReleasePath -Force
(Get-Content "$ReleasePath/Install.ps1") -Replace 'VERSION_PLACEHOLDER', $PackageJson.version | Set-Content "$ReleasePath/Install.ps1"
#endregion


#region Package SharePoint Framework solutions

Set-Location "$PSScriptRoot\..\SharePointFramework\@Shared"
# https://github.com/SharePoint/sp-dev-docs/issues/2916
pnpm install --shamefully-flatten

foreach ($Solution in @("ProjectWebParts", "PortfolioWebParts", "ProjectExtensions")) {
    Set-Location "$PSScriptRoot\..\SharePointFramework\$Solution"
    $PackageSolutionJson = Get-Content "./config/package-solution.json" -Raw | ConvertFrom-Json
    Write-Host "[INFO] Packaging SharePoint Framework solution [$($Solution)] [v$($PackageSolutionJson.solution.version)]"
    # https://github.com/SharePoint/sp-dev-docs/issues/2916
    pnpm install --shamefully-flatten
    pnpm run-script package
    Get-ChildItem "./sharepoint/solution/" *.sppkg -Recurse | Where-Object{-not ($_.PSIsContainer -or (Test-Path "$ReleasePath/Apps/$_"))} | Copy-Item -Destination "$ReleasePath/Apps" -Force
}
#endregion

Set-Location $PSScriptRoot

#region Build PnP templates
Write-Host "[INFO] Building [Portfolio] PnP template"
Convert-PnPFolderToProvisioningTemplate -Out "$ReleasePath/Templates/Portfolio.pnp" -Folder "$PSScriptRoot/../Templates/Portfolio" -Force

Write-Host "[INFO] Building [Taxonomy] PnP template"
Convert-PnPFolderToProvisioningTemplate -Out "$ReleasePath/Templates/Taxonomy.pnp" -Folder "$PSScriptRoot/../Templates/Taxonomy" -Force
#endregion

$sw.Stop()


Add-Type -Assembly "System.IO.Compression.FileSystem"

[IO.Compression.ZipFile]::CreateFromDirectory($ReleasePath, "$($ReleasePath).zip") 

Write-Host "[INFO] Done building release [v$($PackageJson.version)] in [$($sw.Elapsed)]"