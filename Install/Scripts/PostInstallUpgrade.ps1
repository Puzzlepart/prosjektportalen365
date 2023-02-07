
$LastInstall = Get-PnPListItem -List "Installasjonslogg" -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>" | Select-Object -First 1 -Wait
if ($null -ne $LastInstall) {
    $PreviousVersion = $LastInstall.FieldValues["InstallVersion"]

    if ($PreviousVersion -lt "1.2.7") {
        Write-Host "[INFO] In version v1.2.7 we added 'Prosjekttidslinje' to the top navigation. Adding this navigation item now as part of the upgrade" 
        Add-PnPNavigationNode -Location TopNavigationBar -Title "Prosjekttidslinje" -Url "$($Uri.LocalPath)/SitePages/Prosjekttidslinje.aspx"
    }
    if ($PreviousVersion -lt "1.5.0") {
        Write-Host "[INFO] Applying PnP upgrade template [1.5.0] to [$Url]"
        Invoke-PnPSiteTemplate -Path "$BasePath\1.5.0.pnp" -ErrorAction Stop
        Write-Host "[SUCCESS] Successfully applied PnP template [1.5.0] to [$Url]" -ForegroundColor Green
    }
    if ($PreviousVersion -lt "1.6.0") {
        Write-Host "[INFO] In version v1.6.0 we added Project timeline configuration and reworked the TimelineContent list. Merging data now as part of the upgrade"

        $Items = Get-PnPListItem -List "Tidslinjeinnhold"
        $Milestone = [Uri]::UnescapeDataString("Milep%C3%A6l")
        foreach ($Item in $Items) {
            $OldSiteId = $Item.FieldValues["SiteIdLookup"].LookupId
            $OldType = $Item.FieldValues["TimelineType"]

            if($null -ne $OldSiteId) {
                $Item["GtSiteIdLookup"] = $OldSiteId
            }
            
            if($null -ne $OldType) {
                Switch ($OldType)
                {
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

        #If Either Bygg or Anlegg changes title in the list, rename these.
        $TemplateMap = @{
            "Bygg"="Byggprosjekt";
            "Anlegg"="Anleggsprosjekt"
        }

        #If any of the titles are changed, change here.
        $ListContentMap = @{
            "FasesjekkBygg" = "Fasesjekkliste Bygg";
            "PlannerBygg" = "Planneroppgaver Bygg";
            "DokumentBygg" = "Standarddokumenter Bygg";
            "FasesjekkAnlegg" = "Fasesjekkliste Anlegg";
            "PlannerAnlegg" = "Planneroppgaver Anlegg";
            "DokumentAnlegg" = "Standarddokumenter Anlegg";
        }

        $ListContent = Get-PnPListItem -List Listeinnhold
        $MalOppsett = Get-PnPListItem -List Maloppsett

        $Bygg = $MalOppsett | Where-Object { $_["Title"] -eq $TemplateMap["Bygg"] }
        $Anlegg = $MalOppsett | Where-Object { $_["Title"] -eq $TemplateMap["Anlegg"] }
        $ByggPlanner = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["PlannerBygg"] }
        $ByggFasesjekk = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["FasesjekkBygg"] }
        $ByggDokument = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["DokumentBygg"] }
        $AnleggPlanner = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["PlannerAnlegg"] }
        $AnleggFasesjekk = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["FasesjekkAnlegg"] }
        $AnleggDokument = $ListContent | Where-Object { $_["Title"] -eq $ListContentMap["DokumentAnlegg"] }     

        #Adds Standard List Content to B&A template setup
        $ByggItems = @()
        $ByggItems+=[Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId"=$ByggPlanner.Id}
        $ByggItems+=[Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId"=$ByggFasesjekk.Id}
        $ByggItems+=[Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId"=$ByggDokument.Id}
        $Bygg["ListContentConfigLookup"] = $ByggItems
        $Bygg.SystemUpdate()
        $Bygg.Context.ExecuteQuery()
        $AnleggItems = @()
        $AnleggItems += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId"=$AnleggPlanner.Id}
        $AnleggItems += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId"=$AnleggFasesjekk.Id}
        $AnleggItems += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId"=$AnleggDokument.Id}
        $Anlegg["ListContentConfigLookup"] = $AnleggItems
        $Anlegg.SystemUpdate()
        $Anlegg.Context.ExecuteQuery()
    }
}
