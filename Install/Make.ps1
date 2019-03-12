$SpfxSolutions = Get-ChildItem "$PSScriptRoot\..\SharePointFramework\" -Directory
foreach($Solution in $SpfxSolutions) {
    Write-Host "[INFO] Building SharePoint Framework solution $($Solution.BaseName)"
    Set-Location $Solution.FullName
    npm run-script package >$null 2>&1
    Get-ChildItem .\sharepoint\solution\*.sppkg -Recurse | Copy-Item -Destination $PSScriptRoot
}
Set-Location $PSScriptRoot