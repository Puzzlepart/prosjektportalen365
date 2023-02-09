Write-Host "[INFO] Post-install action: Disabling content types for lists"
Set-PnPList -Identity Prosjektkolonnekonfigurasjon -EnableContentTypes:$false >$null 2>&1  
Set-PnPList -Identity Fasesjekkliste -EnableContentTypes:$false >$null 2>&1  
Set-PnPList -Identity Konfigurasjon -EnableContentTypes:$false >$null 2>&1  
Set-PnPList -Identity ([System.Uri]::UnescapeDataString('Portef%C3%B8ljevisninger')) -EnableContentTypes:$false >$null 2>&1  
Set-PnPList -Identity Prosjektkolonner -EnableContentTypes:$false >$null 2>&1  
Set-PnPList -Identity Ressursallokering -EnableContentTypes:$false >$null 2>&1  
Set-PnPList -Identity Planneroppgaver -EnableContentTypes:$false >$null 2>&1  
Write-Host "[SUCCESS] Post-install action: Disabling content types for lists" -ForegroundColor Green

Write-Host "[INFO] Post-install action: Ensuring default project templates"
$TemplateSetups = Get-PnPListItem -List "Maloppsett"
$TemplateFiles = Get-PnPListItem -List "Prosjektmaler"

$TemplatesMap = @{
    "Standardmal"    = "Standardmal.txt";
    "Programmal"     = "Programmal.txt";
    "Overordnet mal" = "Overordnet.txt";
}

foreach ($tmpl in $TemplatesMap.GetEnumerator()) {
    $TemplateSetup = $TemplateSetups | Where-Object { $_["Title"] -eq $tmpl.Name }
    $TemplateFileId = $TemplateFiles | Where-Object { $_["FileLeafRef"] -eq $tmpl.Value } | Select-Object -ExpandProperty Id
    if ($null -ne $TemplateFileId -and $null -ne $TemplateSetup) {
        $TemplateSetup["GtProjectTemplate"] = $TemplateFileId
        $TemplateSetup.SystemUpdate()
        $TemplateSetup.Context.ExecuteQuery()
    }
    else {
        Write-Host "[WARNING] Cannot find template $($tmpl.Name) or template file $($tmpl.Value). Ensure template associations manually in Lists/Maloppsett" -ForegroundColor Yellow
    }
}

Write-Host "[SUCCESS] Post-install action: Ensured default project templates" -ForegroundColor Green