
$LastInstall = Get-PnPListItem -List "Installasjonslogg" -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>" | Select-Object -First 1 -Wait
if ($null -ne $LastInstall) {
    $PreviousVersion = $LastInstall.FieldValues["InstallVersion"]

    if ($PreviousVersion -lt "1.4.0") {
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

    if ($PreviousVersion -lt "1.7.0") {
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

    if ($PreviousVersion -lt "1.8.0" -or $PreviousVersion -like "*BA*") {
        Write-Host "[INFO] In version v1.8.0 we have integrated the 'Bygg & Anlegg' addon with standard installation. Checking to see if addon has been previously installed..." 

        $TermSetA = Get-PnPTermSet -Identity "cc6cdd18-c7d5-42e1-8d19-a336dd78f3f2" -TermGroup "Prosjektportalen" -ErrorAction SilentlyContinue
        $TermSetB = Get-PnPTermSet -Identity "ec5ceb95-7259-4282-811f-7c57304be71e" -TermGroup "Prosjektportalen" -ErrorAction SilentlyContinue
        if ($TermSetA -or $TermSetB) {
            Write-Host "[INFO] 'Bygg & Anlegg' addon detected. Renaming old contenttypes to avoid conflicts..." 
            $ProjectStatusBACT = Get-PnPContentType -Identity "Prosjektstatus (Bygg og anlegg)" -ErrorAction SilentlyContinue
            $ProjectBACT = Get-PnPContentType -Identity "Prosjekt (Bygg og anlegg)" -ErrorAction SilentlyContinue

            if ($ProjectStatusBACT) {
                $ProjectStatusBACT.Name = "Prosjektstatus (Bygg og anlegg) - UTDATERT"
                $ProjectStatusBACT.SystemUpdate()
                $ProjectStatusBACT.Context.ExecuteQuery()
            }

            if ($ProjectBACT) {
                $ProjectBACT.Name = "Prosjekt (Bygg og anlegg) - UTDATERT"
                $ProjectBACT.SystemUpdate()
                $ProjectBACT.Context.ExecuteQuery()
            }
            Write-Host "[SUCCESS] 'Bygg & Anlegg' contenttypes re-named" 
        }
    }
}
