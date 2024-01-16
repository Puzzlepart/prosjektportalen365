$TargetVersion = "1.9.0"

if ($global:__InstalledVersion -lt $TargetVersion) {
  $ClientSideComponentId = "84f27cec-ffde-4e00-a4cf-25c69f691054"
  if ($null -eq (Get-PnPCustomAction | Where-Object { $_.ClientSideComponentId -eq $ClientSideComponentId })) {
    Write-Host "`t`tAdding footer extension to site"
    Add-PnPCustomAction -Title "Footer" -Name "Footer" -Location "ClientSideExtension.ApplicationCustomizer" -ClientSideComponentId $ClientSideComponentId -ClientSideComponentProperties "{`"listName`":`"Hjelpeinnhold`",`"linkText`":`"Hjelp tilgjengelig`"}"  >$null 2>&1
  }
}
