
$LastInstall = Get-PnPListItem -List "Installasjonslogg" -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>" | Select-Object -First 1 -Wait
if ($null -ne $LastInstall) {
    $PreviousVersion = $LastInstall.FieldValues["InstallVersion"]

    if ($PreviousVersion -lt "1.6.0") {
        Write-Host "[INFO] In version v1.6.0 we added Project timeline configuration and reworked the TimelineContent list. Merging data now as part of the upgrade"

        $Items = Get-PnPListItem -List "Tidslinjeinnhold"
        $Milestone = [Uri]::UnescapeDataString("Milep%C3%A6l")
        foreach ($Item in $Items) {
            $OldSiteId = $Item.FieldValues["SiteIdLookup"].LookupId
            $OldType = $Item.FieldValues["TimelineType"]

            if ($null -ne $OldSiteId) {
                $Item["GtSiteIdLookup"] = $OldSiteId
            }
            
            if ($null -ne $OldType) {
                Switch ($OldType) {
                    "Prosjekt" { $Item["GtTimelineTypeLookup"] = 1 }
                    "Fase" { $Item["GtTimelineTypeLookup"] = 2 }
                    "Delfase" { $Item["GtTimelineTypeLookup"] = 3 }
                    $Milestone { $Item["GtTimelineTypeLookup"] = 4 }
                }
            }
            
            $Item.Update()
            Invoke-PnPQuery
        }

        Remove-PnPField -List "Tidslinjeinnhold" -Identity "SiteIdLookup" -Force -ErrorAction SilentlyContinue
        Remove-PnPField -List "Tidslinjeinnhold" -Identity "TimelineType" -Force -ErrorAction SilentlyContinue
        Invoke-PnPQuery
    }

    if ($PreviousVersion -lt "1.7.0") {
        Write-Host "[INFO] In version v1.7.0 we reworked the aggregated webparts. Adding these navigation items now as part of the upgrade" 
        Add-PnPNavigationNode -Location TopNavigationBar -Title "Gevinstoversikt" -Url "$($Uri.LocalPath)/SitePages/Gevinstoversikt.aspx"
        Add-PnPNavigationNode -Location TopNavigationBar -Title "Erfaringslogg" -Url "$($Uri.LocalPath)/SitePages/Erfaringslogg.aspx"
        Add-PnPNavigationNode -Location TopNavigationBar -Title "Leveranseoversikt" -Url "$($Uri.LocalPath)/SitePages/Leveranseoversikt.aspx"
        Add-PnPNavigationNode -Location TopNavigationBar -Title "Usikkerhetsoversikt" -Url "$($Uri.LocalPath)/SitePages/Usikkerhetsoversikt.aspx"
        Write-Host "[SUCCESS] Please adjust navigation order manually"
    }

    if ($PreviousVersion -lt "1.8.0" -or $PreviousVersion -like "*BA*") {
        Write-Host "[INFO] In version v1.8.0 we have integrated the 'Bygg & Anlegg' addon with standard installation. Checking to see if addon has been previously installed..." 

        $TermSetA = Get-PnPTermSet -Identity "cc6cdd18-c7d5-42e1-8d19-a336dd78f3f2" -TermGroup "Prosjektportalen" -ErrorAction SilentlyContinue
        $TermSetB = Get-PnPTermSet -Identity "ec5ceb95-7259-4282-811f-7c57304be71e" -TermGroup "Prosjektportalen" -ErrorAction SilentlyContinue
        if ($TermSetA -or $TermSetB) {
            Write-Host "[INFO] 'Bygg & Anlegg' addon detected. Setting up list content for 'Bygg & Anlegg' templates..." 

            # If Either Bygg or Anlegg changes title in the list, rename these.
            $TemplateMap = @{
                "Bygg"   = "Byggprosjekt";
                "Anlegg" = "Anleggsprosjekt"
            }

            # If any of the titles are changed, change here.
            $ListContentMap = @{
                "FasesjekkBygg"   = "Fasesjekkliste Bygg";
                "PlannerBygg"     = "Planneroppgaver Bygg";
                "DokumentBygg"    = "Standarddokumenter Bygg";
                "FasesjekkAnlegg" = "Fasesjekkliste Anlegg";
                "PlannerAnlegg"   = "Planneroppgaver Anlegg";
                "DokumentAnlegg"  = "Standarddokumenter Anlegg";
            }

            $ListContent = Get-PnPListItem -List Listeinnhold
            $TemplateOptions = Get-PnPListItem -List Maloppsett

            $Bygg = $TemplateOptions | Where-Object { $_["Title"] -eq $TemplateMap["Bygg"] }
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
            $Anlegg = $TemplateOptions | Where-Object { $_["Title"] -eq $TemplateMap["Anlegg"] }
            if ($Anlegg) {
                $AnleggPlanner = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["PlannerAnlegg"] }
                $AnleggPhaseChecklist = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["FasesjekkAnlegg"] }
                $AnleggDocuments = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["DokumentAnlegg"] }     

                # Adds Standard List Content to B&A template options
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
            
        }
    }
}
