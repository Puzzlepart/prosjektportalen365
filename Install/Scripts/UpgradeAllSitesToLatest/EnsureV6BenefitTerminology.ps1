<#
Prosjektveiviseren v6 (område C/K): oppdaterer visningsnavn fra gevinst- til
nytteterminologi på prosjektområdet.

Kjører KUN når UpgradeAllSitesToLatest.ps1 kalles med -GevinstTilNytte — uten bryteren
beholder prosjektområdene dagens terminologi (opt-in per installasjon).

Endrer bare visning: felt-DisplayName, listetitler og navigasjonstitler. Interne
feltnavn (StaticName/Name), liste-URL-er og listedata røres aldri. Hver omdøping er
vaktet på kjente standardtitler fra tidligere versjoner — har virksomheten selv
omdøpt et felt eller en liste, hoppes den over.
#>

if (-not $GevinstTilNytte.IsPresent) {
    return
}

Write-Host "`t`tEnsuring v6 benefit terminology (gevinst -> nytte) for site fields, lists and navigation"

# --- Feltvisningsnavn (web-nivå) -------------------------------------------------
$FieldRetitleMap = @(
    @{ InternalName = "GtGainsResponsible"; OldTitles = @("Gevinstansvarlig", "Gains responsible"); NewTitleResource = "SiteFields_GtGainsResponsible_DisplayName" },
    @{ InternalName = "GtGainsOwner"; OldTitles = @("Gevinsteier", "Gains owner"); NewTitleResource = "SiteFields_GtGainsOwner_DisplayName" },
    @{ InternalName = "GtGainsTurnover"; OldTitles = @("Gevinstomsetting", "Gain turnover"); NewTitleResource = "SiteFields_GtGainsTurnover_DisplayName" },
    @{ InternalName = "GtGainsType"; OldTitles = @("Gevinsttype", "Type of gain"); NewTitleResource = "SiteFields_GtGainsType_DisplayName" },
    @{ InternalName = "GtPrereqProfitAchievement"; OldTitles = @("Forutsetninger for gevinstoppnåelse", "Prerequisites for gain achievement"); NewTitleResource = "SiteFields_GtPrereqProfitAchievement_DisplayName" }
)
foreach ($Entry in $FieldRetitleMap) {
    try {
        $Field = Get-PnPField -Identity $Entry.InternalName -ErrorAction SilentlyContinue
        if ($null -eq $Field) { continue }
        $NewTitle = Get-Resource -Name $Entry.NewTitleResource
        if ($Field.Title -ne $NewTitle -and $Entry.OldTitles -contains $Field.Title) {
            Set-PnPField -Identity $Entry.InternalName -Values @{ Title = $NewTitle } -UpdateExistingLists >$null
            Write-Host "`t`t[SUCCESS] Field [$($Entry.InternalName)]: [$($Field.Title)] -> [$NewTitle]" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "`t`t[WARNING] Failed to retitle field [$($Entry.InternalName)]: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# --- Gevinstlistene: listetittel og listespesifikke felt --------------------------
# Listene identifiseres på URL (endres aldri); tittelen omdøpes kun fra kjent standard.
$BenefitsAnalysisUrl = ((Get-Resource -Name "Navigation_BenefitsAnalysis_Url") -replace "/AllItems\.aspx$", "")
$BenefitsFollowupUrl = ((Get-Resource -Name "Navigation_BenefitsFollowup_Url") -replace "/AllItems\.aspx$", "")

$ListRetitleMap = @(
    @{ Url = $BenefitsAnalysisUrl; OldTitles = @("Gevinstanalyse og gevinstrealiseringsplan", "Benefits analysis and realization plan"); NewTitleResource = "Lists_BenefitsAnalysis_Title" },
    @{ Url = $BenefitsFollowupUrl; OldTitles = @("Gevinstoppfølging", "Benefits follow-up", "Benefit Followup"); NewTitleResource = "Lists_BenefitsFollowup_Title" }
)
foreach ($Entry in $ListRetitleMap) {
    try {
        $List = Get-PnPList -Identity $Entry.Url -ErrorAction SilentlyContinue
        if ($null -eq $List) { continue }
        $NewTitle = Get-Resource -Name $Entry.NewTitleResource
        if ($List.Title -ne $NewTitle -and $Entry.OldTitles -contains $List.Title) {
            Set-PnPList -Identity $List.Id -Title $NewTitle >$null
            Write-Host "`t`t[SUCCESS] List at [$($Entry.Url)]: [$($List.Title)] -> [$NewTitle]" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "`t`t[WARNING] Failed to retitle list at [$($Entry.Url)]: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Tittelfeltet på gevinstanalyse-listen («Gevinst» -> «Nyttevirkning») og
# oppslagsfeltene på oppfølgingslisten.
$ListFieldRetitleMap = @(
    @{ ListUrl = $BenefitsAnalysisUrl; InternalName = "Title"; OldTitles = @("Gevinst", "Benefit"); NewTitleResource = "ListFields_Benefit_DisplayName" },
    @{ ListUrl = $BenefitsFollowupUrl; InternalName = "GtGainLookup"; OldTitles = @("Gevinst", "Gain"); NewTitleResource = "ListFields_GainLookup_DisplayName" },
    @{ ListUrl = $BenefitsFollowupUrl; InternalName = "GtGainLookup_ID"; OldTitles = @("Gevinst-ID", "Gain ID"); NewTitleResource = "ListFields_GainLookup_ID_DisplayName" }
)
foreach ($Entry in $ListFieldRetitleMap) {
    try {
        $List = Get-PnPList -Identity $Entry.ListUrl -ErrorAction SilentlyContinue
        if ($null -eq $List) { continue }
        $Field = Get-PnPField -List $List.Id -Identity $Entry.InternalName -ErrorAction SilentlyContinue
        if ($null -eq $Field) { continue }
        $NewTitle = Get-Resource -Name $Entry.NewTitleResource
        if ($Field.Title -ne $NewTitle -and $Entry.OldTitles -contains $Field.Title) {
            Set-PnPField -List $List.Id -Identity $Entry.InternalName -Values @{ Title = $NewTitle } >$null
            Write-Host "`t`t[SUCCESS] List field [$($Entry.InternalName)] at [$($Entry.ListUrl)]: [$($Field.Title)] -> [$NewTitle]" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "`t`t[WARNING] Failed to retitle list field [$($Entry.InternalName)]: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# --- Navigasjonstitler -------------------------------------------------------------
$NavRetitleMap = @(
    @{ OldTitles = @("Gevinstoversikt", "Benefits Overview"); NewTitleResource = "Navigation_BenefitsOverview_Title" },
    @{ OldTitles = @("Gevinstanalyse og gevinstrealiseringsplan", "Benefits Analysis and Realization Plan"); NewTitleResource = "Navigation_BenefitsAnalysis_Title" },
    @{ OldTitles = @("Gevinstoppfølging", "Benefits Followup", "Benefits follow-up"); NewTitleResource = "Navigation_BenefitsFollowup_Title" }
)
try {
    $NavNodes = @(Get-PnPNavigationNode -Location QuickLaunch -ErrorAction SilentlyContinue) + @(Get-PnPNavigationNode -Location TopNavigationBar -ErrorAction SilentlyContinue)
    foreach ($Node in $NavNodes) {
        if ($null -eq $Node) { continue }
        $Entry = $NavRetitleMap | Where-Object { $_.OldTitles -contains $Node.Title } | Select-Object -First 1
        if ($null -ne $Entry) {
            $NewTitle = Get-Resource -Name $Entry.NewTitleResource
            if ($Node.Title -ne $NewTitle) {
                Set-PnPNavigationNode -Identity $Node.Id -Title $NewTitle >$null
                Write-Host "`t`t[SUCCESS] Navigation node: [$($Node.Title)] -> [$NewTitle]" -ForegroundColor Green
            }
        }
    }
}
catch {
    Write-Host "`t`t[WARNING] Failed to retitle navigation nodes: $($_.Exception.Message)" -ForegroundColor Yellow
}
