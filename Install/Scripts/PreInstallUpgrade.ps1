
$LastInstall = Get-PnPListItem -List "Installasjonslogg" -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>" | Select-Object -First 1 -Wait
if ($null -ne $LastInstall) {
    $PreviousVersion = $LastInstall.FieldValues["InstallVersion"]
    Write-Host $PreviousVersion
    
    if ($PreviousVersion -lt "1.5.5") {
        Write-Host "[INFO] In version v1.5.5 we reworked the aggregated webparts and removed the benefits webpart as this is now handled in the aggregated webpart. Removing pages so that we overwrite the old pages correctly"
        
        $WebPartIds = @(
            "5f925484-cfb4-42ce-9f90-79a874bb8a68", 
            "6c0e484d-f6da-40d4-81fc-ec1389ef29a8"
        )

        Write-Host $Ids

        $Pages = Get-PnPFolder -Url SitePages -Includes Files | Select-Object -ExpandProperty Files
        $Pages | ForEach-Object {
            $DeprecatedComponents = Get-PnPClientSideComponent -Page $_.Name | Where-Object { $WebPartIds.Contains($_.WebPartId) }
            if($DeprecatedComponents.Count -gt 0) {
                Write-Host $_.Name

                Remove-PnPClientSidePage $_.Name -Force
            }
        }
    }
}
