<#
Applies a versioned PnP upgrade template (Templates/<version>.pnp). Skipped when
template application is turned off via -SkipTemplate — e.g. an [apps-only] release,
which is built with -SkipBuildPnPTemplates and therefore ships no .pnp templates.
Mirrors the main template gate in Install.ps1.
#>
function ApplyUpgradeTemplate([string]$Version) {
    if ($SkipTemplate.IsPresent) {
        Write-Host "[INFO] Skipping PnP upgrade template [$Version] (-SkipTemplate)" -ForegroundColor Yellow
        return
    }
    Write-Host "[INFO] Applying PnP upgrade template [$Version] to [$Url]"
    Invoke-PnPSiteTemplate -Path "$TemplatesBasePath/$Version.pnp" -ErrorAction Stop
    Write-Host "[SUCCESS] Successfully applied PnP template [$Version] to [$Url]" -ForegroundColor Green
}

$InstallationEntriesList = Get-PnPList -Identity (Get-Resource -Name "Lists_InstallationLog_Title") -ErrorAction Stop
$LastInstall = Get-PnPListItem -List $InstallationEntriesList.Id -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>" | Select-Object -First 1 -Wait
if ($null -ne $LastInstall) {
    $PreviousVersion = ParseVersionString -VersionString $LastInstall.FieldValues["InstallVersion"]

    if ($PreviousVersion -lt [version]"1.4.0") {
        $DeprecatedIds = @(
            "d8558017-1e3b-4d13-82fa-2520e845297b", 
            "3ec6bcaf-28bc-4f2e-9e90-77e8cebf0b5f", 
            "57530c94-4fb2-4ca2-9279-16c57881fa19"
        )

        $Pages = Get-PnPFolder -Url SitePages -Includes Files | Select-Object -ExpandProperty Files

        $Pages | ForEach-Object {
            $DeprecatedComponents = Get-PnPPageComponent -Page $_.Name | Where-Object { $DeprecatedIds.Contains($_.WebPartId) }
            if ($DeprecatedComponents.Count -gt 0) {
                Remove-PnPClientSidePage $_.Name -Force -ErrorAction SilentlyContinue
            }
        }
    }

    if ($PreviousVersion -lt [version]"1.5.0") {
        ApplyUpgradeTemplate "1.5.0"
    }
    
    if ($PreviousVersion -lt [version]"1.7.0") {
        $PnPClientSidePages = @(
            "Gevinstoversikt.aspx", 
            "Erfaringslogg.aspx", 
            "Leveranseoversikt.aspx", 
            "Risikooversikt.aspx"
        )

        $Pages = Get-PnPFolder -Url SitePages -Includes Files | Select-Object -ExpandProperty Files
        $Pages | ForEach-Object {
            if ($PnPClientSidePages.Contains($_.Name)) {
                Remove-PnPClientSidePage -Identity $_.Name -Force -ErrorAction SilentlyContinue
            }
        }
    }

    if ($PreviousVersion -lt [version]"1.8.2") {
        ApplyUpgradeTemplate "1.8.1"
    }

    if ($PreviousVersion -lt [version]"1.9.1") {
        Write-Host "[INFO] Removing deprecated SiteScripts"
        Remove-PnPSiteScript -Identity "IdeaProcessing - test" -Force -ErrorAction SilentlyContinue
        Remove-PnPSiteScript -Identity "IdeaProjectData - test" -Force -ErrorAction SilentlyContinue
        Remove-PnPSiteScript -Identity "IdeaRegistration - test" -Force -ErrorAction SilentlyContinue
        Remove-PnPSiteScript -Identity "IdeaProcessing" -Force -ErrorAction SilentlyContinue
        Remove-PnPSiteScript -Identity "IdeaProjectData" -Force -ErrorAction SilentlyContinue
        Remove-PnPSiteScript -Identity "IdeaRegistration" -Force -ErrorAction SilentlyContinue
        Write-Host "[SUCCESS] Successfully removed deprecated SiteScripts" -ForegroundColor Green
    }

    if ($PreviousVersion -lt [version]"1.10.0") {
        try {
            $Field = Get-PnPField -Identity "GtUNSustDevGoalsText" -List "Prosjekter" -Includes FieldTypeKind
            if ($null -ne $Field) {
                Write-Host "[INFO] Changing fieldtype of GtUNSustDevGoalsText"
                $Field.FieldTypeKind = [Microsoft.SharePoint.Client.FieldType]::Note
                $Field.Update()
                $Field.Context.ExecuteQuery()
            }
            
            $Field = Get-PnPField -Identity "GtUNSustDevGoalsText" -Includes FieldTypeKind
            if ($null -ne $Field) {
                $Field.FieldTypeKind = [Microsoft.SharePoint.Client.FieldType]::Note
                $Field.Update()
                $Field.Context.ExecuteQuery()
            }

        }
        catch {
            Write-Host "[ERROR] Failed to change fieldtype of GtUNSustDevGoalsText" -ForegroundColor Yellow
        }
    }
    
    if ($PreviousVersion -lt [version]"1.11.1") {
        try {
            $Field = Get-PnPField -Identity "InstallCommand" -List "Installasjonslogg" -Includes FieldTypeKind
            if ($null -ne $Field -and $Field.FieldTypeKind -eq [Microsoft.SharePoint.Client.FieldType]::Text) {
                Write-Host "[INFO] Changing fieldtype of Installasjonslogg/InstallCommand from Text to Note"
                $Field.FieldTypeKind = [Microsoft.SharePoint.Client.FieldType]::Note
                $Field.Update()
                $Field.Context.ExecuteQuery()
            }
        }
        catch {
            Write-Host "[ERROR] Failed to change fieldtype of InstallCommand" -ForegroundColor Yellow
        }        
    }

    if ($PreviousVersion -lt [version]"1.12.0") {
        ApplyUpgradeTemplate "1.12.0"
    }

    if ($PreviousVersion -lt [version]"1.13.0") {
        Write-Host "[INFO] Removing deprecated Portfolio Insights page, lists and navigation"

        # Remove Porteføljeinnsikt page
        try {
            Remove-PnPPage -Identity "Portefoljeinnsikt.aspx" -Force -ErrorAction SilentlyContinue
            Remove-PnPPage -Identity "PortfolioInsights.aspx" -Force -ErrorAction SilentlyContinue
            Write-Host "[SUCCESS] Removed Portfolio Insights page" -ForegroundColor Green
        }
        catch {
            Write-Host "[WARNING] Failed to remove Portfolio Insights page: $($_.Exception.Message)" -ForegroundColor Yellow
        }

        # Remove Grafkonfigurasjon list
        try {
            $ChartConfigList = Get-PnPList -Identity "Lists/Grafkonfigurasjon" -ErrorAction SilentlyContinue
            if ($null -eq $ChartConfigList) {
                $ChartConfigList = Get-PnPList -Identity "Lists/ChartConfiguration" -ErrorAction SilentlyContinue
            }
            if ($null -ne $ChartConfigList) {
                Remove-PnPList -Identity $ChartConfigList.Id -Force -ErrorAction Stop
                Write-Host "[SUCCESS] Removed Chart Configuration list" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "[WARNING] Failed to remove Chart Configuration list: $($_.Exception.Message)" -ForegroundColor Yellow
        }

        # Remove Egendefinerte diagrammer library
        try {
            $CustomChartsList = Get-PnPList -Identity "CustomCharts" -ErrorAction SilentlyContinue
            if ($null -ne $CustomChartsList) {
                Remove-PnPList -Identity $CustomChartsList.Id -Force -ErrorAction Stop
                Write-Host "[SUCCESS] Removed Custom Charts library" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "[WARNING] Failed to remove Custom Charts library: $($_.Exception.Message)" -ForegroundColor Yellow
        }

        # Remove navigation node
        try {
            $NavNodes = Get-PnPNavigationNode -Location TopNavigationBar -ErrorAction SilentlyContinue
            $InsightsNode = $NavNodes | Where-Object { $_.Url -like "*Portefoljeinnsikt*" -or $_.Url -like "*PortfolioInsights*" }
            if ($null -ne $InsightsNode) {
                Remove-PnPNavigationNode -Identity $InsightsNode.Id -Force -ErrorAction Stop
                Write-Host "[SUCCESS] Removed Portfolio Insights navigation node" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "[WARNING] Failed to remove Portfolio Insights navigation: $($_.Exception.Message)" -ForegroundColor Yellow
        }

        Write-Host "[INFO] Checking for RefinableString90-98 conflicts before upgrading to v1.13.0..."
        try {
            Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
            $SearchConfigXml = Get-PnPSearchConfiguration -Scope Subscription -ErrorAction Stop
            Connect-SharePoint -Url $Uri.AbsoluteUri -ConnectionInfo $ConnectionInfo

            $ExpectedMappings = @{
                "1000000090" = "ows_GtRiskFactor"
                "1000000091" = "ows_GtRiskFactorPostAction"
                "1000000092" = "ows_GtIdeaEconomicNumber"
                "1000000093" = "ows_GtIdeaPriority"
                "1000000094" = "ows_GtIdeaQualityNumber"
                "1000000095" = "ows_GtIdeaRiskNumber"
                "1000000096" = "ows_GtIdeaScore"
                "1000000097" = "ows_GtIdeaStrategicNumber"
                "1000000098" = "ows_GtIdeaOperationalNumber"
            }

            $RefinableStringNames = @{
                "1000000090" = "RefinableString90"
                "1000000091" = "RefinableString91"
                "1000000092" = "RefinableString92"
                "1000000093" = "RefinableString93"
                "1000000094" = "RefinableString94"
                "1000000095" = "RefinableString95"
                "1000000096" = "RefinableString96"
                "1000000097" = "RefinableString97"
                "1000000098" = "RefinableString98"
            }

            [xml]$SearchConfig = $SearchConfigXml
            $NsMgr = New-Object System.Xml.XmlNamespaceManager($SearchConfig.NameTable)
            $NsMgr.AddNamespace("d3p1", "http://schemas.datacontract.org/2004/07/Microsoft.Office.Server.Search.Administration")
            $NsMgr.AddNamespace("d4p1", "http://schemas.microsoft.com/2003/10/Serialization/Arrays")

            $MappingNodes = $SearchConfig.SelectNodes("//d3p1:CrawledPropertyName/..", $NsMgr)

            $ConflictDetails = @()
            foreach ($MappingNode in $MappingNodes) {
                $ManagedPid = $MappingNode.SelectSingleNode("d3p1:ManagedPid", $NsMgr).'#text'
                $CrawledPropertyName = $MappingNode.SelectSingleNode("d3p1:CrawledPropertyName", $NsMgr).'#text'

                if ($ExpectedMappings.ContainsKey($ManagedPid)) {
                    $ExpectedCrawledProp = $ExpectedMappings[$ManagedPid]
                    if ($CrawledPropertyName -ne $ExpectedCrawledProp) {
                        $ConflictDetails += [PSCustomObject]@{
                            RefinableString    = $RefinableStringNames[$ManagedPid]
                            CurrentMapping     = $CrawledPropertyName
                            ExpectedMapping    = $ExpectedCrawledProp
                        }
                    }
                }
            }

            if ($ConflictDetails.Count -gt 0) {
                Write-Host ""
                Write-Host "================================================================" -ForegroundColor Yellow
                Write-Host "WARNING: RefinableString Conflicts Detected" -ForegroundColor Yellow
                Write-Host "================================================================" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "Prosjektportalen 365 v1.13.0 requires RefinableString90-98." -ForegroundColor Yellow
                Write-Host "The following RefinableStrings are already mapped to other" -ForegroundColor Yellow
                Write-Host "crawled properties in your tenant:" -ForegroundColor Yellow
                Write-Host ""
                foreach ($Conflict in $ConflictDetails) {
                    Write-Host "  $($Conflict.RefinableString):" -ForegroundColor Yellow
                    Write-Host "    Currently mapped to : $($Conflict.CurrentMapping)" -ForegroundColor Yellow
                    Write-Host "    PP365 expects       : $($Conflict.ExpectedMapping)" -ForegroundColor Yellow
                }
                Write-Host ""
                Write-Host "These conflicts will NOT be resolved automatically." -ForegroundColor Red
                Write-Host "The installation will continue, but the conflicting managed" -ForegroundColor Yellow
                Write-Host "properties must be fixed MANUALLY after installation:" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "  1. Go to SharePoint Admin Center > Search > Manage Search Schema" -ForegroundColor White
                Write-Host "  2. Find the conflicting RefinableString properties listed above" -ForegroundColor White
                Write-Host "  3. Remap your custom crawled properties to other RefinableStrings" -ForegroundColor White
                Write-Host "  4. Ensure the PP365 crawled properties are correctly mapped" -ForegroundColor White
                Write-Host ""
                Write-Host "================================================================" -ForegroundColor Yellow
                Write-Host ""
            }
            else {
                Write-Host "[SUCCESS] No RefinableString90-98 conflicts detected." -ForegroundColor Green
            }
        }
        catch {
            Write-Host "[WARNING] Could not verify RefinableString availability: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "[WARNING] Proceeding with installation. If you experience search issues," -ForegroundColor Yellow
            Write-Host "[WARNING] please verify RefinableString90-98 mappings manually." -ForegroundColor Yellow
        }
    }

    # Prosjektveiviseren v6 (side om side): splitten under forutsetter at hovedmalen
    # provisjonerer v6-listene, og hoppes derfor over ved -SkipTemplate (apps-only
    # oppgradering). Installasjonsloggen bumpes uansett versjon, så behovet detekteres
    # på TILSTAND (v6-listen mangler) i tillegg til versjon — dermed fullfører en senere
    # full oppgradering migreringen selv om en apps-only-oppgradering kom først.
    $V6SplitPending = $null -eq (Get-PnPList -Identity (Get-Resource -Name "Lists_PhaseChecklistV6_Url") -ErrorAction SilentlyContinue)
    if ($SkipTemplate.IsPresent -and ($PreviousVersion -lt [version]"1.14.0" -or $V6SplitPending)) {
        Write-Host "[WARNING] Skipping the Prosjektveiviseren v6 content migration: -SkipTemplate is set and the migration depends on the main template provisioning the v6 lists. Run a full installation (with templates) to complete it." -ForegroundColor Yellow
    }
    if (-not $SkipTemplate.IsPresent -and ($PreviousVersion -lt [version]"1.14.0" -or $V6SplitPending)) {
        # Hub-listene «Fasesjekkliste» og «Planneroppgaver» MÅ døpes om til «… (tidligere)»
        # FØR hovedmalen kjører — malen oppretter nye v6-lister med de opprinnelige
        # visningsnavnene, og prosjektprovisjoneringen slår opp kildelisten på visningstittel
        # (ContentConfig getByTitle). Kun Title endres; URL-en består. Omdøpingen er vaktet
        # på kjente standardtitler — har virksomheten selv omdøpt listen, røres verken listen
        # eller dens Listeinnhold-rad.
        Write-Host "[INFO] Renaming hub lists to '(tidligere)' before provisioning the v6 lists"
        $ListContentList = Get-PnPList -Identity (Get-Resource -Name "Lists_ListContent_Title") -ErrorAction SilentlyContinue
        $ListContentRows = @()
        if ($null -ne $ListContentList) {
            $ListContentRows = Get-PnPListItem -List $ListContentList.Id
        }
        @(
            @{
                Url            = (Get-Resource -Name "Lists_PhaseChecklistLegacy_Url");
                StandardTitles = @("Fasesjekkliste", "Phase Checklist");
                LegacyTitle    = (Get-Resource -Name "Lists_PhaseChecklistLegacy_Title");
                RowTitle       = (Get-Resource -Name "Lists_ListContent_PhaseCheckpoints_Title");
                RowLegacyTitle = (Get-Resource -Name "Lists_ListContent_PhaseCheckpointsLegacy_Title");
                RowLegacyDesc  = (Get-Resource -Name "Lists_ListContent_PhaseCheckpointsLegacy_Description")
            },
            @{
                Url            = (Get-Resource -Name "Lists_PlannerTasksLegacy_Url");
                StandardTitles = @("Planneroppgaver", "Planner Tasks");
                LegacyTitle    = (Get-Resource -Name "Lists_PlannerTasksLegacy_Title");
                RowTitle       = (Get-Resource -Name "Lists_ListContent_PlannerTasks_Title");
                RowLegacyTitle = (Get-Resource -Name "Lists_ListContent_PlannerTasksLegacy_Title");
                RowLegacyDesc  = (Get-Resource -Name "Lists_ListContent_PlannerTasksLegacy_Description")
            }
        ) | ForEach-Object {
            $Config = $_
            $List = Get-PnPList -Identity $Config.Url -ErrorAction SilentlyContinue
            if ($null -eq $List) {
                Write-Host "[WARNING] List at [$($Config.Url)] was not found - skipping the v6 split for this list" -ForegroundColor Yellow
                return
            }
            $ReadyForRowUpdate = $false
            if ($List.Title -eq $Config.LegacyTitle) {
                # Allerede omdøpt (re-kjøring) — sørg for at raden også er oppdatert
                $ReadyForRowUpdate = $true
            }
            elseif ($Config.StandardTitles -contains $List.Title) {
                Set-PnPList -Identity $List.Id -Title $Config.LegacyTitle >$null
                Write-Host "[SUCCESS] Renamed list at [$($Config.Url)] to [$($Config.LegacyTitle)]" -ForegroundColor Green
                $ReadyForRowUpdate = $true
            }
            else {
                Write-Host "[WARNING] List at [$($Config.Url)] has a custom title [$($List.Title)] - leaving the list and its list content row untouched. NOTE: the v6 list content row [$($Config.RowTitle)] will not be provisioned (Listeinnhold is keyed on Title with Skip) until the existing row is renamed to [$($Config.RowLegacyTitle)] manually." -ForegroundColor Yellow
            }
            if ($ReadyForRowUpdate -and $null -ne $ListContentList) {
                # Oppdater Listeinnhold-raden PÅ PLASS (samme item-ID), slik at alle
                # Maloppsett-radenes ListContentConfigLookup (LookupMulti på ID) overlever
                # uendret. Raden får «(tidligere)»-tittel og peker på den omdøpte kilde-
                # listen. Hovedmalen legger deretter til ny v6-rad med den opprinnelige
                # radtittelen (KeyColumn=Title).
                $Row = $ListContentRows | Where-Object { $_["Title"] -eq $Config.RowTitle } | Select-Object -First 1
                if ($null -ne $Row) {
                    Set-PnPListItem -List $ListContentList.Id -Identity $Row.Id -Values @{
                        "Title"           = $Config.RowLegacyTitle;
                        "GtDescription"   = $Config.RowLegacyDesc;
                        "GtLccSourceList" = $Config.LegacyTitle
                    } -UpdateType SystemUpdate >$null
                    Write-Host "[SUCCESS] Retitled list content row [$($Config.RowTitle)] to [$($Config.RowLegacyTitle)] (id $($Row.Id))" -ForegroundColor Green
                }
            }
        }

        # Terminologi (gevinst → nytte): omdøp seksjons- og konfigurasjonsrader PÅ PLASS.
        # Statusseksjoner og Prosjektkolonnekonfigurasjon er nøklet på Title med Skip —
        # uten omdøping legger hovedmalen til DUPLIKATRADER med de nye titlene
        # (for Statusseksjoner betyr det at «Nytteoppnåelse»-seksjonen rendres dobbelt).
        # Vakt: raden omdøpes KUN når dagens tittel er standardverdien fra tidligere
        # versjoner — egne tilpasninger hos virksomheten røres aldri.
        Write-Host "[INFO] Retitling status section and column configuration rows (gevinst -> nytte, in place)"
        function RetitleRows([string]$ListResource, [scriptblock]$RowFilter, [hashtable[]]$RetitleMap) {
            $List = Get-PnPList -Identity (Get-Resource -Name $ListResource) -ErrorAction SilentlyContinue
            if ($null -eq $List) { return }
            $Rows = Get-PnPListItem -List $List.Id | Where-Object $RowFilter
            foreach ($Entry in $RetitleMap) {
                $NewTitle = Get-Resource -Name $Entry.NewTitleResource
                $Row = $Rows | Where-Object { $Entry.OldTitles -contains $_["Title"] } | Select-Object -First 1
                if ($null -ne $Row -and $Row["Title"] -ne $NewTitle) {
                    Set-PnPListItem -List $List.Id -Identity $Row.Id -Values @{ "Title" = $NewTitle } -UpdateType SystemUpdate >$null
                    Write-Host "[SUCCESS] Retitled [$($Row["Title"])] to [$NewTitle] in [$(Get-Resource -Name $ListResource)] (id $($Row.Id))" -ForegroundColor Green
                }
            }
        }

        RetitleRows "Lists_StatusSections_Title" { $_["GtSecFieldName"] -eq "GtStatusGainAchievement" } @(
            @{ OldTitles = @("Gevinstoppnåelse"); NewTitleResource = "Lists_StatusSections_StatusGainAchievement_Title" }
        )

        RetitleRows "Lists_ProjectColumnConfiguration_Title" { $true } @(
            @{ OldTitles = @("Status gevinstoppnåelse (Foran plan)"); NewTitleResource = "Lists_ProjectColumnConfiguration_GtStatusGainAchievement_AheadOfSchedule_Title" },
            @{ OldTitles = @("Status gevinstoppnåelse (Forsinket)"); NewTitleResource = "Lists_ProjectColumnConfiguration_GtStatusGainAchievement_BehindSchedule_Title" },
            @{ OldTitles = @("Status gevinstoppnåelse (Mindre forsinkelser)"); NewTitleResource = "Lists_ProjectColumnConfiguration_GtStatusGainAchievement_MinorDelays_Title" },
            @{ OldTitles = @("Status gevinstoppnåelse (Ikke påbegynt)"); NewTitleResource = "Lists_ProjectColumnConfiguration_GtStatusGainAchievement_NotStarted_Title" },
            @{ OldTitles = @("Status gevinstoppnåelse (På plan)"); NewTitleResource = "Lists_ProjectColumnConfiguration_GtStatusGainAchievement_OnSchedule_Title" }
        )

        # Prosjektkolonner er nøklet på GtInternalName (ingen duplikatrisiko), men radene
        # skippes ved reprovisjonering og ville ellers beholdt gamle visningstitler.
        RetitleRows "Lists_ProjectColumns_Title" { $true } @(
            @{ OldTitles = @("Gevinstansvarlig", "Gains responsible"); NewTitleResource = "SiteFields_GtGainsResponsible_DisplayName" },
            @{ OldTitles = @("Gevinsteier", "Gains owner"); NewTitleResource = "SiteFields_GtGainsOwner_DisplayName" },
            @{ OldTitles = @("Gevinstomsetting", "Gain turnover"); NewTitleResource = "SiteFields_GtGainsTurnover_DisplayName" },
            @{ OldTitles = @("Gevinsttype", "Type of gain"); NewTitleResource = "SiteFields_GtGainsType_DisplayName" },
            @{ OldTitles = @("Status gevinstoppnåelse", "Status gain achievement"); NewTitleResource = "SiteFields_GtStatusGainAchievement_DisplayName" },
            @{ OldTitles = @("Kommentar, gevinstoppnåelse", "Comment, gain achievement"); NewTitleResource = "SiteFields_GtStatusGainAchievementComment_DisplayName" }
        )
    }

    if ($PreviousVersion -lt [version]"1.14.0") {
        ApplyUpgradeTemplate "1.14.0"

        Write-Host "[INFO] Removing duplicate 'Konfigurasjon av Prosjektportalen' Site Settings links"
        Get-PnPCustomAction -Scope Web |
            Where-Object { $_.Location -eq "Microsoft.SharePoint.SiteSettings" -and
                           ($_.Title -eq "Konfigurasjon av Prosjektportalen" -or
                            $_.Title -eq "Configuration of Project Portal") } |
            ForEach-Object { Remove-PnPCustomAction -Identity $_.Id -Scope Web -Force -ErrorAction SilentlyContinue }
        Write-Host "[SUCCESS] Duplicate Site Settings links removed" -ForegroundColor Green
    }
}
