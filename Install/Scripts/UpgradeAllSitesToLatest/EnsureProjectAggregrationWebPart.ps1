$TargetVersion = [version]"1.9.0"

if ($global:__PreviousVersion -lt $TargetVersion) {
    $BaseDir = "$ScriptDir/UpgradeAllSitesToLatest/EnsureProjectAggregrationWebPart"
    $Pages = Get-Content "$BaseDir/$.json" -Raw -Encoding UTF8 | ConvertFrom-Json
    
    $ReplacedCount = 0
    foreach ($Page in $Pages) {
        $PageName = "$($Page.Name).aspx"
        $DeprecatedComponent = Get-PnPPageComponent -Page $PageName -ErrorAction SilentlyContinue | Where-Object { $_.WebPartId -eq $Page.ControlId } | Select-Object -First 1
        if ($null -ne $DeprecatedComponent -and $DeprecatedComponent.WebPartId -ne "6c0e484d-f6da-40d4-81fc-ec1389ef29a8") {
            Write-Host "`t`tReplacing deprecated component $($Page.ControlId) for $($PageName)"
            $JsonControlData = Get-Content "$BaseDir/JsonControlData_$($Page.Name).json" -Raw -Encoding UTF8
            $Title = $JsonControlData | ConvertFrom-Json | Select-Object -ExpandProperty title

            Remove-PnPPageComponent -Page $PageName -InstanceId $DeprecatedComponent.InstanceId -Force -ErrorAction SilentlyContinue
            Invoke-PnPSiteTemplate -Path "$BaseDir/Template_ProjectAggregationWebPart.xml" -Parameters @{"JsonControlData" = $JsonControlData; "PageName" = $PageName; "Title" = $Title }

            $ReplacedCount++
        }
    }

    if ($ReplacedCount -eq 0) {
        Write-Host "`t`tThe site does not need to replace any deprecated project aggregation components" -ForegroundColor Green
    }
}