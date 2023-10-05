$TargetVersion = "1.8.2"

if ($global:__InstalledVersion -lt $TargetVersion) {
    $BaseDir = "$ScriptDir/EnsureProjectAggregrationWebPart"
    $Pages = Get-Content "$BaseDir/$.json" -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($Page in $Pages) {
        $PageName = "$($Page.Name).aspx"
        $DeprecatedComponent = Get-PnPPageComponent -Page $PageName -ErrorAction SilentlyContinue | Where-Object { $_.WebPartId -eq $Page.ControlId } | Select-Object -First 1
        if ($null -ne $DeprecatedComponent) {
            Write-Host "`t`tReplacing deprecated component $($Page.ControlId) for $($PageName)"
            $JsonControlData = Get-Content "$BaseDir/JsonControlData_$($Page.Name).json" -Raw -Encoding UTF8
            $Title = $JsonControlData | ConvertFrom-Json | Select-Object -ExpandProperty title
            Invoke-PnPSiteTemplate -Path "$BaseDir/Template_ProjectAggregationWebPart.xml" -Parameters @{"JsonControlData" = $JsonControlData; "PageName" = $PageName; "Title" = $Title }
        }
    }
}