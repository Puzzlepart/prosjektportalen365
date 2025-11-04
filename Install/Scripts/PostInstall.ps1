Write-Host "[INFO] Post-install action: Disabling content types for lists"
Set-PnPList -Identity (Get-Resource -Name "Lists_ProjectColumnConfiguration_Title") -EnableContentTypes:$false >$null 2>&1  
Set-PnPList -Identity (Get-Resource -Name "Lists_PhaseChecklist_Title") -EnableContentTypes:$false >$null 2>&1  
Set-PnPList -Identity (Get-Resource -Name "Lists_Configuration_Title") -EnableContentTypes:$false >$null 2>&1  
Set-PnPList -Identity (Get-Resource -Name "Lists_PortfolioViews_Title") -EnableContentTypes:$false >$null 2>&1  
Set-PnPList -Identity (Get-Resource -Name "Lists_ProjectColumns_Title") -EnableContentTypes:$false >$null 2>&1  
Set-PnPList -Identity (Get-Resource -Name "Lists_ResourceAllocation_Title") -EnableContentTypes:$false >$null 2>&1  
Set-PnPList -Identity (Get-Resource -Name "Lists_PlannerTasks_Title") -EnableContentTypes:$false >$null 2>&1

Write-Host "[INFO] Post-install action: Ensuring default project templates"
$TemplateSetups = Get-PnPListItem -List (Get-Resource -Name "Lists_TemplateOptions_Title")
$TemplateFiles = Get-PnPListItem -List (Get-Resource -Name "Lists_ProjectTemplates_Title")
$TemplateFilesMap = @{
    (Get-Resource -Name "Lists_TemplateOptions_StandardTemplate_Title")     = (Get-Resource -Name "Lists_TemplateOptions_StandardTemplate_FileName");
    (Get-Resource -Name "Lists_TemplateOptions_ProgramTemplate_Title")      = (Get-Resource -Name "Lists_TemplateOptions_ProgramTemplate_FileName");
    (Get-Resource -Name "Lists_TemplateOptions_ParentTemplate_Title")       = (Get-Resource -Name "Lists_TemplateOptions_ParentTemplate_FileName");
}

foreach ($tmpl in $TemplateFilesMap.GetEnumerator()) {
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

Write-Host "[INFO] Post-install action: Adding default list content to template setup"

$TemplateSetupMap = @{
    "Standard" = (Get-Resource -Name "Lists_TemplateOptions_StandardTemplate_Title");
    "Bygg"     = (Get-Resource -Name "Lists_TemplateOptions_BuildingProject_Title");
    "Anlegg"   = (Get-Resource -Name "Lists_TemplateOptions_ConstructionProject_Title");
}

$ListContentMap = @{
    "FasesjekkStandard" = (Get-Resource -Name "Lists_ListContent_PhaseCheckpoints_Title");
    "FasesjekkBygg"     = (Get-Resource -Name "Lists_ListContent_PhaseChecklistBuilding_Title");
    "FasesjekkAnlegg"   = (Get-Resource -Name "Lists_ListContent_PhaseChecklistConstruction_Title");
    "PlannerStandard"   = (Get-Resource -Name "Lists_ListContent_PlannerTasks_Title");
    "PlannerBygg"       = (Get-Resource -Name "Lists_ListContent_PlannerTasksBuilding_Title");
    "PlannerAnlegg"     = (Get-Resource -Name "Lists_ListContent_PlannerTasksConstruction_Title");
    "DokumentBygg"      = (Get-Resource -Name "Lists_ListContent_StandardDocumentsBuilding_Title");
    "DokumentAnlegg"    = (Get-Resource -Name "Lists_ListContent_StandardDocsConstruction_Title");
}

$ListContent = Get-PnPListItem -List (Get-Resource -Name "Lists_ListContent_Title")
$TemplateOptions = Get-PnPListItem -List (Get-Resource -Name "Lists_TemplateOptions_Title")


$DefaultExists = $TemplateOptions | Where-Object { $_["IsDefaultTemplate"] -eq $True }


$Standard = $TemplateOptions | Where-Object { $_["Title"] -eq $TemplateSetupMap["Standard"] }
if ($Standard) {
    $StandardPlanner = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["PlannerStandard"] }
    $StandardPhaseChecklist = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["FasesjekkStandard"] }

    $StandardItems = @()
    $StandardItems += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $StandardPlanner.Id }
    $StandardItems += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $StandardPhaseChecklist.Id }

    if ($null -eq $DefaultExists) {
        $Standard["IsDefaultTemplate"] = $True
    }
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