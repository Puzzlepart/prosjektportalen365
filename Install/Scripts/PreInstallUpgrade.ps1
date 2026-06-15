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
        Write-Host "[INFO] Applying PnP upgrade template [1.5.0] to [$Url]"
        Invoke-PnPSiteTemplate -Path "$TemplatesBasePath/1.5.0.pnp" -ErrorAction Stop
        Write-Host "[SUCCESS] Successfully applied PnP template [1.5.0] to [$Url]" -ForegroundColor Green
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

    if ($PreviousVersion -lt [version]"1.8.2" -or $PreviousVersion -like "*BA*") {
        Write-Host "[INFO] In version v1.8.0 we have integrated the 'Bygg & Anlegg' addon with standard installation. Checking to see if addon has been previously installed..." 

        $TermSetA = Get-PnPTermSet -Identity "cc6cdd18-c7d5-42e1-8d19-a336dd78f3f2" -TermGroup "Prosjektportalen" -ErrorAction SilentlyContinue
        $TermSetB = Get-PnPTermSet -Identity "ec5ceb95-7259-4282-811f-7c57304be71e" -TermGroup "Prosjektportalen" -ErrorAction SilentlyContinue
        if ($TermSetA -or $TermSetB) {
            Write-Host "[INFO] 'Bygg & Anlegg' addon detected. Renaming old contenttypes to avoid conflicts and confusion..." 

            $ProjectStatusBACT = Get-PnPContentType -Identity "Prosjektstatus (Bygg og anlegg)" -ErrorAction SilentlyContinue
            if ($ProjectStatusBACT) {
                $ProjectStatusList = Get-PnPList -Identity "Prosjektstatus" -ErrorAction SilentlyContinue
                if ($null -ne $ProjectStatusList) {
                    $ProjectStatusListBACT = Get-PnPContentType -Identity "Prosjektstatus (Bygg og anlegg)" -List $ProjectStatusList -ErrorAction SilentlyContinue
                    if ($null -ne $ProjectStatusListBACT) {
                        $ContentTypeOut = Set-PnPContentType -Identity $ProjectStatusListBACT -Name "Prosjektstatus (Bygg og anlegg) - UTDATERT"
                    }
                }
                $ContentTypeOut = Set-PnPContentType -Identity $ProjectStatusBACT -Name "Prosjektstatus (Bygg og anlegg) - UTDATERT" -UpdateChildren
            }

            $ProjectBACT = Get-PnPContentType -Identity "Prosjekt (Bygg og anlegg)" -ErrorAction SilentlyContinue
            if ($ProjectBACT) {
                $ProjectList = Get-PnPList -Identity "Prosjekter" -ErrorAction SilentlyContinue
                if ($null -ne $ProjectList) {
                    $ProjectListBACT = Get-PnPContentType -Identity "Prosjekt (Bygg og anlegg)" -List $ProjectList -ErrorAction SilentlyContinue
                    if ($null -ne $ProjectListBACT) {
                        $ContentTypeOut = Set-PnPContentType -Identity $ProjectListBACT -Name "Prosjekt (Bygg og anlegg) - UTDATERT"
                    }
                }
                $ContentTypeOut = Set-PnPContentType -Identity $ProjectBACT -Name "Prosjekt (Bygg og anlegg) - UTDATERT" -UpdateChildren
            }
            
            Write-Host "[SUCCESS] 'Bygg & Anlegg' contenttypes re-named" -ForegroundColor Green
        }
    }

    if ($PreviousVersion -lt [version]"1.8.2") {
        Write-Host "[INFO] Applying PnP upgrade template [$TemplatesBasePath/1.8.1.pnp] to [$Url]"
        Invoke-PnPSiteTemplate -Path "$TemplatesBasePath/1.8.1.pnp" -ErrorAction Stop
        Write-Host "[SUCCESS] Successfully applied PnP template [1.8.1] to [$Url]" -ForegroundColor Green
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
        Write-Host "[INFO] Applying PnP upgrade template [1.12.0] to [$Url]"
        Invoke-PnPSiteTemplate -Path "$TemplatesBasePath/1.12.0.pnp" -ErrorAction Stop
        Write-Host "[SUCCESS] Successfully applied PnP template [1.12.0] to [$Url]" -ForegroundColor Green
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

    if ($PreviousVersion -lt [version]"1.14.0") {
        Write-Host "[INFO] Applying PnP upgrade template [1.14.0] to [$Url]"
        Invoke-PnPSiteTemplate -Path "$TemplatesBasePath/1.14.0.pnp" -ErrorAction Stop
        Write-Host "[SUCCESS] Successfully applied PnP template [1.14.0] to [$Url]" -ForegroundColor Green

        Write-Host "[INFO] Removing duplicate 'Konfigurasjon av Prosjektportalen' Site Settings links"
        Get-PnPCustomAction -Scope Web |
            Where-Object { $_.Location -eq "Microsoft.SharePoint.SiteSettings" -and
                           ($_.Title -eq "Konfigurasjon av Prosjektportalen" -or
                            $_.Title -eq "Configuration of Project Portal") } |
            ForEach-Object { Remove-PnPCustomAction -Identity $_.Id -Scope Web -Force -ErrorAction SilentlyContinue }
        Write-Host "[SUCCESS] Duplicate Site Settings links removed" -ForegroundColor Green
    }
}
