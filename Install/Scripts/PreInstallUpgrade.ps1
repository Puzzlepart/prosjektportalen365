
$LastInstall = Get-PnPListItem -List "Installasjonslogg" -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>" | Select-Object -First 1 -Wait
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
        Write-Host "[INFO] Changing fieldtype of GtUNSustDevGoalsText"
        try {
            $Field = Get-PnPField -Identity "GtUNSustDevGoalsText" -List "Prosjekter" -Includes FieldTypeKind
            if ($null -ne $Field) {
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

        } catch {
            Write-Host "[ERROR] Failed to change fieldtype of GtUNSustDevGoalsText" -ForegroundColor Yellow
        }
    }
}
