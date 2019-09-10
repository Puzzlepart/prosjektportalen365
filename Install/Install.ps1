Param(
    [Parameter(Mandatory = $true, HelpMessage = "N/A")]
    [string]$Url,
    [Parameter(Mandatory = $false, HelpMessage = "N/A")]
    [string]$Title = "Prosjektportalen",
    [Parameter(Mandatory = $false, HelpMessage = "Stored credential from Windows Credential Manager")]
    [string]$GenericCredential,
    [Parameter(Mandatory = $false, HelpMessage = "Use Web Login")]
    [switch]$UseWebLogin,
    [Parameter(Mandatory = $false, HelpMessage = "Skip PnP template")]
    [switch]$SkipTemplate,
    [Parameter(Mandatory = $false, HelpMessage = "Skip Site Design")]
    [switch]$SkipSiteDesign,
    [Parameter(Mandatory = $false, HelpMessage = "Skip app packages")]
    [switch]$SkipAppPackages,
    [Parameter(Mandatory = $false, HelpMessage = "Skip site creation")]
    [switch]$SkipSiteCreation,
    [Parameter(Mandatory = $false, HelpMessage = "Skip search configuration")]
    [switch]$SkipSearchConfiguration,
    [Parameter(Mandatory = $false, HelpMessage = "Do you want to handle PnP libraries and PnP PowerShell without using bundled files?")]
    [switch]$SkipLoadingBundle,
    [Parameter(Mandatory = $false, HelpMessage = "Do you want to perform an upgrade?")]
    [switch]$Upgrade,
    [Parameter(Mandatory = $false, HelpMessage = "Site design name")]
    [string]$SiteDesignName = "Prosjektområde",
    [Parameter(Mandatory = $false, HelpMessage = "Security group to give View access to site design")]
    [string]$SiteDesignSecurityGroupId,
    [Parameter(Mandatory = $false, HelpMessage = "Tenant App Catalog Url")]
    [string]$TenantAppCatalogUrl
)

$sw = [Diagnostics.Stopwatch]::StartNew()
$InstallStartTime = (Get-Date).ToUniversalTime().ToString("MM/dd/yyy HH:mm")
if ($Upgrade.IsPresent) {
    Write-Host "[INFO] Upgrading [Prosjektportalen 365] to [VERSION_PLACEHOLDER]"
}
else {
    Write-Host "[INFO] Installing [Prosjektportalen 365] [VERSION_PLACEHOLDER]"
}

function Connect-SharePoint {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    $Connection = $null
    Try {
        if ($UseWebLogin.IsPresent) {
            $Connection = Connect-PnPOnline -Url $Url -UseWebLogin -ReturnConnection -ErrorAction Stop
        }
        else {
            $Connection = Connect-PnPOnline -Url $Url -Credentials $GenericCredential -ReturnConnection -ErrorAction Stop
        }
        return $Connection
    }
    Catch {
        throw $_.Exception.Message
    }
}

function LoadBundle() {
    Import-Module "$PSScriptRoot\SharePointPnPPowerShellOnline\SharePointPnPPowerShellOnline.psd1" -ErrorAction SilentlyContinue -WarningAction SilentlyContinue
    return (Get-Command Connect-PnPOnline).Version
}

if (-not $SkipLoadingBundle.IsPresent) {
    $PnPVersion = LoadBundle    
    Write-Host "[INFO] Loaded [SharePointPnPPowerShellOnline] v.$($PnPVersion) from bundle"
}
else {
    Write-Host "[INFO] Loaded [SharePointPnPPowerShellOnline] v.$((Get-Command Connect-PnPOnline).Version) from your environment"
}

#region Setting variables
[System.Uri]$Uri = $Url
$ManagedPath = $Uri.Segments[1]
$Alias = $Uri.Segments[2]
$AdminSiteConnection = $null
$AppCatalogSiteConnection = $null
$SiteConnection = $null
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")
#endregion

