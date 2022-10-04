Param(
  [Parameter(Mandatory = $true, HelpMessage = "The url to the project portal portfolio site")]
  [string]$Url,
  [Parameter(Mandatory = $false, HelpMessage = "Use latest Schema version supported by mac")]
  [switch]$Mac
)

Connect-PnPOnline -Url $Url -Interactive -ErrorAction Stop
  
Write-Host "[INFO] In version v1.6.0 we reworked the aggregated webparts and removed the benefits webpart as this is now handled in the aggregated webpart. Updating pages to use the new aggregated webpart."

if ($Mac.IsPresent) {
  Write-Host "[INFO] Using latest schema version supported by mac"
  Invoke-PnPSiteTemplate "./pnpFiles/UpdatedAggregatedClientSidePages_mac.pnp" -ErrorAction Stop
} else {
  Invoke-PnPSiteTemplate "./pnpFiles/UpdatedAggregatedClientSidePages.pnp" -ErrorAction Stop
}
