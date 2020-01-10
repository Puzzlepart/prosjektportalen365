Param(
    [Parameter(Mandatory = $true, HelpMessage = "N/A")]
    [string]$Url,
    [Parameter(Mandatory = $false, HelpMessage = "N/A")]
    [string]$Title = "Prosjektportalen",
    [Parameter(Mandatory = $false, HelpMessage = "Stored credential from Windows Credential Manager")]
    [string]$GenericCredential,
    [Parameter(Mandatory = $false, HelpMessage = "Use Web Login")]
    [switch]$UseWebLogin,
    [Parameter(Mandatory = $false, HelpMessage = "PowerShell credential to authenticate with")]
    [System.Management.Automation.PSCredential]$PSCredential,
    [Parameter(Mandatory = $false, HelpMessage = "Skip PnP template")]
    [switch]$SkipTemplate,
    [Parameter(Mandatory = $false, HelpMessage = "Do you want to skip deployment of taxonomy?")]
    [switch]$SkipTaxonomy,
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
    [string]$SiteDesignName = "Prosjektomr%C3%A5de",
    [Parameter(Mandatory = $false, HelpMessage = "Security group to give View access to site design")]
    [string]$SiteDesignSecurityGroupId,
    [Parameter(Mandatory = $false, HelpMessage = "Tenant App Catalog Url")]
    [string]$TenantAppCatalogUrl
)

