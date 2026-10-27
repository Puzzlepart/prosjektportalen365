# Runs on every upgrade, regardless of the previous version. A project site that was skipped by
# an earlier upgrade (not yet in the hub, or the upgrading user had no access) would otherwise
# never get the footer: this step used to run only when upgrading from 1.9.0 or older, and the
# site design that added the footer to new sites was removed in 1.14.0 (the JSON templates add it
# at project setup instead). The check is idempotent and cheap, so there is no reason to gate it.
[System.Guid]$ClientSideComponentId = "84f27cec-ffde-4e00-a4cf-25c69f691054"
if ($null -ne $global:__CurrentChannelConfig) {
  $ClientSideComponentId = $global:__CurrentChannelConfig.spfx.solutions.PortfolioExtensions.components.Footer
}

# The "Hjelpeinnhold" application customizer was replaced by the footer in 1.9.0 and is no longer
# part of any package, so the custom action is dead on sites created before 1.9.0.
[System.Guid]$LegacyHelpContentComponentId = "28987406-2a67-48a8-9297-fd2833bf0a09"

$CustomActions = Get-PnPCustomAction -Scope Web

$ExistingFooter = $CustomActions | Where-Object { $_.ClientSideComponentId -eq $ClientSideComponentId }
if ($null -eq $ExistingFooter) {
  Write-Host "`t`tAdding footer extension to site"
  Add-PnPCustomAction -Title "Footer" -Name "Footer" -Location "ClientSideExtension.ApplicationCustomizer" -ClientSideComponentId $ClientSideComponentId -ClientSideComponentProperties "{}" -Scope Web >$null 2>&1
}
else {
  Write-Host "`t`tThe site already has the footer extension" -ForegroundColor Green
}

$LegacyHelpContent = $CustomActions | Where-Object { $_.ClientSideComponentId -eq $LegacyHelpContentComponentId }
foreach ($Action in $LegacyHelpContent) {
  Write-Host "`t`tRemoving legacy help content extension '$($Action.Title)' (replaced by the footer in 1.9.0)"
  Remove-PnPCustomAction -Identity $Action.Id -Scope Web -Force >$null 2>&1
}
