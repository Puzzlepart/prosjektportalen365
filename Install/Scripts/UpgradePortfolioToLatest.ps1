Param(
  [Parameter(Mandatory = $true, HelpMessage = "The url to the project portal portfolio site")]
  [string]$PortfolioUrl,
  [Parameter(Mandatory = $false, HelpMessage = "Use latest Schema version supported by mac")]
    [switch]$Mac
)

Connect-PnPOnline -Url $PortfolioUrl -Interactive -ErrorAction Stop
  
$LastInstall = Get-PnPListItem -List "Installasjonslogg" -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>" | Select-Object -First 1 -Wait
if ($null -ne $LastInstall) {
  $PreviousVersion = $LastInstall.FieldValues["InstallVersion"]
    
  if ($PreviousVersion -lt "1.7.0") {
    Write-Host "[INFO] In version v1.6.0 we reworked the aggregated webparts and removed the benefits webpart as this is now handled in the aggregated webpart. Updating pages to use the new aggregated webpart."
    if ($Mac.IsPresent) {
      Invoke-PnPSiteTemplate "pnpFiles\UpdatedAggregatedClientSidePages_mac.xml" -ErrorAction Stop
    }

    Invoke-PnPSiteTemplate "pnpFiles\UpdatedAggregatedClientSidePages.xml" -ErrorAction Stop
  }
}