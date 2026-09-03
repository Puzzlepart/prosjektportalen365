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
# Listene «Fasesjekkliste» (Lists/Fasesjekkliste) og «Planneroppgaver» (Lists/Planneroppgaver)
# finnes KUN i oppgraderte miljøer - v6-splitten døper dem om til «... (tidligere)», men
# nyinstallasjoner provisjonerer bare v6-listene. Install.ps1 setter $ErrorActionPreference =
# "Stop", og PostInstall.ps1 dot-sources inn i den scopen: et manglende liste-oppslag ble derfor
# en terminerende feil som avbrøt HELE PostInstall ved nyinstallasjon - inkludert IsDefaultTemplate
# og koblingen av listeinnhold til Standardmal lenger ned. Stream-omdirigering ($null 2>&1) stopper
# ikke den konverteringen, så hvert kall må vaktes eksplisitt.
function Disable-ListContentTypes {
    param([string]$Identity)
    if ([string]::IsNullOrWhiteSpace($Identity)) { return }
    try {
        $List = Get-PnPList -Identity $Identity -ErrorAction SilentlyContinue
        if ($null -eq $List) { return }
        Set-PnPList -Identity $List.Id -EnableContentTypes:$false -ErrorAction Stop >$null
    }
    catch {
        Write-Host "[WARNING] Failed to disable content types for [$Identity]: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
@(
    (Get-Resource -Name "Lists_ProjectColumnConfiguration_Title"),
    (Get-Resource -Name "Lists_PhaseChecklistLegacy_Url"),
    (Get-Resource -Name "Lists_PhaseChecklistV6_Url"),
    (Get-Resource -Name "Lists_Configuration_Title"),
    (Get-Resource -Name "Lists_PortfolioViews_Title"),
    (Get-Resource -Name "Lists_ProjectColumns_Title"),
    (Get-Resource -Name "Lists_ResourceAllocation_Title"),
    (Get-Resource -Name "Lists_PlannerTasksLegacy_Url"),
    (Get-Resource -Name "Lists_PlannerTasksV6_Url")
) | ForEach-Object { Disable-ListContentTypes -Identity $_ }

Write-Host "[INFO] Post-install action: Ensuring project column configuration for v6 status fields"
# Fargekonfigurasjonen for de nye statusfeltene (område G) seedes også statisk i
# Prosjektkolonnekonfigurasjon.xml, men med hardkodede lookup-ID-er (43/45) som kun
# stemmer for nyinstallasjoner. GtPortfolioColumn er en lookup mot Prosjektkolonner
# på item-ID, og ID-ene varierer mellom installasjoner. Dette steget sikrer derfor
# radene med oppslag på GtInternalName ved kjøring, slik at oppgraderte miljøer får
# riktige rader. Idempotent — eksisterende rader røres ikke.
$ProjectColumnsItems = Get-PnPListItem -List (Get-Resource -Name "Lists_ProjectColumns_Title")
$ColumnConfigList = Get-Resource -Name "Lists_ProjectColumnConfiguration_Title"
$ColumnConfigItems = Get-PnPListItem -List $ColumnConfigList
$V6StatusColumnConfig = @(
    @{ Field = "GtStatusScope"; Choice = "Choice_GtStatusScope_AsPlanned"; TitleResource = "Lists_ProjectColumnConfiguration_GtStatusScope_AsPlanned_Title"; Color = "#2da748" },
    @{ Field = "GtStatusScope"; Choice = "Choice_GtStatusScope_MinorChanges"; TitleResource = "Lists_ProjectColumnConfiguration_GtStatusScope_MinorChanges_Title"; Color = "#e9b359" },
    @{ Field = "GtStatusScope"; Choice = "Choice_GtStatusScope_MajorChanges"; TitleResource = "Lists_ProjectColumnConfiguration_GtStatusScope_MajorChanges_Title"; Color = "#ea5c73" },
    @{ Field = "GtStatusSustainability"; Choice = "Choice_GtStatusSustainability_AsPlanned"; TitleResource = "Lists_ProjectColumnConfiguration_GtStatusSustainability_AsPlanned_Title"; Color = "#2da748" },
    @{ Field = "GtStatusSustainability"; Choice = "Choice_GtStatusSustainability_MinorDeviation"; TitleResource = "Lists_ProjectColumnConfiguration_GtStatusSustainability_MinorDeviation_Title"; Color = "#e9b359" },
    @{ Field = "GtStatusSustainability"; Choice = "Choice_GtStatusSustainability_MajorDeviation"; TitleResource = "Lists_ProjectColumnConfiguration_GtStatusSustainability_MajorDeviation_Title"; Color = "#ea5c73" }
)
foreach ($Config in $V6StatusColumnConfig) {
    $Column = $ProjectColumnsItems | Where-Object { $_["GtInternalName"] -eq $Config.Field } | Select-Object -First 1
    if ($null -eq $Column) {
        Write-Host "[WARNING] Project column with internal name [$($Config.Field)] not found - skipping column configuration" -ForegroundColor Yellow
        continue
    }
    $Value = Get-Resource -Name $Config.Choice
    $Exists = $ColumnConfigItems | Where-Object { $null -ne $_["GtPortfolioColumn"] -and $_["GtPortfolioColumn"].LookupId -eq $Column.Id -and $_["GtPortfolioColumnValue"] -eq $Value }
    if ($null -eq $Exists) {
        Add-PnPListItem -List $ColumnConfigList -Values @{
            "Title"                      = (Get-Resource -Name $Config.TitleResource);
            "GtPortfolioColumn"          = $Column.Id;
            "GtPortfolioColumnValue"     = $Value;
            "GtPortfolioColumnColor"     = $Config.Color;
            "GtPortfolioColumnIconName"  = "CircleFill"
        } | Out-Null
        Write-Host "[SUCCESS] Added column configuration [$Value] for [$($Config.Field)] (column id $($Column.Id))" -ForegroundColor Green
    }
}

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
}

$ListContentMap = @{
    "FasesjekkStandard" = (Get-Resource -Name "Lists_ListContent_PhaseCheckpoints_Title");
    "PlannerStandard"   = (Get-Resource -Name "Lists_ListContent_PlannerTasks_Title");
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
    # Koble listeinnhold KUN når feltet er tomt (ren installasjon). Ved oppgradering skal
    # virksomhetens eksisterende valg stå urørt — radtitlene i $ListContentMap peker nå på
    # v6-generasjonen, og en re-kobling ville stille byttet innholdssett for Standardmal.
    $ExistingLookup = $Standard["ListContentConfigLookup"]
    if ($null -eq $ExistingLookup -or $ExistingLookup.Count -eq 0) {
        $Standard["ListContentConfigLookup"] = $StandardItems
    }
    else {
        Write-Host "[INFO] Standardmal already has list content configured - leaving existing selection untouched"
    }
    $Standard.SystemUpdate()
    $Standard.Context.ExecuteQuery()
}
else {
    Write-Host "[WARNING] Failed to find Standardmal template. Please check the Maloppsett list." -ForegroundColor Yellow
}