$TargetVersion = [version]"1.9.0"

if ($global:__PreviousVersion -lt $TargetVersion) {
    $BaseDir = "$ScriptDir/UpgradeAllSitesToLatest/EnsureProgramAggregrationWebPart"
    $Pages = Get-Content "$BaseDir/old.json" -Raw -Encoding UTF8 | ConvertFrom-Json

    $ReplacedCount = 0
    foreach ($Page in $Pages.PSObject.Properties.GetEnumerator()) {
        $DeprecatedComponent = Get-PnPPageComponent -Page "$($Page.Name).aspx" -ErrorAction SilentlyContinue | Where-Object { $_.WebPartId -eq $Page.Value } | Select-Object -First 1
        if ($null -ne $DeprecatedComponent) {
            Write-Host "`t`tReplacing older deprecated component $($Page.Value) for $($Page.Name).aspx"
            $JsonControlData = Get-Content "$BaseDir/JsonControlData_$($Page.Name).json" -Raw -Encoding UTF8
            $Title = $JsonControlData | ConvertFrom-Json | Select-Object -ExpandProperty title
            Invoke-PnPSiteTemplate -Path "$BaseDir/Template_ProgramAggregationWebPart.xml" -Parameters @{"JsonControlData" = $JsonControlData; "PageName" = "$($Page.Name).aspx"; "Title" = $Title }
            $ReplacedCount++
        }
    }
    if ($ReplacedCount -eq 0) {
        Write-Host "`t`tThe site does not need to replace any deprecated (old) program aggregation components" -ForegroundColor Green
    }
}