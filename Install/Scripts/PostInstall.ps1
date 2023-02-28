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
Write-Host "[INFO] Post-install action: Adding list content to template setup"

$TemplateSetupMap = @{
    "Bygg"     = "Byggprosjekt";
    "Anlegg"   = "Anleggsprosjekt";
    "Standard" = "Standardmal"
}

$ListContentMap = @{
    "FasesjekkStandard" = "Fasesjekkpunkter";
    "PlannerStandard"   = "Planneroppgaver";
    "FasesjekkBygg"     = "Fasesjekkliste Bygg";
    "PlannerBygg"       = "Planneroppgaver Bygg";
    "DokumentBygg"      = "Standarddokumenter Bygg";
    "FasesjekkAnlegg"   = "Fasesjekkliste Anlegg";
    "PlannerAnlegg"     = "Planneroppgaver Anlegg";
    "DokumentAnlegg"    = "Standarddokumenter Anlegg";
}

$ListContent = Get-PnPListItem -List Listeinnhold
$TemplateOptions = Get-PnPListItem -List Maloppsett

$Standard = $TemplateOptions | Where-Object { $_["Title"] -eq $TemplateSetupMap["Standard"] }
if ($Standard) {
    $StandardPlanner = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["PlannerStandard"] }
    $StandardPhaseChecklist = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["FasesjekkStandard"] }

    $StandardItems = @()
    $StandardItems += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $StandardPlanner.Id }
    $StandardItems += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $StandardPhaseChecklist.Id }

    $Standard["ListContentConfigLookup"] = $StandardItems
    $Standard.SystemUpdate()
    $Standard.Context.ExecuteQuery()
}
else {
    Write-Host "[WARNING] Failed to find Standardmal template. Please check the Maloppsett list." -ForegroundColor Yellow
}
$Bygg = $TemplateOptions | Where-Object { $_["Title"] -eq $TemplateSetupMap["Bygg"] }
if ($Bygg) {
    $ByggPlanner = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["PlannerBygg"] }
    $ByggPhaseChecklist = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["FasesjekkBygg"] }
    $ByggDocuments = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["DokumentBygg"] }
    $ByggItems = @()
    $ByggItems += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $ByggPlanner.Id }
    $ByggItems += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $ByggPhaseChecklist.Id }
    $ByggItems += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $ByggDocuments.Id }
    $Bygg["ListContentConfigLookup"] = $ByggItems
    $Bygg.SystemUpdate()
    $Bygg.Context.ExecuteQuery()
}
else {
    Write-Host "[WARNING] Failed to find Byggprosjekt template. Please check the Maloppsett list." -ForegroundColor Yellow
}
$Anlegg = $TemplateOptions | Where-Object { $_["Title"] -eq $TemplateSetupMap["Anlegg"] }
if ($Anlegg) {
    $AnleggPlanner = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["PlannerAnlegg"] }
    $AnleggPhaseChecklist = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["FasesjekkAnlegg"] }
    $AnleggDocuments = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["DokumentAnlegg"] }     
    $AnleggItems = @()
    $AnleggItems += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $AnleggPlanner.Id }
    $AnleggItems += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $AnleggPhaseChecklist.Id }
    $AnleggItems += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $AnleggDocuments.Id }
    $Anlegg["ListContentConfigLookup"] = $AnleggItems
    $Anlegg.SystemUpdate()
    $Anlegg.Context.ExecuteQuery()
}
else {
    Write-Host "[WARNING] Failed to find Anleggsprosjekt template. Please check the Maloppsett list." -ForegroundColor Yellow
}
