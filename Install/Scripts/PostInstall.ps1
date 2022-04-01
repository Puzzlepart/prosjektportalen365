Set-PnPList -Identity Prosjektkolonnekonfigurasjon -EnableContentTypes:$false 
Set-PnPList -Identity Fasesjekkliste -EnableContentTypes:$false 
Set-PnPList -Identity Konfigurasjon -EnableContentTypes:$false 
Set-PnPList -Identity Porteføljevisninger -EnableContentTypes:$false 
Set-PnPList -Identity Prosjektkolonner -EnableContentTypes:$false 
Set-PnPList -Identity Ressursallokering -EnableContentTypes:$false 
Set-PnPList -Identity Planneroppgaver -EnableContentTypes:$false 

Write-Host "[INFO] Post-install action: Ensuring default project templates"
$TemplateSetups = Get-PnPListItem -List "Maloppsett"
$TemplateFiles = Get-PnPListItem -List "Prosjektmaler"

$TemplateSetup = $TemplateSetups | Where-Object { $_["Title"] -eq "Standardmal" }
$TemplateFile = $TemplateFiles | Where-Object { $_["FileLeafRef"] -eq "Standardmal.txt" }
if ($null -ne $TemplateFile -and $null -ne $TemplateSetup) {
    $TemplateSetup["GtProjectTemplate"] = $TemplateFile.ID
    $TemplateSetup.Update()
    $TemplateSetup.Context.ExecuteQuery()
}
else {
    Write-Host "[WARNING] Cannot find template Standardmal or template file Standardmal.txt. Ensure template associations manually in Lists/Maloppsett" -ForegroundColor Yellow
}

$TemplateSetup = $TemplateSetups | Where-Object { $_["Title"] -eq "Programmal" }
$TemplateFile = $TemplateFiles | Where-Object { $_["FileLeafRef"] -eq "Programmal.txt" }
if ($null -ne $TemplateFile -and $null -ne $TemplateSetup) {
    $TemplateSetup["GtProjectTemplate"] = $TemplateFile.ID
    $TemplateSetup.Update()
    $TemplateSetup.Context.ExecuteQuery()
}
else {
    Write-Host "[WARNING] Cannot find template Programmal or template file Programmal.txt. Ensure template associations manually in Lists/Maloppsett" -ForegroundColor Yellow
}

$TemplateSetup = $TemplateSetups | Where-Object { $_["Title"] -eq "Overordnet mal" }
$TemplateFile = $TemplateFiles | Where-Object { $_["FileLeafRef"] -eq "Overordnet.txt" }
if ($null -ne $TemplateFile -and $null -ne $TemplateSetup) {
    $TemplateSetup["GtProjectTemplate"] = $TemplateFile.ID
    $TemplateSetup.Update()
    $TemplateSetup.Context.ExecuteQuery()
}
else {
    Write-Host "[WARNING] Cannot find template Overordnet mal or template file Overordnet.txt. Ensure template associations manually in Lists/Maloppsett" -ForegroundColor Yellow
}
Write-Host "[SUCCESS] Post-install action: Ensured default project templates"