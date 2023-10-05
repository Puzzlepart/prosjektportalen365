$ClientSideComponentId = "28987406-2a67-48a8-9297-fd2833bf0a09"
if ($null -eq (Get-PnPCustomAction | Where-Object { $_.ClientSideComponentId -eq $ClientSideComponentId })) {
    Write-Host "`t`tAdding help content extension to site"
    Add-PnPCustomAction -Title "Hjelpeinnhold" -Name "Hjelpeinnhold" -Location "ClientSideExtension.ApplicationCustomizer" -ClientSideComponentId $ClientSideComponentId -ClientSideComponentProperties "{`"listName`":`"Hjelpeinnhold`",`"linkText`":`"Hjelp tilgjengelig`"}"  >$null 2>&1
}
else {
    Write-Host "`t`tThe site already has the help content extension" -ForegroundColor Green
}