#region Check if URL specified is root site
if($Alias.Length -lt 2 -or $ManagedPath -ne "sites/") {
    Write-Host "[ERROR] It looks like you're trying to install to a root site or an invalid site. This is not supported." -ForegroundColor Red
    exit 0
}
#endregion

Set-PnPTraceLog -On -Level Debug -LogFile InstallLog.txt


#region Connection to admin site
Try {
    Write-Host "[INFO] Connecting to [$AdminSiteUrl]"
    $AdminSiteConnection = Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
    Write-Host "[SUCCESS] Successfully connected to [$AdminSiteUrl]" -ForegroundColor Green
}
Catch {
    Write-Host "[INFO] Failed to connect to [$AdminSiteUrl]: $($_.Exception.Message)"
    exit 0
}
#endregion

#region Create site
if (-not $SkipSiteCreation.IsPresent -and -not $Upgrade.IsPresent) {
    Try {
        $PortfolioSite = Get-PnPTenantSite -Url $Url -Connection $AdminSiteConnection -ErrorAction SilentlyContinue
        if ($null -eq $PortfolioSite) {
            Write-Host "[INFO] Creating portfolio site at [$Url]"
            New-PnPSite -Type TeamSite  -Title $Title -Alias $Alias -IsPublic:$true -ErrorAction Stop -Connection $AppCatalogSiteConnection -Lcid 1044 >$null 2>&1
            Write-Host "[INFO] Portfolio site created at [$Url]" -ForegroundColor Green
        }
        Register-PnPHubSite -Site $Url -ErrorAction SilentlyContinue -Connection $AdminSiteConnection 
        Write-Host "[INFO] Portfolio site [$Url] promoted to hub site" -ForegroundColor Green
    }
    Catch {
        Write-Host "[ERROR] Failed to create site and promote to hub site: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
#endregion

#region Connection to site
Try {
    Write-Host "[INFO] Connecting to [$Url]"
    $SiteConnection = Connect-SharePoint -Url $Url -ErrorAction Stop
    Write-Host "[SUCCESS] Successfully connected to [$Url]" -ForegroundColor Green
}
Catch {
    Write-Host "[ERROR] Failed to connect to [$Url]: $($_.Exception.Message)" -ForegroundColor Red
    exit 0
}
#endregion

#region Setting permissons
if (-not $Upgrade.IsPresent) {
    Write-Host "[INFO] Setting permissions for associated member group"
    # Must use english names to avoid errors, even on non 1033 sites
    # Where-Object doesn't work directly on Get-PnPRoleDefinition, so need to clone it first (https://github.com/Puzzlepart/prosjektportalen365/issues/35)
    $RoleDefinitions = @()
    Get-PnPRoleDefinition -Connection  $SiteConnection -ErrorAction SilentlyContinue | ForEach-Object { $RoleDefinitions += $_ }
    Set-PnPGroupPermissions -Identity (Get-PnPGroup -AssociatedMemberGroup -Connection  $SiteConnection) -RemoveRole ($RoleDefinitions | Where-Object { $_.RoleTypeKind -eq "Editor" }) -Connection  $SiteConnection -ErrorAction SilentlyContinue
    Set-PnPGroupPermissions -Identity (Get-PnPGroup -AssociatedMemberGroup -Connection  $SiteConnection) -AddRole ($RoleDefinitions | Where-Object { $_.RoleTypeKind -eq "Reader" }) -Connection  $SiteConnection -ErrorAction SilentlyContinue
}
#endregion


#region Install site design
if (-not $SkipSiteDesign.IsPresent) {
    $SiteScriptIds = @()

    Try {
        Write-Host "[INFO] Creating/updating site scripts"
        $SiteScripts = Get-PnPSiteScript -Connection $AdminSiteConnection
        $SiteScriptSrc = Get-ChildItem "./SiteScripts/*.txt"
        foreach ($s in $SiteScriptSrc) {
            $Title = $s.BaseName.Substring(9)
            $Content = (Get-Content -Path $s.FullName -Raw | Out-String)
            $SiteScript = $SiteScripts | Where-Object { $_.Title -eq $Title }
            if ($null -ne $SiteScript) {
                Set-PnPSiteScript -Identity $SiteScript -Content $Content -Connection $AdminSiteConnection  >$null 2>&1
            }
            else {
                $SiteScript = Add-PnPSiteScript -Title $Title -Content $Content -Connection $AdminSiteConnection
            }
            $SiteScriptIds += $SiteScript.Id.Guid
        }
        Write-Host "[SUCCESS] Successfully created/updated site scripts" -ForegroundColor Green
    }
    Catch {
        Write-Host "[ERROR] Failed to create/update site scripts: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }

    Try {
        Write-Host "[INFO] Creating/updating site design [$SiteDesignName]"
    
        $SiteDesign = Get-PnPSiteDesign -Identity $SiteDesignName -Connection $AdminSiteConnection

        if ($null -ne $SiteDesign) {
            $SiteDesign = Set-PnPSiteDesign -Identity $SiteDesign -SiteScriptIds $SiteScriptIds -Description "" -Version "1" -Connection $AdminSiteConnection
        }
        else {
            $SiteDesign = Add-PnPSiteDesign -Title $SiteDesignName -SiteScriptIds $SiteScriptIds -Description "" -WebTemplate TeamSite -Connection $AdminSiteConnection
        }
        if ([string]::IsNullOrEmpty($SiteDesignSecurityGroupId)) {
            Write-Host "[INFO] You have not specified -SiteDesignSecurityGroupId. Everyone will have View access to site design [$SiteDesignName]" -ForegroundColor Yellow
        }
        else {            
            Write-Host "[INFO] Granting group $SiteDesignSecurityGroupId View access to site design [$SiteDesignName]"
            Grant-PnPSiteDesignRights -Identity $SiteDesign.Id.Guid -Principals @("c:0t.c|tenant|$SiteDesignSecurityGroupId")
        }
        Write-Host "[INFO] Successfully created/updated site design [$SiteDesignName]" -ForegroundColor Green
    }
    Catch {
        Write-Host "[ERROR] Failed to create/update site design: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
#endregion

#region Install app packages
if (-not $SkipAppPackages.IsPresent) {
    Try {
        if(-not $TenantAppCatalogUrl) {
            $TenantAppCatalogUrl = Get-PnPTenantAppCatalogUrl -Connection $AdminSiteConnection -ErrorAction SilentlyContinue
        }
        $AppCatalogSiteConnection = Connect-SharePoint -Url $TenantAppCatalogUrl -ErrorAction Stop
    }
    Catch {
        Write-Host "[ERROR] Failed to connect to Tenant App Catalog. Do you have a Tenant App Catalog in your tenant?" -ForegroundColor Red
        exit 0 
    }
    Try {
        Write-Host "[INFO] Installing SharePoint Framework app packages to [$TenantAppCatalogUrl]"
        foreach ($AppPkg in (Get-ChildItem .\Apps\ -ErrorAction SilentlyContinue)) {
            Write-Host "[INFO] Installing $($AppPkg.BaseName)..."  -NoNewline
            Add-PnPApp -Path $AppPkg.FullName -Scope Tenant -Publish -Overwrite -SkipFeatureDeployment -ErrorAction Stop -Connection $AppCatalogSiteConnection >$null 2>&1
            Write-Host " DONE" -ForegroundColor Green
        }
        Write-Host "[INFO] SharePoint Framework app packages successfully installed to [$TenantAppCatalogUrl]" -ForegroundColor Green
    }
    Catch {
        Write-Host "[ERROR] Failed to install app packages to [$TenantAppCatalogUrl]: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
#endregion

#region Remove existing Home.aspx
if (-not $Upgrade.IsPresent) {
    Write-Host "[INFO] Removing existing homepage from [$Url]"
    Remove-PnPFile -ServerRelativeUrl "$($Uri.LocalPath)/SitePages/Home.aspx" -Force -Connection $SiteConnection
}

#region Applying PnP templates 
if (-not $SkipTemplate.IsPresent) {
    Try {
        Set-PnPTenantSite -NoScriptSite:$false -Url $Url -Connection $AdminSiteConnection
        
        Write-Host "[INFO] Applying PnP template [Taxonomy] to [$Url]"
        Apply-PnPProvisioningTemplate .\Templates\Taxonomy.pnp -Connection $SiteConnection -ErrorAction Stop
        Write-Host "[INFO] Successfully applied PnP template [Taxonomy] to [$Url]" -ForegroundColor Green
        
        Write-Host "[INFO] Applying PnP template [Portfolio] to [$Url]"
        Apply-PnPProvisioningTemplate .\Templates\Portfolio.pnp -Connection $SiteConnection -ErrorAction Stop
        Write-Host "[INFO] Successfully applied PnP template [Portfolio] to [$Url]" -ForegroundColor Green
        
        Set-PnPTenantSite -NoScriptSite:$true -Url $Url -Connection $AdminSiteConnection
    }
    Catch {
        Write-Host "[ERROR] Failed to apply PnP templates to [$Url]: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
#endregion

#region QuickLaunch 
Try {
    Write-Host "[INFO] Clearing QuickLaunch"    
    Get-PnPNavigationNode -Location QuickLaunch -Connection $SiteConnection | Remove-PnPNavigationNode -Connection $SiteConnection -Force 
    Write-Host "[INFO] Successfully cleared QuickLaunch" -ForegroundColor Green
}
Catch {
    Write-Host "[WARNING] Failed to clear QuickLaunch: $($_.Exception.Message)" -ForegroundColor Yellow
}
#endregion

#region Search Configuration 
if (-not $SkipSearchConfiguration.IsPresent) {
    Try {
        Write-Host "[INFO] Importing Search Configuration"    
        Set-PnPSearchConfiguration -Scope Subscription -Path .\SearchConfiguration.xml -Connection $AdminSiteConnection
        Write-Host "[INFO] Successfully imported Search Configuration" -ForegroundColor Green
    }
    Catch {
        Write-Host "[WARNING] Failed to import Search Configuration: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
#endregion

#region Post install
Write-Host "[INFO] Running post-install steps"
.\PostInstall.ps1 -Connection $SiteConnection
#endregion

$sw.Stop()

Write-Host "[REQUIRED ACTION] Go to $($AdminSiteUrl)/_layouts/15/online/AdminHome.aspx#/webApiPermissionManagement and approve the pending requests" -ForegroundColor Yellow

if ($Upgrade.IsPresent) {
    Write-Host "[INFO] Upgrade completed in $($sw.Elapsed)" -ForegroundColor Green
}
else {
    Write-Host "[INFO] Installation completed in $($sw.Elapsed)" -ForegroundColor Green
}

$InstallEndTime = (Get-Date).ToUniversalTime().ToString("MM/dd/yyy HH:mm")

$InstallEntry =  @{
    InstallStartTime = $InstallStartTime; 
    InstallEndTime   = $InstallEndTime; 
    InstallVersion   = "VERSION_PLACEHOLDER";
    InstallCommand   = $MyInvocation.Line.Substring(2);
}

Add-PnPListItem -List "Installasjonslogg" -Values $InstallEntry -Connection $SiteConnection >$null 2>&1

$InstallEntry.InstallUrl = $Url

Invoke-WebRequest "https://pp365-install-pingback.azurewebsites.net/api/AddEntry" -Body ($InstallEntry | ConvertTo-Json) -Method 'POST'  >$null 2>&1

#region Disconnect
Disconnect-PnPOnline -Connection $AppCatalogSiteConnection
Disconnect-PnPOnline -Connection $AdminSiteConnection
Disconnect-PnPOnline -Connection $SiteConnection
#endregion