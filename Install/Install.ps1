[Diagnostics.CodeAnalysis.SuppressMessageAttribute("PSAvoidUsingPlainTextForPassword", "")]
Param(
    [Parameter(Mandatory = $true, HelpMessage = "N/A")]
    [string]$Url,
    [Parameter(Mandatory = $false, HelpMessage = "N/A")]
    [string]$Title = "Prosjektportalen",
    [Parameter(Mandatory = $false, HelpMessage = "Stored credential from Windows Credential Manager")]
    [string]$GenericCredential,
    [Parameter(Mandatory = $false)]
    [switch]$Interactive,
    [Parameter(Mandatory = $false, HelpMessage = "PowerShell credential to authenticate with")]
    [System.Management.Automation.PSCredential]$PSCredential,
    [Parameter(Mandatory = $false, HelpMessage = "Skip PnP template")]
    [switch]$SkipTemplate,
    [Parameter(Mandatory = $false, HelpMessage = "Do you want to skip deployment of taxonomy?")]
    [switch]$SkipTaxonomy,
    [Parameter(Mandatory = $false, HelpMessage = "Skip Site Design")]
    [switch]$SkipSiteDesign,
    [Parameter(Mandatory = $false, HelpMessage = "Skip default Site Design association")]
    [switch]$SkipDefaultSiteDesignAssociation,
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
    [string]$TenantAppCatalogUrl,
    [Parameter(Mandatory = $false, HelpMessage = "Language")]
    [ValidateSet('Norwegian')]
    [string]$Language = "Norwegian",
    [Parameter(Mandatory = $false, HelpMessage = "CI")]
    [string]$CI
)
$global:__InteractiveCachedAccessTokens = @{}

#region Handling installation language
$LanguageIds = @{
    "Norwegian"    = 1044;
    "English (US)" = 1033;
}

$LanguageCodes = @{
    "Norwegian"    = 'no-NB';
    "English (US)" = 'en-US';
}

$LanguageId = $LanguageIds[$Language]
$LanguageCode = $LanguageCodes[$Language]
#endregion

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
        if($null -ne $global:__InteractiveCachedAccessTokens[$Url]) {
            Connect-PnPOnline -Url $Url -AccessToken $global:__InteractiveCachedAccessTokens[$Url]
        }
        if (-not [string]::IsNullOrEmpty($CI)) {
            $DecodedCred = ([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($CI))).Split("|")
            $Password = ConvertTo-SecureString -String $DecodedCred[1] -AsPlainText -Force
            $Credentials = New-Object -TypeName System.Management.Automation.PSCredential -ArgumentList $DecodedCred[0], $Password
            Connect-PnPOnline -Url $Url -Credentials $Credentials -ErrorAction Stop  -WarningAction Ignore
        }
        elseif ($Interactive.IsPresent) {
            Connect-PnPOnline -Url $Url -Interactive -ErrorAction Stop -WarningAction Ignore
            $global:__InteractiveCachedAccessTokens[$Url] = Get-__InteractiveCachedAccessTokens
        }
        elseif ($null -ne $PSCredential) {
            Connect-PnPOnline -Url $Url -Credentials $PSCredential -ErrorAction Stop  -WarningAction Ignore
        }
        elseif ($null -ne $GenericCredential -and $GenericCredential -ne "") {
            Connect-PnPOnline -Url $Url -Credentials $GenericCredential -ErrorAction Stop  -WarningAction Ignore
        }
        else {
            Connect-PnPOnline -Url $Url -ErrorAction Stop -WarningAction Ignore
        }
    }
    Catch {
        Write-Host "[INFO] Failed to connect to [$Url]: $($_.Exception.Message)"
        throw $_.Exception.Message
    }
}

function LoadBundle() {
    Import-Module "$PSScriptRoot\PnP.PowerShell\PnP.PowerShell.psd1" -ErrorAction SilentlyContinue -WarningAction SilentlyContinue
    return (Get-Command Connect-PnPOnline).Version
}

if (-not [string]::IsNullOrEmpty($CI)) {
    Write-Host "[Running in CI mode. Installing module PnP.PowerShell.]" -ForegroundColor Yellow
    Install-Module -Name PnP.PowerShell -Force -Scope CurrentUser -ErrorAction Stop
}
else {
    if (-not $SkipLoadingBundle.IsPresent) {
        $PnPVersion = LoadBundle    
        Write-Host "[INFO] Loaded [PnP.PowerShell] v.$($PnPVersion) from bundle"
    }
    else {
        Write-Host "[INFO] Loaded [PnP.PowerShell] v.$((Get-Command Connect-PnPOnline).Version) from your environment"
    }
}


#region Setting variables
[System.Uri]$Uri = $Url
$ManagedPath = $Uri.Segments[1]
$Alias = $Uri.Segments[2].TrimEnd('/')
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")
$BasePath = "$PSScriptRoot\Templates"
#endregion

