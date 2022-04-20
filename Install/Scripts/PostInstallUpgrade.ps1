
$LastInstall = Get-PnPListItem -List "Installasjonslogg" -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>" | Select-Object -First 1 -Wait
if ($null -ne $LastInstall) {
    $PreviousVersion = $LastInstall.FieldValues["InstallVersion"]

    if ($PreviousVersion -lt "1.2.7") {
        Write-Host "[INFO] In version v1.2.7 we added 'Prosjekttidslinje' to the top navigation. Adding this navigation item now as part of the upgrade" 
        Add-PnPNavigationNode -Location TopNavigationBar -Title "Prosjekttidslinje" -Url "$($Uri.LocalPath)/SitePages/Prosjekttidslinje.aspx"
    }
    if ($PreviousVersion -lt "1.5.5") {
        Write-Host "[INFO] In version v1.5.5 we added Project timeline configuration and reworked the TimelineContent list. Merging data now as part of the upgrade"

        $Items = Get-PnPListItem -List "Tidslinjeinnhold"
        foreach ($Item in $Items) {
            $OldSiteId = $Item.FieldValues["SiteIdLookup"].LookupId
            $OldType = $Item.FieldValues["TimelineType"]

            $Item["GtSiteIdLookup"] = $OldSiteId

            Switch ($OldType)
            {
                "Prosjekt" { $Item["GtTimelineTypeLookup"] = 1 }
                "Fase" { $Item["GtTimelineTypeLookup"] = 2 }
                "Delfase" { $Item["GtTimelineTypeLookup"] = 3 }
                "Milep�l" { $Item["GtTimelineTypeLookup"] = 4 }
            }

            
            $Item.Update()
            Invoke-PnPQuery
        }
    }
    if ($PreviousVersion -lt "1.5.0") {
        Write-Host "[INFO] Applying PnP template [1.5.0] to [$Url]"
        Apply-PnPProvisioningTemplate "$BasePath\1.5.0.pnp" -ErrorAction Stop
        Write-Host "[SUCCESS] Successfully applied PnP template [1.5.0] to [$Url]" -ForegroundColor Green
    }
    
}