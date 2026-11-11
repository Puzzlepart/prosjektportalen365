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

# The footer of every release channel, as in channels/*.json (.tasks/check-channel-ids.js fails the
# build when they differ). A tenant can hold several channels' packages, and a site keeps only its
# own channel's footer.
$ChannelFooterIds = @(
  "84f27cec-ffde-4e00-a4cf-25c69f691054", # main
  "65d27710-49a9-4492-a4ec-3ac4f1e798d2", # test
  "75d27710-49a9-4492-a4ec-3ac4f1e798d3", # i18n
  "230f9162-35d0-499c-a849-4b69175ee7fe"  # kurs
)

# Only a package that names its channel (.current-channel-config.json) knows which footer is the
# site's own. Without the file, as in the main release, the step adds the main channel's footer
# only to a site with no channel's footer, and removes none. A test-channel package without it (CI
# dropped the file until 2026-11-05) put the main channel's footer next to the test channel's on
# the test hub's projects, then removed the test channel's.
$ChannelKnown = $null -ne $global:__CurrentChannelConfig

$CustomActions = Get-PnPCustomAction -Scope Web
$ChannelFooters = @($CustomActions | Where-Object { $ChannelFooterIds -contains "$($_.ClientSideComponentId)" })

$ExistingFooter = $CustomActions | Where-Object { $_.ClientSideComponentId -eq $ClientSideComponentId }
if ($null -ne $ExistingFooter) {
  Write-Host "`t`tThe site already has the footer extension" -ForegroundColor Green
}
elseif (-not $ChannelKnown -and $ChannelFooters.Count -gt 0) {
  Write-Host "`t`tThe site has the footer of another release channel, and the package names no channel: leaving it" -ForegroundColor Yellow
}
else {
  Write-Host "`t`tAdding footer extension to site"
  Add-PnPCustomAction -Title "Footer" -Name "Footer" -Location "ClientSideExtension.ApplicationCustomizer" -ClientSideComponentId $ClientSideComponentId -ClientSideComponentProperties "{}" -Scope Web >$null 2>&1
}

if ($ChannelKnown) {
  $OtherChannelFooters = $ChannelFooters | Where-Object { $_.ClientSideComponentId -ne $ClientSideComponentId }
  foreach ($Action in $OtherChannelFooters) {
    Write-Host "`t`tRemoving the footer of another release channel ($($Action.ClientSideComponentId))"
    Remove-PnPCustomAction -Identity $Action.Id -Scope Web -Force >$null 2>&1
  }
}

$LegacyHelpContent = $CustomActions | Where-Object { $_.ClientSideComponentId -eq $LegacyHelpContentComponentId }
foreach ($Action in $LegacyHelpContent) {
  Write-Host "`t`tRemoving legacy help content extension '$($Action.Title)' (replaced by the footer in 1.9.0)"
  Remove-PnPCustomAction -Identity $Action.Id -Scope Web -Force >$null 2>&1
}
