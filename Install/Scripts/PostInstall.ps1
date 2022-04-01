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

$TemplatesAndPages = @{
    "Standardmal" = "Standardmal.txt";
    "Programmal" = "Programmal.txt";
    "Overordnet mal" = "Overordnet.txt";
}

$TemplatesAndPages.Keys | ForEach-Object {
    $TemplateSetup = $TemplateSetups | Where-Object { $_["Title"] -eq $_ }
    $TemplateFile = $TemplateFiles | Where-Object { $_["FileLeafRef"] -eq $TemplatesAndPages[$_] }
    if ($null -ne $TemplateFile -and $null -ne $TemplateSetup) {
        $TemplateSetup["GtProjectTemplate"] = $TemplateFile.ID
        $TemplateSetup.Update()
        $TemplateSetup.Context.ExecuteQuery()
    }
    else {
        Write-Host "[WARNING] Cannot find template $_ or template file $($TemplatesAndPages[$_]). Ensure template associations manually in Lists/Maloppsett" -ForegroundColor Yellow
    }
}

Write-Host "[SUCCESS] Post-install action: Ensured default project templates"