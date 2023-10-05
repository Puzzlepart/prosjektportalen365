$TargetVersion = "1.9.1"

if ($global:__InstalledVersion -lt $TargetVersion) {
    [System.Guid]$ClientSideComponentId = "2511e707-1b8a-4dc3-88d1-b7002eb3ce54"
    if ($null -ne $global:__CurrentChannelConfig) {
        $ClientSideComponentId = $global:__CurrentChannelConfig.spfx.solutions.ProjectExtensions.components.RiskActionPlanner
    }
    $RiskActionField = Get-PnPField GtRiskAction
    if ($null -ne $RiskActionField) {
        Write-Host "`t`tSetting ClientSideComponentId to $ClientSideComponentId for GtRiskAction field"
        Set-PnPField -Identity $RiskActionField.InternalName -Values @{ClientSideComponentId = $ClientSideComponentId } -UpdateExistingLists -ErrorAction SilentlyContinue
    }
}