$ErrorActionPreference = "Stop"
$sw = [Diagnostics.Stopwatch]::StartNew()
$InstallStartTime = (Get-Date -Format o)
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

    Try {
        if ($UseWebLogin.IsPresent) {
            Connect-PnPOnline -Url $Url -UseWebLogin -ErrorAction Stop
        }
        elseif ($null -ne $PSCredential) {
            Connect-PnPOnline -Url $Url -Credentials $PSCredential -ErrorAction Stop
        }
        elseif ($null -ne $GenericCredential -and $GenericCredential -ne "") {
            Connect-PnPOnline -Url $Url -Credentials $GenericCredential -ErrorAction Stop
        }
    }
    Catch {
        Write-Host "[INFO] Failed to connect to [$Url]: $($_.Exception.Message)"
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
$Alias = $Uri.Segments[2].TrimEnd('/')
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")
#endregion

#region Check if URL specified is root site or admin site or invalid managed path
if ($Alias.Length -lt 2 -or (@("sites/", "teams/") -notcontains $ManagedPath) -or $Uri.Authority.Contains("-admin")) {
    Write-Host "[ERROR] It looks like you're trying to install to a root site or an invalid site. This is not supported." -ForegroundColor Red
    exit 0
}
#endregion

Set-PnPTraceLog -On -Level Debug -LogFile InstallLog.txt

#region Create site
if (-not $SkipSiteCreation.IsPresent -and -not $Upgrade.IsPresent) {
    Try {
        Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
        $PortfolioSite = Get-PnPTenantSite -Url $Url -ErrorAction SilentlyContinue
        if ($null -eq $PortfolioSite) {
            Write-Host "[INFO] Creating portfolio site at [$Url]"
            New-PnPSite -Type TeamSite  -Title $Title -Alias $Alias -IsPublic:$true -ErrorAction Stop -Lcid 1044 >$null 2>&1
            Write-Host "[INFO] Portfolio site created at [$Url]" -ForegroundColor Green
        }
        Register-PnPHubSite -Site $Url -ErrorAction SilentlyContinue
        Write-Host "[INFO] Portfolio site [$Url] promoted to hub site" -ForegroundColor Green
        Disconnect-PnPOnline
    }
    Catch {
        Write-Host "[ERROR] Failed to create site and promote to hub site: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
#endregion

#region Setting permissons
if (-not $Upgrade.IsPresent) {
    Try {
        Write-Host "[INFO] Setting permissions for associated member group"
        Connect-SharePoint -Url $Url -ErrorAction Stop
        # Must use english names to avoid errors, even on non 1033 sites
        # Where-Object doesn't work directly on Get-PnPRoleDefinition, so need to clone it first (https://github.com/Puzzlepart/prosjektportalen365/issues/35)
        $RoleDefinitions = @()
        Get-PnPRoleDefinition -ErrorAction SilentlyContinue | ForEach-Object { $RoleDefinitions += $_ }
        Set-PnPGroupPermissions -Identity (Get-PnPGroup -AssociatedMemberGroup) -RemoveRole ($RoleDefinitions | Where-Object { $_.RoleTypeKind -eq "Editor" }) -ErrorAction SilentlyContinue
        Set-PnPGroupPermissions -Identity (Get-PnPGroup -AssociatedMemberGroup) -AddRole ($RoleDefinitions | Where-Object { $_.RoleTypeKind -eq "Reader" }) -ErrorAction SilentlyContinue    
        Disconnect-PnPOnline
        Write-Host "[SUCCESS] Successfully set permissions for associated member group" -ForegroundColor Green
    }
    Catch {
        Write-Host "[ERROR] Failed to set permissions for associated member group: $($_.Exception.Message)" -ForegroundColor Red
    }
}
#endregion


#region Install site design
if (-not $SkipSiteDesign.IsPresent) {
    $SiteScriptIds = @()

    Try {
        Write-Host "[INFO] Creating/updating site scripts"        
        Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
        $SiteScripts = Get-PnPSiteScript
        $SiteScriptSrc = Get-ChildItem "./SiteScripts/*.txt"
        foreach ($s in $SiteScriptSrc) {
            $Title = $s.BaseName.Substring(9)
            $Content = (Get-Content -Path $s.FullName -Raw | Out-String)
            $SiteScript = $SiteScripts | Where-Object { $_.Title -eq $Title }
            if ($null -ne $SiteScript) {
                Set-PnPSiteScript -Identity $SiteScript -Content $Content >$null 2>&1
            }
            else {
                $SiteScript = Add-PnPSiteScript -Title $Title -Content $Content
            }
            $SiteScriptIds += $SiteScript.Id.Guid
        }
        Disconnect-PnPOnline
        Write-Host "[SUCCESS] Successfully created/updated site scripts" -ForegroundColor Green
    }
    Catch {
        Write-Host "[ERROR] Failed to create/update site scripts: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }

    Try {
        $SiteDesignName = [Uri]::UnescapeDataString($SiteDesignName)
        Write-Host "[INFO] Creating/updating site design [$SiteDesignName]"   
        Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
    
        $SiteDesign = Get-PnPSiteDesign -Identity $SiteDesignName 

        if ($null -ne $SiteDesign) {
            $SiteDesign = Set-PnPSiteDesign -Identity $SiteDesign -SiteScriptIds $SiteScriptIds -Description "" -Version "1"
        }
        else {
            $SiteDesign = Add-PnPSiteDesign -Title $SiteDesignName -SiteScriptIds $SiteScriptIds -Description "" -WebTemplate TeamSite
        }
        if ([string]::IsNullOrEmpty($SiteDesignSecurityGroupId)) {
            Write-Host "[INFO] You have not specified -SiteDesignSecurityGroupId. Everyone will have View access to site design [$SiteDesignName]" -ForegroundColor Yellow
        }
        else {            
            Write-Host "[INFO] Granting group $SiteDesignSecurityGroupId View access to site design [$SiteDesignName]"
            Grant-PnPSiteDesignRights -Identity $SiteDesign.Id.Guid -Principals @("c:0t.c|tenant|$SiteDesignSecurityGroupId")
        }
        Disconnect-PnPOnline
        Write-Host "[SUCCESS] Successfully created/updated site design [$SiteDesignName]" -ForegroundColor Green
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
        if (-not $TenantAppCatalogUrl) {
            Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
            $TenantAppCatalogUrl = Get-PnPTenantAppCatalogUrl -ErrorAction SilentlyContinue
            Disconnect-PnPOnline
        }
        Connect-SharePoint -Url $TenantAppCatalogUrl -ErrorAction Stop
    }
    Catch {
        Write-Host "[ERROR] Failed to connect to Tenant App Catalog. Do you have a Tenant App Catalog in your tenant?" -ForegroundColor Red
        exit 0 
    }
    Try {
        Write-Host "[INFO] Installing SharePoint Framework app packages to [$TenantAppCatalogUrl]"
        foreach ($AppPkg in (Get-ChildItem .\Apps\ -ErrorAction SilentlyContinue)) {
            Write-Host "[INFO] Installing $($AppPkg.BaseName)..."  -NoNewline
            Add-PnPApp -Path $AppPkg.FullName -Scope Tenant -Publish -Overwrite -SkipFeatureDeployment -ErrorAction Stop >$null 2>&1
            Write-Host " DONE" -ForegroundColor Green
        }
        Disconnect-PnPOnline
        Write-Host "[INFO] SharePoint Framework app packages successfully installed to [$TenantAppCatalogUrl]" -ForegroundColor Green
    }
    Catch {
        Write-Host "Error" -ForegroundColor Red
        Write-Host "[ERROR] Failed to install app packages to [$TenantAppCatalogUrl]: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
#endregion

#region Remove existing Home.aspx
if (-not $Upgrade.IsPresent) {
    Try {
        Connect-SharePoint -Url $Url -ErrorAction Stop
        Write-Host "[INFO] Removing existing homepage from [$Url]"
        Remove-PnPFile -ServerRelativeUrl "$($Uri.LocalPath)/SitePages/Home.aspx" -Recycle -Force
        Disconnect-PnPOnline
        Write-Host "[SUCCESS] Successfully removed existing homepage from [$Url]" -ForegroundColor Green
    }
    Catch {
        Write-Host "[ERROR] Failed to remove existing homepage from [$Url]: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}

#region Applying PnP templates 
if (-not $SkipTemplate.IsPresent) {
    Try {
        Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
        Set-PnPTenantSite -NoScriptSite:$false -Url $Url -ErrorAction SilentlyContinue >$null 2>&1        
        Disconnect-PnPOnline

        Connect-SharePoint -Url $Url -ErrorAction Stop

        # Applying additional check that we're connected to the correct site before applying templates
        $CurrentContext = Get-PnPContext
        if ($CurrentContext.Url -ne $Url) {
            Write-Host "[ERROR] Attempted to install to $Url but connection was active against $($CurrentContext.Url)"
            throw "Wrong connection identified - you are not connected to the correct site"
        }
        if (-not $SkipTaxonomy.IsPresent) {
            Write-Host "[INFO] Applying PnP template [Taxonomy] to [$Url]"
            Apply-PnPProvisioningTemplate .\Templates\Taxonomy.pnp -ErrorAction Stop
            Write-Host "[INFO] Successfully applied PnP template [Taxonomy] to [$Url]" -ForegroundColor Green
        }
        
        Write-Host "[INFO] Applying PnP template [Portfolio] to [$Url]"
        Apply-PnPProvisioningTemplate .\Templates\Portfolio.pnp -ErrorAction Stop
        Write-Host "[SUCCESS] Successfully applied PnP template [Portfolio] to [$Url]" -ForegroundColor Green
        
        Disconnect-PnPOnline

        Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
        Set-PnPTenantSite -NoScriptSite:$true -Url $Url -ErrorAction SilentlyContinue >$null 2>&1    
        Disconnect-PnPOnline
    }
    Catch {
        Write-Host "[ERROR] Failed to apply PnP templates to [$Url]: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
#endregion

#region QuickLaunch 
Try {
    Connect-SharePoint -Url $Url -ErrorAction Stop
    Write-Host "[INFO] Clearing QuickLaunch"    
    Get-PnPNavigationNode -Location QuickLaunch | Remove-PnPNavigationNode -Force
    Disconnect-PnPOnline
    Write-Host "[INFO] Successfully cleared QuickLaunch" -ForegroundColor Green
}
Catch {
    Write-Host "[WARNING] Failed to clear QuickLaunch: $($_.Exception.Message)" -ForegroundColor Yellow
}
#endregion

#region Search Configuration 
if (-not $SkipSearchConfiguration.IsPresent) {
    Try {
        Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
        Write-Host "[INFO] Importing Search Configuration"    
        Set-PnPSearchConfiguration -Scope Subscription -Path .\SearchConfiguration.xml -ErrorAction SilentlyContinue   
        Disconnect-PnPOnline
        Write-Host "[INFO] Successfully imported Search Configuration" -ForegroundColor Green
    }
    Catch {
        Write-Host "[WARNING] Failed to import Search Configuration: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
#endregion


Connect-SharePoint -Url $Url -ErrorAction Stop

#region Post install
Write-Host "[INFO] Running post-install steps"
.\Scripts\PostInstall.ps1
#endregion

$sw.Stop()

Write-Host "[REQUIRED ACTION] Go to $($AdminSiteUrl)/_layouts/15/online/AdminHome.aspx#/webApiPermissionManagement and approve the pending requests" -ForegroundColor Yellow
Write-Host "[RECOMMENDED ACTION] Go to https://github.com/Puzzlepart/prosjektportalen365/wiki/Installasjon#steg-4-manuelle-steg-etter-installasjonen and verify post-install steps" -ForegroundColor Yellow


if ($Upgrade.IsPresent) {
    Write-Host "[INFO] Upgrade completed in $($sw.Elapsed)" -ForegroundColor Green
}
else {
    Write-Host "[INFO] Installation completed in $($sw.Elapsed)" -ForegroundColor Green
}

$InstallEndTime = (Get-Date -Format o)

$InstallEntry = @{
    InstallStartTime = $InstallStartTime; 
    InstallEndTime   = $InstallEndTime; 
    InstallVersion   = "VERSION_PLACEHOLDER";
    InstallCommand   = $MyInvocation.Line.Substring(2);
}

Add-PnPListItem -List "Installasjonslogg" -Values $InstallEntry -ErrorAction SilentlyContinue >$null 2>&1
Disconnect-PnPOnline

$InstallEntry.InstallUrl = $Url

try { Invoke-WebRequest "https://pp365-install-pingback.azurewebsites.net/api/AddEntry" -Body ($InstallEntry | ConvertTo-Json) -Method 'POST' -ErrorAction SilentlyContinue >$null 2>&1 } catch {}