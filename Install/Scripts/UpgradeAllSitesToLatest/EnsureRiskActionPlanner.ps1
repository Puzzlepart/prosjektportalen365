$TargetVersion = [version]"1.9.0"

if ($global:__PreviousVersion -lt $TargetVersion) {
    [System.Guid]$ClientSideComponentId = "1dd9fdb3-df0f-4248-a869-ca6f512e3d0f"
    if ($null -ne $global:__CurrentChannelConfig) {
        $ClientSideComponentId = $global:__CurrentChannelConfig.spfx.solutions.ProjectExtensions.components.RiskActionPlanner
    }
    $RiskActionField = Get-PnPField GtRiskAction

    if ($null -ne $RiskActionField) {
        $CurrentClientSideComponentId = Get-PnPProperty -ClientObject $RiskActionField -Property ClientSideComponentId
        if ($null -eq $CurrentClientSideComponentId -or $CurrentClientSideComponentId -ne $ClientSideComponentId) {
            Write-Host "`t`tSetting ClientSideComponentId to $ClientSideComponentId for GtRiskAction field"
            $FieldUpdated = Set-PnPField -Identity $RiskActionField.InternalName -Values @{ClientSideComponentId = $ClientSideComponentId } -UpdateExistingLists -ErrorAction SilentlyContinue
        } else {
            Write-Host "`t`tThe site already has a configured GtRiskAction field" -ForegroundColor Green
        }        
    }
}
