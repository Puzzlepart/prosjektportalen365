
$LastInstall = Get-PnPListItem -List "Installasjonslogg" -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>" | Select-Object -First 1 -Wait
if ($null -ne $LastInstall) {
    $PreviousVersion = $LastInstall.FieldValues["InstallVersion"]
    if ($PreviousVersion -lt "1.5.5") {
        Write-Host "[INFO] In version v1.5.5 we reworked the aggregated webparts and removed the benefits webpart as this is now handled in the aggregated webpart. Removing pages so that we overwrite the old pages correctly"
        
        $PnPClientSidePages = @(
            "Gevinstoversikt.aspx", 
            "Erfaringslogg.aspx", 
            "Leveranseoversikt.aspx", 
            "Risikooversikt.aspx"
        )

        $Pages = Get-PnPFolder -Url SitePages -Includes Files | Select-Object -ExpandProperty Files
        $Pages | ForEach-Object {
            if($PnPClientSidePages.Contains($_.Name)) {
                Remove-PnPClientSidePage -Identity $_.Name -Force
            }
        }
    }
}