#region Print installation user
Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
$CurrentUser = Get-PnPProperty -Property CurrentUser -ClientObject (Get-PnPContext).Web
Write-Host "[INFO] Installing with user [$($CurrentUser.Email)]"
Disconnect-PnPOnline
#endregion

#region Check if URL specified is root site or admin site or invalid managed path
if ($Alias.Length -lt 2 -or (@("sites/", "teams/") -notcontains $ManagedPath) -or $Uri.Authority.Contains("-admin")) {
    Write-Host "[ERROR] It looks like you're trying to install to a root site or an invalid site. This is not supported." -ForegroundColor Red
    exit 0
}
#endregion

Set-PnPTraceLog -On -Level Debug -LogFile "Install_Log_$([datetime]::Now.Ticks).txt"

#region Create site
if (-not $SkipSiteCreation.IsPresent -and -not $Upgrade.IsPresent) {
    Try {
        Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
        $PortfolioSite = Get-PnPTenantSite -Url $Url -ErrorAction SilentlyContinue
        if ($null -eq $PortfolioSite) {
            Write-Host "[INFO] Creating portfolio site at [$Url]"
            New-PnPSite -Type TeamSite -Title $Title -Alias $Alias -IsPublic:$true -ErrorAction Stop -Lcid $LanguageId >$null 2>&1
            Write-Host "[SUCCESS] Portfolio site created at [$Url]" -ForegroundColor Green
        }
        Register-PnPHubSite -Site $Url -ErrorAction SilentlyContinue
        Write-Host "[SUCCESS] Portfolio site [$Url] promoted to hub site" -ForegroundColor Green
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
$SiteDesignName = [Uri]::UnescapeDataString($SiteDesignName)
$SiteDesignDesc = [Uri]::UnescapeDataString("Samarbeid i et prosjektomr%C3%A5de fra Prosjektportalen")

if (-not $SkipSiteDesign.IsPresent) {
    $SiteScriptIds = @()

    Try {
        Write-Host "[INFO] Creating/updating site scripts"        
        Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
        $SiteScripts = Get-PnPSiteScript
        $SiteScriptSrc = Get-ChildItem "$PSScriptRoot/SiteScripts/*.txt"
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
        Write-Host "[INFO] Creating/updating site design [$SiteDesignName]"   
        Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
    
        $SiteDesign = Get-PnPSiteDesign -Identity $SiteDesignName 

        if ($null -ne $SiteDesign) {
            $SiteDesign = Set-PnPSiteDesign -Identity $SiteDesign -SiteScriptIds $SiteScriptIds -Description $SiteDesignDesc -Version "1"
        }
        else {
            $SiteDesign = Add-PnPSiteDesign -Title $SiteDesignName -SiteScriptIds $SiteScriptIds -Description $SiteDesignDesc -WebTemplate TeamSite
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
if (-not $SkipDefaultSiteDesignAssociation.IsPresent) {
    Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
    $SiteDesign = Get-PnPSiteDesign -Identity $SiteDesignName 
    Write-Host "[INFO] Setting default site design for hub [$Url] to [$SiteDesignName]"
    Set-PnPHubSite -Identity $Url -SiteDesignId $SiteDesign.Id.Guid
    Disconnect-PnPOnline
}
#endregion

#region Pre install
if ($Upgrade.IsPresent) {
    Write-Host "[INFO] Running pre-install upgrade steps" 
    try {
        Connect-SharePoint -Url $Url -ErrorAction Stop
        ."$PSScriptRoot\Scripts\PreInstallUpgrade.ps1"
        Disconnect-PnPOnline
        Write-Host "[SUCCESS] Successfully ran pre-install upgrade steps" -ForegroundColor Green
    }
    Catch {}
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
        foreach ($AppPkg in (Get-ChildItem "$PSScriptRoot\Apps" -ErrorAction SilentlyContinue)) {
            Write-Host "[INFO] Installing $($AppPkg.BaseName)..."  -NoNewline
            Add-PnPApp -Path $AppPkg.FullName -Scope Tenant -Publish -Overwrite -SkipFeatureDeployment -ErrorAction Stop >$null 2>&1
            Write-Host " DONE" -ForegroundColor Green
        }
        Disconnect-PnPOnline
        Write-Host "[SUCCESS] SharePoint Framework app packages successfully installed to [$TenantAppCatalogUrl]" -ForegroundColor Green
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
        Remove-PnPFile -ServerRelativeUrl "$($Uri.LocalPath)/SitePages/Home.aspx" -Recycle -Force
        Disconnect-PnPOnline
    }
    Catch {}
}
#endregion

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
        if (-not $SkipTaxonomy.IsPresent -and -not $Upgrade.IsPresent) {
            Write-Host "[INFO] Applying PnP template [Taxonomy] to [$Url]"
            Invoke-PnPSiteTemplate "$BasePath\Taxonomy.pnp" -ErrorAction Stop
            Write-Host "[SUCCESS] Successfully applied PnP template [Taxonomy] to [$Url]" -ForegroundColor Green
        }

        if ($Upgrade.IsPresent) {
            Write-Host "[INFO] Applying PnP template [Portfolio] to [$Url]"
            Invoke-PnPSiteTemplate "$BasePath\Portfolio.pnp" -ExcludeHandlers Navigation, SupportedUILanguages -ErrorAction Stop
            Write-Host "[SUCCESS] Successfully applied PnP template [Portfolio] to [$Url]" -ForegroundColor Green

            Write-Host "[INFO] Applying PnP content template (Handlers:Files) to [$Url]"
            Invoke-PnPSiteTemplate "$BasePath\Portfolio_content.$LanguageCode.pnp" -Handlers Files -ErrorAction Stop
            Write-Host "[SUCCESS] Successfully applied PnP content template to [$Url]" -ForegroundColor Green
        }
        else {
            Write-Host "[INFO] Applying PnP template [Portfolio] to [$Url]"
            $Instance = Read-PnPProvisioningTemplate "$BasePath\Portfolio.pnp"
            $Instance.SupportedUILanguages[0].LCID = $LanguageId
            Invoke-PnPSiteTemplate -InputInstance $Instance -Handlers SupportedUILanguages
            Invoke-PnPSiteTemplate "$BasePath\Portfolio.pnp" -ExcludeHandlers SupportedUILanguages -ErrorAction Stop
            Write-Host "[SUCCESS] Successfully applied PnP template [Portfolio] to [$Url]" -ForegroundColor Green

            Write-Host "[INFO] Applying PnP template [Portfolio_content] to [$Url]"
            Invoke-PnPSiteTemplate "$BasePath\Portfolio_content.$LanguageCode.pnp" -ErrorAction Stop
            Write-Host "[SUCCESS] Successfully applied PnP content template to [$Url]" -ForegroundColor Green
        }
        
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
    Write-Host "[SUCCESS] Successfully cleared QuickLaunch" -ForegroundColor Green
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
        Set-PnPSearchConfiguration -Scope Subscription -Path "$PSScriptRoot/SearchConfiguration.xml" -ErrorAction SilentlyContinue   
        Disconnect-PnPOnline
        Write-Host "[SUCCESS] Successfully imported Search Configuration" -ForegroundColor Green
    }
    Catch {
        Write-Host "[WARNING] Failed to import Search Configuration: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
#endregion


Connect-SharePoint -Url $Url -ErrorAction Stop

#region Post install
Write-Host "[INFO] Running post-install steps" 
try {
    ."$PSScriptRoot\Scripts\PostInstall.ps1"
    Write-Host "[SUCCESS] Successfully ran post-install steps" -ForegroundColor Green
}
catch {
    Write-Host "[WARNING] Failed to run post-install steps: $($_.Exception.Message)" -ForegroundColor Yellow
}

if ($Upgrade.IsPresent) {
    Write-Host "[INFO] Running post-install upgrade steps" 
    try {
        ."$PSScriptRoot\Scripts\PostInstallUpgrade.ps1"
        Write-Host "[SUCCESS] Successfully ran post-install upgrade steps" -ForegroundColor Green
    }
    catch {
        Write-Host "[WARNING] Failed to run post-install upgrade steps: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

$sw.Stop()

if ($null -eq $CI) {
    Write-Host "[REQUIRED ACTION] Go to $($AdminSiteUrl)/_layouts/15/online/AdminHome.aspx#/webApiPermissionManagement and approve the pending requests" -ForegroundColor Yellow
    Write-Host "[RECOMMENDED ACTION] Go to https://github.com/Puzzlepart/prosjektportalen365/wiki/Installasjon#steg-4-manuelle-steg-etter-installasjonen and verify post-install steps" -ForegroundColor Yellow
}

if ($Upgrade.IsPresent) {
    Write-Host "[SUCCESS] Upgrade completed in $($sw.Elapsed)" -ForegroundColor Green
}
else {
    Write-Host "[SUCCESS] Installation completed in $($sw.Elapsed)" -ForegroundColor Green
}
#endregion

#region Log installation
Write-Host "[INFO] Logged installation entry" 
$InstallEndTime = (Get-Date -Format o)

$InstallEntry = @{
    InstallStartTime = $InstallStartTime; 
    InstallEndTime   = $InstallEndTime; 
    InstallVersion   = "VERSION_PLACEHOLDER";
    InstallCommand   = $MyInvocation.Line.Substring(2);
}

if (-not [string]::IsNullOrEmpty($CI)) {
    $InstallEntry.InstallCommand = "GitHub CI";
}

Add-PnPListItem -List "Installasjonslogg" -Values $InstallEntry -ErrorAction SilentlyContinue >$null 2>&1
Disconnect-PnPOnline

$InstallEntry.InstallUrl = $Url

try { 
    Invoke-WebRequest "https://pp365-install-pingback.azurewebsites.net/api/AddEntry" -Body ($InstallEntry | ConvertTo-Json) -Method 'POST' -ErrorAction SilentlyContinue >$null 2>&1 
}
catch {}
#endregion

Set-PnPTraceLog -Off
$global:__InteractiveCachedAccessTokens = $null
