$InstallationEntriesList = Get-PnPList -Identity (Get-Resource -Name "Lists_InstallationLog_Title") -ErrorAction Stop
$LastInstall = Get-PnPListItem -List $InstallationEntriesList.Id -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>" | Select-Object -First 1 -Wait
if ($null -ne $LastInstall) {
    $PreviousVersion = ParseVersionString -VersionString $LastInstall.FieldValues["InstallVersion"]

    if ($PreviousVersion -lt [version]"1.2.7") {
        Write-Host "[INFO] In version v1.2.7 we added 'Prosjekttidslinje' to the top navigation. Adding this navigation item now as part of the upgrade" 
        Add-PnPNavigationNode -Location TopNavigationBar -Title "Prosjekttidslinje" -Url "$($Uri.LocalPath)/SitePages/Prosjekttidslinje.aspx"
    }
    
    if ($PreviousVersion -lt [version]"1.6.0") {
        Write-Host "[INFO] In version v1.6.0 we added Project timeline configuration and reworked the TimelineContent list. Merging data now as part of the upgrade"

        $Items = Get-PnPListItem -List (Get-Resource -Name "Lists_TimelineContent_Title")
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

        Remove-PnPField -List (Get-Resource -Name "Lists_TimelineContent_Title") -Identity "SiteIdLookup" -Force -ErrorAction SilentlyContinue
        Remove-PnPField -List (Get-Resource -Name "Lists_TimelineContent_Title") -Identity "TimelineType" -Force -ErrorAction SilentlyContinue
        Invoke-PnPQuery
    }

    if ($PreviousVersion -lt [version]"1.7.0") {
        Write-Host "[INFO] In version v1.7.0 we reworked the aggregated webparts. Adding these navigation items now as part of the upgrade" 
        Add-PnPNavigationNode -Location TopNavigationBar -Title "Nytteoversikt" -Url "$($Uri.LocalPath)/SitePages/Nytteoversikt.aspx"
        Add-PnPNavigationNode -Location TopNavigationBar -Title "Erfaringslogg" -Url "$($Uri.LocalPath)/SitePages/Erfaringslogg.aspx"
        Add-PnPNavigationNode -Location TopNavigationBar -Title "Leveranseoversikt" -Url "$($Uri.LocalPath)/SitePages/Leveranseoversikt.aspx"
        Add-PnPNavigationNode -Location TopNavigationBar -Title "Usikkerhetsoversikt" -Url "$($Uri.LocalPath)/SitePages/Usikkerhetsoversikt.aspx"
    }

    if ($PreviousVersion -lt [version]"1.8.2") {
        Write-Host "[INFO] In version v1.8.2 we did some adjustments to Project Status attachments. This might take a while..."
        
        $PERSISTED_SECTION_DATA_JSON_FILENAME = "PersistedSectionDataJson.json"
        $SNAPSHOT_FILENAME = "Snapshot.png"
        $TEMP_FOLDER = (Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid()))

        # Create the temp folder if it doesn't exist
        if (-not (Test-Path $TEMP_FOLDER)) {
            New-Item -ItemType Directory -Path $TEMP_FOLDER | Out-Null
        }

        # Get the folder where the attachments should be uploaded
        $ProjectStatusAttachmentsFolder = Get-PnPFolder -Url (Get-Resource -Name "Lists_ProjectStatusAttachments_Url")

        # Get all the items in the list
        $ProjectStatusItems = Get-PnPListItem -List (Get-Resource -Name "Lists_ProjectStatus_Title")

        foreach ($ProjectStatusItem in $ProjectStatusItems) {
            $Id = $ProjectStatusItem["ID"]
            $Title = $ProjectStatusItem["Title"]
            $PersistedSectionDataJson = $ProjectStatusItem["GtSectionDataJson"]

            Write-Host "Processing item $($Id) ($Title)" -InformationAction Ignore

            # Create a folder for the item in the attachments folder
            Write-Host "`tCreating folder for item $Id in $($ProjectStatusAttachmentsFolder.Name)" -InformationAction Ignore
            Add-PnPFolder -Folder $ProjectStatusAttachmentsFolder -Name $Id -ErrorAction SilentlyContinue | Out-Null
            $TempAttachmentFolder = "$($TEMP_FOLDER)/$Id"

            # Create the temp folder if it doesn't exist locally
            if (-not (Test-Path $TempAttachmentFolder)) {
                New-Item -ItemType Directory -Path $TempAttachmentFolder | Out-Null
            }

            # Download the attachments for the item to the temp folder
            Get-PnPListItemAttachment -List (Get-Resource -Name "Lists_ProjectStatus_Title") -Identity $Id -Path $TempAttachmentFolder -Force -WarningAction SilentlyContinue -ErrorAction SilentlyContinue

            # Check if the field GtSectionDataJson has a value
            if (-not [string]::IsNullOrEmpty($PersistedSectionDataJson)) {
                Write-Host "`tCreating $PERSISTED_SECTION_DATA_JSON_FILENAME for item $Id in $($ProjectStatusAttachmentsFolder.Name)/$Id" -InformationAction Ignore
                $PersistedSectionDataJson | Out-File "$($TempAttachmentFolder)/$($PERSISTED_SECTION_DATA_JSON_FILENAME)" -Encoding utf8
                Add-PnPFile -Path "$($TempAttachmentFolder)/$($PERSISTED_SECTION_DATA_JSON_FILENAME)" -Folder "$($ProjectStatusAttachmentsFolder.Name)/$Id" -NewFileName $PERSISTED_SECTION_DATA_JSON_FILENAME -ErrorAction SilentlyContinue | Out-Null
                Write-Host "`tSuccessfully uploaded $PERSISTED_SECTION_DATA_JSON_FILENAME for item $Id in $(Get-Resource -Name "Lists_ProjectStatus_Title")" -ForegroundColor Green -InformationAction Ignore
            }

            # Check $TempAttachmentFolder for PNG file starting with "Ny-statusrapport-for" to exclude potential attachments uploaded by the end users
            $Snapshot = Get-ChildItem -Path $TempAttachmentFolder | Where-Object { $_.Extension -eq ".png" -and $_.Name -like "Ny-statusrapport-for*" } | Select-Object -First 1
            if ($null -ne $Snapshot) {
                Write-Host "`tCreating $SNAPSHOT_FILENAME for item $Id in $($ProjectStatusAttachmentsFolder.Name)/$Id" -InformationAction Ignore
                Add-PnPFile -Path $Snapshot.FullName -Folder "$($ProjectStatusAttachmentsFolder.Name)/$Id" -NewFileName $SNAPSHOT_FILENAME -ErrorAction SilentlyContinue | Out-Null
            }
        }
    }
    
    if ($PreviousVersion -lt [version]"1.9.0") {
        Write-Host "[INFO] In version v1.9.0 we introduced data source levels. Adding default level 'Portfolio' to existing data sources..."
        
        Get-PnPListItem -List (Get-Resource -Name "Lists_DataSources_Title") | Where-Object { $_["Title"] -eq [System.Uri]::UnescapeDataString("Gevinstoversikt (Prosjektniv%C3%A5)") } | Remove-PnPListItem -Recycle -Force -ErrorAction SilentlyContinue | Out-Null
        Get-PnPListItem -List (Get-Resource -Name "Lists_DataSources_Title") | Where-Object { $_["Title"] -eq "Programrisiko" } | Remove-PnPListItem -Recycle -Force -ErrorAction SilentlyContinue | Out-Null
        Get-PnPListItem -List (Get-Resource -Name "Lists_DataSources_Title") | ForEach-Object {
            $Item = $_
            $Levels = $Item["GtDataSourceLevel"]
            if ($null -eq $Levels) {
                $Item["GtDataSourceLevel"] = [System.Uri]::UnescapeDataString("Portef%C3%B8lje")
                $Item.Update()
                Invoke-PnPQuery
            }
        }
    }

    if ($PreviousVersion -lt [version]"1.12.1") {
        Write-Host "[INFO] Fixing issue with Project News Page template"
        $PageListItem = Get-PnPFile -Url "SitePages/Templates/Prosjektnyhet.aspx" -AsListItem -ErrorAction SilentlyContinue
        if ($null -eq $PageListItem) {            
            $PageListItem = Get-PnPFile -Url "SitePages/Maler/Prosjektnyhet.aspx" -AsListItem -ErrorAction SilentlyContinue
        }
        if ($null -ne $PageListItem) {
            $UpdatedItem = Set-PnPListItem -List "SitePages" -Identity $PageListItem.Id -Values @{"PromotedState" = 1} -UpdateType Update -ErrorAction SilentlyContinue
        }
    }

    if ($PreviousVersion -lt [version]"1.13.0") {
        Write-Host "[INFO] Ensuring 'ReRunSetup' permission is assigned to the SP Admin role..."

        $AdminRolesList = Get-Resource -Name "Lists_ProjectAdminRoles_Title"
        $AdminPermissionsList = Get-Resource -Name "Lists_ProjectAdminPermissions_Title"
        $SPAdminTitle = Get-Resource -Name "Lists_ProjectAdminRoles_SPAdmin"

        $ReRunSetupPermission = Get-PnPListItem -List $AdminPermissionsList | Where-Object { $_["GtProjectAdminPermissionId"] -eq "5c2fd32e-0c8b-42be-9e0b-4fa6ff5d4774" }
        if ($null -ne $ReRunSetupPermission) {
            $SPAdminRole = Get-PnPListItem -List $AdminRolesList | Where-Object { $_["Title"] -eq $SPAdminTitle }
            if ($null -ne $SPAdminRole) {
                $CurrentPermissions = $SPAdminRole["GtProjectAdminPermissions"]
                $HasReRunSetup = $false
                if ($null -ne $CurrentPermissions) {
                    foreach ($Perm in $CurrentPermissions) {
                        if ($Perm.LookupId -eq $ReRunSetupPermission.Id) {
                            $HasReRunSetup = $true
                            break
                        }
                    }
                }
                if (-not $HasReRunSetup) {
                    $UpdatedPermissions = @()
                    if ($null -ne $CurrentPermissions) {
                        foreach ($Perm in $CurrentPermissions) {
                            $UpdatedPermissions += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $Perm.LookupId }
                        }
                    }
                    $UpdatedPermissions += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $ReRunSetupPermission.Id }
                    $SPAdminRole["GtProjectAdminPermissions"] = $UpdatedPermissions
                    $SPAdminRole.SystemUpdate()
                    $SPAdminRole.Context.ExecuteQuery()
                    Write-Host "[INFO] Successfully added 'ReRunSetup' permission to SP Admin role" -ForegroundColor Green
                } else {
                    Write-Host "[INFO] SP Admin role already has 'ReRunSetup' permission, skipping"
                }
            } else {
                Write-Host "[WARNING] Could not find SP Admin role '$SPAdminTitle' in list '$AdminRolesList'" -ForegroundColor Yellow
            }
        } else {
            Write-Host "[WARNING] Could not find 'ReRunSetup' permission item in list '$AdminPermissionsList'" -ForegroundColor Yellow
        }

        Write-Host "[INFO] Ensuring 'AssistantAccess' permission is assigned to all project admin roles..."

        $AdminRolesList = Get-Resource -Name "Lists_ProjectAdminRoles_Title"
        $AdminPermissionsList = Get-Resource -Name "Lists_ProjectAdminPermissions_Title"

        $AssistantAccessPermission = Get-PnPListItem -List $AdminPermissionsList | Where-Object { $_["GtProjectAdminPermissionId"] -eq "7f3a8b2c-4d5e-6f70-8192-a3b4c5d6e7f8" }
        if ($null -ne $AssistantAccessPermission) {
            $RoleTitles = @(
                (Get-Resource -Name "Lists_ProjectAdminRoles_ProjectManager"),
                (Get-Resource -Name "Lists_ProjectAdminRoles_ProjectOwner"),
                (Get-Resource -Name "Lists_ProjectAdminRoles_ProjectSupport"),
                (Get-Resource -Name "Lists_ProjectAdminRoles_ProjectOffice"),
                (Get-Resource -Name "Lists_ProjectAdminRoles_SPAdmin")
            )

            foreach ($RoleTitle in $RoleTitles) {
                $Role = Get-PnPListItem -List $AdminRolesList | Where-Object { $_["Title"] -eq $RoleTitle }
                if ($null -ne $Role) {
                    $CurrentPermissions = $Role["GtProjectAdminPermissions"]
                    $HasPermission = $false
                    if ($null -ne $CurrentPermissions) {
                        foreach ($Perm in $CurrentPermissions) {
                            if ($Perm.LookupId -eq $AssistantAccessPermission.Id) {
                                $HasPermission = $true
                                break
                            }
                        }
                    }
                    if (-not $HasPermission) {
                        $UpdatedPermissions = @()
                        if ($null -ne $CurrentPermissions) {
                            foreach ($Perm in $CurrentPermissions) {
                                $UpdatedPermissions += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $Perm.LookupId }
                            }
                        }
                        $UpdatedPermissions += [Microsoft.SharePoint.Client.FieldLookupValue]@{"LookupId" = $AssistantAccessPermission.Id }
                        $Role["GtProjectAdminPermissions"] = $UpdatedPermissions
                        $Role.SystemUpdate()
                        $Role.Context.ExecuteQuery()
                        Write-Host "[INFO] Added 'AssistantAccess' permission to role '$RoleTitle'" -ForegroundColor Green
                    } else {
                        Write-Host "[INFO] Role '$RoleTitle' already has 'AssistantAccess' permission, skipping"
                    }
                } else {
                    Write-Host "[WARNING] Could not find role '$RoleTitle' in list '$AdminRolesList'" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "[WARNING] Could not find 'AssistantAccess' permission item in list '$AdminPermissionsList'" -ForegroundColor Yellow
        }

        Write-Host "[INFO] Ensuring 'AssistantAccessMode' global setting exists..."
        $GlobalSettingsList = Get-Resource -Name "Lists_Global_Settings_Title"
        $AssistantAccessModeSettingId = "{a2e4f6b8-1c3d-5e7f-9a0b-c4d6e8f0a2b4}"
        $ExistingSetting = Get-PnPListItem -List $GlobalSettingsList | Where-Object { $_["GtSettingsId"] -eq $AssistantAccessModeSettingId }
        if ($null -eq $ExistingSetting) {
            $AssistantCategory = Get-Resource -Name "Lists_Global_Settings_Category_Assistant"
            $SettingTitle = Get-Resource -Name "Lists_Global_Settings_Category_Assistant_AssistantAccessMode_Title"
            Add-PnPListItem -List $GlobalSettingsList -Values @{
                "GtSettingsId"       = $AssistantAccessModeSettingId
                "Title"              = $SettingTitle
                "GtSettingsKey"      = "AssistantAccessMode"
                "GtSettingsValue"    = "group"
                "GtSettingsEnabled"  = $true
                "GtSettingsCategory" = $AssistantCategory
            } | Out-Null
            Write-Host "[INFO] Added 'AssistantAccessMode' global setting with default value 'group'" -ForegroundColor Green
        } else {
            Write-Host "[INFO] 'AssistantAccessMode' global setting already exists, skipping"
        }
    }

    if ($PreviousVersion -lt [version]"1.13.0") {
        Write-Host "[INFO] Ensuring 'AvailableProgramHubs' global setting exists and has an absolute URL value..."
        # The Program administration web part resolves this setting to a hub site id. A missing
        # value, or a server-relative value (e.g. '/sites/...'), fails to resolve and both the
        # existing programs list and the 'Add subareas' dialog silently render empty. Ensure the
        # setting exists and holds the absolute URL of this portfolio (hub) site.
        $GlobalSettingsList = Get-Resource -Name "Lists_Global_Settings_Title"
        $AvailableProgramHubsSettingId = "{21bcf4a5-1979-44cb-b42e-3209fc95ce90}"
        $HubUrl = (Get-PnPWeb -Includes Url).Url
        $ExistingSetting = Get-PnPListItem -List $GlobalSettingsList | Where-Object { $_["GtSettingsKey"] -eq "AvailableProgramHubs" }
        if ($null -eq $ExistingSetting) {
            $GeneralCategory = Get-Resource -Name "Lists_Global_Settings_Category_General"
            $SettingTitle = Get-Resource -Name "Lists_Global_Settings_Category_General_AvailableProgramHubs_Title"
            Add-PnPListItem -List $GlobalSettingsList -Values @{
                "GtSettingsId"       = $AvailableProgramHubsSettingId
                "Title"              = $SettingTitle
                "GtSettingsKey"      = "AvailableProgramHubs"
                "GtSettingsValue"    = $HubUrl
                "GtSettingsEnabled"  = $true
                "GtSettingsCategory" = $GeneralCategory
            } | Out-Null
            Write-Host "[INFO] Added 'AvailableProgramHubs' global setting with value '$HubUrl'" -ForegroundColor Green
        } else {
            $CurrentValue = $ExistingSetting["GtSettingsValue"]
            if ([string]::IsNullOrWhiteSpace($CurrentValue) -or $CurrentValue.StartsWith("/")) {
                Set-PnPListItem -List $GlobalSettingsList -Identity $ExistingSetting.Id -Values @{
                    "GtSettingsValue" = $HubUrl
                } | Out-Null
                Write-Host "[INFO] Repaired 'AvailableProgramHubs' global setting value from '$CurrentValue' to '$HubUrl'" -ForegroundColor Green
            } else {
                Write-Host "[INFO] 'AvailableProgramHubs' global setting already has an absolute value, skipping"
            }
        }
    }

    # Prosjektveiviseren v6: fyll de nye hub-listene med v6-innholdet. Radene (63 sjekkpunkter,
    # 26 oppgaver) ligger KUN i den språkspesifikke innholdsmalen, og ved oppgradering kjøres
    # den med -Handlers Files (Install.ps1) for å ikke røre virksomhetens listedata. v6-listene
    # står derfor tomme etter hovedmalen. Her leses innholdsmalen, alt annet enn de to v6-
    # ListInstance-ene fjernes, og Lists-handleren kjøres på restene — ETTER hovedmalen (listene
    # har da fullt skjema) og gated på TILSTAND (listen finnes og er tom), ikke versjon. Dermed
    # fullføres migreringen både ved re-kjøring og når en apps-only-oppgradering kom først.
    # DataRows har KeyColumn=Title/UpdateBehavior=Skip, så eventuelle egne rader røres ikke.
    if (-not $SkipTemplate.IsPresent) {
        $V6ContentTargets = @(
            @(
                (Get-Resource -Name "Lists_PhaseChecklistV6_Url"),
                (Get-Resource -Name "Lists_PlannerTasksV6_Url")
            ) | Where-Object {
                $V6List = Get-PnPList -Identity $_ -Includes ItemCount -ErrorAction SilentlyContinue
                $null -ne $V6List -and $V6List.ItemCount -eq 0
            }
        )
        if ($V6ContentTargets.Count -gt 0) {
            $ContentTemplatePath = "$TemplatesBasePath/Portfolio_content.$LanguageCode.pnp"
            if (Test-Path $ContentTemplatePath) {
                Write-Host "[INFO] Provisioning Prosjektveiviseren v6 content to empty hub lists [$($V6ContentTargets -join ', ')]"
                try {
                    $ContentTemplate = Read-PnPSiteTemplate -Path $ContentTemplatePath
                    # Materialiser før fjerning — endring under enumerering kaster.
                    $ListsToRemove = @($ContentTemplate.Lists | Where-Object { $V6ContentTargets -notcontains $_.Url })
                    foreach ($ListInstance in $ListsToRemove) {
                        $ContentTemplate.Lists.Remove($ListInstance) >$null
                    }
                    if ($ContentTemplate.Lists.Count -eq 0) {
                        Write-Host "[WARNING] The content template [$([System.IO.Path]::GetFileName($ContentTemplatePath))] contains no list instances for [$($V6ContentTargets -join ', ')] - the v6 hub lists remain empty" -ForegroundColor Yellow
                    }
                    else {
                        Invoke-PnPSiteTemplate -InputInstance $ContentTemplate -Handlers Lists -ErrorAction Stop -WarningAction SilentlyContinue
                        $V6ContentTargets | ForEach-Object {
                            $V6List = Get-PnPList -Identity $_ -Includes ItemCount -ErrorAction SilentlyContinue
                            Write-Host "[SUCCESS] Provisioned v6 content to [$_] ($($V6List.ItemCount) items)" -ForegroundColor Green
                        }
                    }
                }
                catch {
                    $msg = $_.Exception.Message
                    $isMissingTerm = ($msg -match "GetTerm") -or ($msg -match "Object reference not set") -or ($msg -match "Term .* (not found|does not exist)")
                    Write-Host "[WARNING] Failed to provision Prosjektveiviseren v6 content to [$($V6ContentTargets -join ', ')]: $msg" -ForegroundColor Yellow
                    if ($isMissingTerm) {
                        Write-Host "          Most likely cause: project phase terms (e.g. Idé, Konsept, Planlegge, Avslutte) have been deleted or renamed in the 'Prosjektportalen' term group. Restore the terms and re-run the install with -Upgrade; the step re-triggers as long as the v6 lists are empty." -ForegroundColor Yellow
                    }
                    Write-ErrorDetails $_
                }
            }
            else {
                Write-Host "[WARNING] No content template found for language $LanguageCode - the v6 hub lists [$($V6ContentTargets -join ', ')] remain empty" -ForegroundColor Yellow
            }
        }
    }

    if ($PreviousVersion -lt [version]"1.14.0" -and -not $SkipTemplate.IsPresent) {
        # Prosjektveiviseren v6: verifiser generasjonssplitten. Hvis omdøpingen i
        # PreInstallUpgrade feilet, heter den GAMLE listen fortsatt «Fasesjekkliste» —
        # da treffer prosjektprovisjoneringens getByTitle feil liste (stille kildebytte).
        # Ved -SkipTemplate hoppes hele splitten bevisst over (se PreInstallUpgrade),
        # så verifiseringen ville bare gitt misvisende advarsler.
        Write-Host "[INFO] Verifying side-by-side list generations (Prosjektveiviseren v6)"
        $GenerationChecks = @(
            @{ LegacyUrl = (Get-Resource -Name "Lists_PhaseChecklistLegacy_Url"); LegacyTitle = (Get-Resource -Name "Lists_PhaseChecklistLegacy_Title"); V6Url = (Get-Resource -Name "Lists_PhaseChecklistV6_Url"); V6Title = (Get-Resource -Name "Lists_PhaseChecklistV6_Title") },
            @{ LegacyUrl = (Get-Resource -Name "Lists_PlannerTasksLegacy_Url"); LegacyTitle = (Get-Resource -Name "Lists_PlannerTasksLegacy_Title"); V6Url = (Get-Resource -Name "Lists_PlannerTasksV6_Url"); V6Title = (Get-Resource -Name "Lists_PlannerTasksV6_Title") }
        )
        $GenerationChecks | ForEach-Object {
            $LegacyList = Get-PnPList -Identity $_.LegacyUrl -ErrorAction SilentlyContinue
            $V6List = Get-PnPList -Identity $_.V6Url -Includes ItemCount -ErrorAction SilentlyContinue
            if ($null -eq $V6List) {
                Write-Host "[WARNING] v6 list at [$($_.V6Url)] was not provisioned" -ForegroundColor Yellow
            }
            elseif ($V6List.ItemCount -eq 0) {
                Write-Host "[WARNING] v6 list at [$($_.V6Url)] is empty - the v6 content step above did not populate it. Re-run the install with -Upgrade once the cause is fixed (the step re-triggers while the list is empty)." -ForegroundColor Yellow
            }
            if ($null -eq $LegacyList) {
                Write-Host "[WARNING] Legacy list at [$($_.LegacyUrl)] was not found" -ForegroundColor Yellow
            }
            elseif ($LegacyList.Title -eq $_.V6Title) {
                Write-Host "[WARNING] Legacy list at [$($_.LegacyUrl)] is still titled [$($LegacyList.Title)] - the rename in PreInstallUpgrade did not run. Project provisioning will resolve the WRONG source list until it is renamed to [$($_.LegacyTitle)]." -ForegroundColor Red
            }
        }
    }
}
