
$LastInstall = Get-PnPListItem -List "Installasjonslogg" -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>" | Select-Object -First 1 -Wait
if ($null -ne $LastInstall) {
    $PreviousVersion = $LastInstall.FieldValues["InstallVersion"]

    if ($PreviousVersion -lt "1.4.0") {        
        Write-Host "[INFO] Removing deprecated pages"
        
        $DeprecatedIds = @(
            "d8558017-1e3b-4d13-82fa-2520e845297b", 
            "3ec6bcaf-28bc-4f2e-9e90-77e8cebf0b5f", 
            "57530c94-4fb2-4ca2-9279-16c57881fa19"
        )

        $Pages = Get-PnPFolder -Url SitePages -Includes Files | Select-Object -ExpandProperty Files

        $Pages | ForEach-Object {
            $DeprecatedComponents = Get-PnPClientSideComponent -Page $_.Name | Where-Object { $DeprecatedIds.Contains($_.WebPartId) }
            if ($DeprecatedComponents.Count -gt 0) {
                Remove-PnPClientSidePage $_.Name -Force -ErrorAction SilentlyContinue
            }
        }
    }

    if ($PreviousVersion -lt "1.6.0") {
        Get-PnPProvisioningTemplate -Out "$BasePath\Navigation.xml" -Handlers Navigation -Erroraction SilentlyContinue
        ((Get-Content -path "$BasePath\Navigation.xml" -Raw) -replace 'false', 'true') | Set-Content -Path "$BasePath\Navigation.xml" -Force -ErrorAction SilentlyContinue

        Write-Host "[INFO] Removing deprecated pages"
        Write-Host "[INFO] In version v1.6.0 we reworked the aggregated webparts and removed the benefits webpart as this is now handled in the aggregated webpart. Removing pages so that we overwrite the old pages correctly"
        
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
}
