Write-Host "[INFO] Post-install action: Restoring Idea calculated field formulas"
# The 5 *Number calc fields and GtIdeaScore ship with a placeholder formula =0 because SharePoint
# rejects formulas that reference list-level columns at FieldRef time on a freshly created list.
# Now that the list is fully provisioned, restore the real formulas. Source field titles are read
# at runtime so the same logic works for both no-NB and en-US.
function Get-IdeaFieldTitle {
    param([string]$InternalName)
    $Field = Get-PnPField -Identity $InternalName -ErrorAction SilentlyContinue
    if ($null -eq $Field) { return $null }
    return $Field.Title
}

$IdeaNumberFields = @(
    @{ Name = 'GtIdeaStrategicNumber';   SourceField = 'GtIdeaStrategicValue' },
    @{ Name = 'GtIdeaQualityNumber';     SourceField = 'GtIdeaQualityBenefit' },
    @{ Name = 'GtIdeaEconomicNumber';    SourceField = 'GtIdeaEconomicBenefit' },
    @{ Name = 'GtIdeaOperationalNumber'; SourceField = 'GtIdeaOperationalNeed' },
    @{ Name = 'GtIdeaRiskNumber';        SourceField = 'GtIdeaRisk' }
)
foreach ($Calc in $IdeaNumberFields) {
    $SourceTitle = Get-IdeaFieldTitle -InternalName $Calc.SourceField
    if ($null -eq $SourceTitle) {
        Write-Host "[WARNING] Source field $($Calc.SourceField) not found; skipping $($Calc.Name)" -ForegroundColor Yellow
        continue
    }
    $Formula = "=IF(ISBLANK([$SourceTitle]),0,LEFT([$SourceTitle],1))"
    try {
        Set-PnPField -Identity $Calc.Name -Values @{ Formula = $Formula } -UpdateExistingLists -ErrorAction Stop
    }
    catch {
        Write-Host "[WARNING] Failed to set formula on $($Calc.Name): $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

$ScoreOperands = @('GtIdeaQualityNumber', 'GtIdeaOperationalNumber', 'GtIdeaRiskNumber', 'GtIdeaStrategicNumber', 'GtIdeaEconomicNumber', 'GtIdeaManualScore')
$ScoreOperandTitles = $ScoreOperands | ForEach-Object { Get-IdeaFieldTitle -InternalName $_ }
if ($ScoreOperandTitles -notcontains $null) {
    $ScoreFormula = '=' + (($ScoreOperandTitles | ForEach-Object { "[$_]" }) -join '+')
    try {
        Set-PnPField -Identity 'GtIdeaScore' -Values @{ Formula = $ScoreFormula } -UpdateExistingLists -ErrorAction Stop
    }
    catch {
        Write-Host "[WARNING] Failed to set formula on GtIdeaScore: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
else {
    Write-Host "[WARNING] One or more GtIdeaScore source fields not found; skipping GtIdeaScore" -ForegroundColor Yellow
}

# GtIdeaPriority labels keep the leading Unicode space character that SharePoint sorts on.
$ScoreTitle = Get-IdeaFieldTitle -InternalName 'GtIdeaScore'
if ($null -ne $ScoreTitle) {
    $PriorityFormula = "=IF([$ScoreTitle]>22,`"$([char]0x2000)Må ha`",IF([$ScoreTitle]>16,`"$([char]0x2001)Bør ha`",IF([$ScoreTitle]>8,`"$([char]0x2002)Kan ha`",IF([$ScoreTitle]=0,`"$([char]0x2006)Ikke satt`",IF([$ScoreTitle]<9,`"$([char]0x2003)Skal ikke ha`")))))"
    try {
        Set-PnPField -Identity 'GtIdeaPriority' -Values @{ Formula = $PriorityFormula } -UpdateExistingLists -ErrorAction Stop
    }
    catch {
        Write-Host "[WARNING] Failed to set formula on GtIdeaPriority: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
else {
    Write-Host "[WARNING] GtIdeaScore field not found; skipping GtIdeaPriority" -ForegroundColor Yellow
}

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