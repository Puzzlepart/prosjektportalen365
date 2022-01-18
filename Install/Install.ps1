[Diagnostics.CodeAnalysis.SuppressMessageAttribute("PSAvoidUsingPlainTextForPassword", "")]
Param(
    [Parameter(Mandatory = $true, HelpMessage = "N/A")]
    [string]$Url,
    [Parameter(Mandatory = $false, HelpMessage = "N/A")]
    [string]$Title = "Prosjektportalen",
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
    [Parameter(Mandatory = $false, HelpMessage = "Do you have PnP.PowerShell installed already?")]
    [switch]$SkipInstallPnPPowerShell,
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


$_connections = @{}
function Connect-SharePoint {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    $connection = $null

    if($null -ne $_connections[$Url] ) {
        $connection = $_connections[$Url]
    }

    else {
        Try {
            if (-not [string]::IsNullOrEmpty($CI)) {
                $DecodedCred = ([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($CI))).Split("|")
                $Password = ConvertTo-SecureString -String $DecodedCred[1] -AsPlainText -Force
                $Credentials = New-Object -TypeName System.Management.Automation.PSCredential -ArgumentList $DecodedCred[0], $Password
                $connection = Connect-PnPOnline -Url $Url -Credentials $Credentials -ErrorAction Stop  -WarningAction Ignore -ReturnConnection
            }
            else {
                $connection = Connect-PnPOnline -Url $Url -Interactive -ErrorAction Stop -WarningAction Ignore -ReturnConnection
            }
            Write-Host "[INFO] Connected to $($connection.Url)"
        }
        Catch {
            Write-Host "[INFO] Failed to connect to [$Url]: $($_.Exception.Message)"
            throw $_.Exception.Message
        }
    }

    return $connection

}

function Disconnect-SharePoint {
    $_connections | ForEach-Object {
        Write-Host "[INFO] Disconnecting from $($_.Url)"
        Disconnect-PnPOnline -Connection $_
    }
}

function EnsurePnPPowerShell() {
    if( $null -ne (get-module PnP.PowerShell -ListAvailable) ){
        # PnP.PowerShell is availiable, lets check the version number
        # TODO: Set version number as variable
        if ( (get-module PnP.PowerShell -ListAvailable).Version -lt [version]'1.9.0') {
            Update-Module PnP.PowerShell -Scope CurrentUser
        }   
    } else {
        Install-Module PnP.PowerShell -Scope CurrentUser
    }
    Import-Module PnP.PowerShell
    return (Get-Command Connect-PnPOnline).Version
}

if (-not [string]::IsNullOrEmpty($CI)) {
    Write-Host "[Running in CI mode. Installing module SharePointPnPPowerShellOnline.]" -ForegroundColor Yellow
    Install-Module -Name SharePointPnPPowerShellOnline -Force -Scope CurrentUser -ErrorAction Stop
}
else {
    if (-not $SkipInstallPnPPowerShell.IsPresent) {
        $PnPVersion = EnsurePnPPowerShell    
        Write-Host "[INFO] Loaded [SharePointPnPPowerShellOnline] v.$($PnPVersion)"
    }
    else {
        Write-Host "[INFO] Loaded [SharePointPnPPowerShellOnline] v.$((Get-Command Connect-PnPOnline).Version) from your environment"
    }
}


#region Setting variables
[System.Uri]$Uri = $Url
$ManagedPath = $Uri.Segments[1]
$Alias = $Uri.Segments[2].TrimEnd('/')
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")
#endregion

#region Print installation user
$AdminSite = @{
    Connection = Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
}
$Portfolio = $null

$CurrentUser = Get-PnPProperty @AdminSite -Property CurrentUser -ClientObject (Get-PnPContext).Web
Write-Host "[INFO] Installing with user [$($CurrentUser.Email)]"

#endregion

#region Check if URL specified is root site or admin site or invalid managed path
if ($Alias.Length -lt 2 -or (@("sites/", "teams/") -notcontains $ManagedPath) -or $Uri.Authority.Contains("-admin")) {
    Write-Host "[ERROR] It looks like you're trying to install to a root site or an invalid site. This is not supported." -ForegroundColor Red
    exit 0
}
#endregion

Set-PnPTraceLog -On -Level Debug -LogFile Install_Log.txt  

#region Create site
if (-not $SkipSiteCreation.IsPresent -and -not $Upgrade.IsPresent) {
    Try {

        $PortfolioSite = Get-PnPTenantSite @AdminSite -Url $Url -ErrorAction SilentlyContinue
        if ($null -eq $PortfolioSite) {
            Write-Host "[INFO] Creating portfolio site at [$Url]"
            New-PnPSite @AdminSite -Type TeamSite -Title $Title -Alias $Alias -IsPublic:$true -ErrorAction Stop -Lcid $LanguageId >$null 2>&1
            Write-Host "[SUCCESS] Portfolio site created at [$Url]" -ForegroundColor Green
        }
        Register-PnPHubSite @AdminSite -Site $Url -ErrorAction SilentlyContinue
        Write-Host "[SUCCESS] Portfolio site [$Url] promoted to hub site" -ForegroundColor Green
    }
    Catch {
        Write-Host "[ERROR] Failed to create site and promote to hub site: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}

$Portfolio = @{
    Connection = Connect-SharePoint -Url $Url -ErrorAction Stop
}
#endregion

#region Setting permissons
if (-not $Upgrade.IsPresent) {
    Try {
        Write-Host "[INFO] Setting permissions for associated member group"

        # Must use english names to avoid errors, even on non 1033 sites
        # Where-Object doesn't work directly on Get-PnPRoleDefinition, so need to clone it first (https://github.com/Puzzlepart/prosjektportalen365/issues/35)
        $RoleDefinitions = @()
        Get-PnPRoleDefinition @Portfolio -ErrorAction SilentlyContinue | ForEach-Object { $RoleDefinitions += $_ }
        Set-PnPGroupPermissions @Portfolio -Identity (Get-PnPGroup @Portfolio -AssociatedMemberGroup) -RemoveRole ($RoleDefinitions | Where-Object { $_.RoleTypeKind -eq "Editor" }) -ErrorAction SilentlyContinue
        Set-PnPGroupPermissions @Portfolio -Identity (Get-PnPGroup @Portfolio -AssociatedMemberGroup) -AddRole ($RoleDefinitions | Where-Object { $_.RoleTypeKind -eq "Reader" }) -ErrorAction SilentlyContinue    
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
        $SiteScripts = Get-PnPSiteScript @AdminSite
        $SiteScriptSrc = Get-ChildItem "$PSScriptRoot/SiteScripts/*.txt"
        foreach ($s in $SiteScriptSrc) {
            $Title = $s.BaseName.Substring(9)
            $Content = (Get-Content -Path $s.FullName -Raw | Out-String)
            $SiteScript = $SiteScripts | Where-Object { $_.Title -eq $Title }
            if ($null -ne $SiteScript) {
                Set-PnPSiteScript @AdminSite -Identity $SiteScript -Content $Content >$null 2>&1
            }
            else {
                $SiteScript = Add-PnPSiteScript @AdminSite -Title $Title -Content $Content
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
    
        $SiteDesign = Get-PnPSiteDesign @AdminSite -Identity $SiteDesignName 

        if ($null -ne $SiteDesign) {
            $SiteDesign = Set-PnPSiteDesign @AdminSite -Identity $SiteDesign -SiteScriptIds $SiteScriptIds -Description $SiteDesignDesc -Version "1"
        }
        else {
            $SiteDesign = Add-PnPSiteDesign @AdminSite -Title $SiteDesignName -SiteScriptIds $SiteScriptIds -Description $SiteDesignDesc -WebTemplate TeamSite
        }
        if ([string]::IsNullOrEmpty($SiteDesignSecurityGroupId)) {
            Write-Host "[INFO] You have not specified -SiteDesignSecurityGroupId. Everyone will have View access to site design [$SiteDesignName]" -ForegroundColor Yellow
        }
        else {            
            Write-Host "[INFO] Granting group $SiteDesignSecurityGroupId View access to site design [$SiteDesignName]"
            Grant-PnPSiteDesignRights @AdminSite -Identity $SiteDesign.Id.Guid -Principals @("c:0t.c|tenant|$SiteDesignSecurityGroupId")
        }
        Write-Host "[SUCCESS] Successfully created/updated site design [$SiteDesignName]" -ForegroundColor Green
    }
    Catch {
        Write-Host "[ERROR] Failed to create/update site design: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
if (-not $SkipDefaultSiteDesignAssociation.IsPresent) {
    $SiteDesign = Get-PnPSiteDesign @AdminSite -Identity $SiteDesignName 
    Write-Host "[INFO] Setting default site design for hub [$Url] to [$SiteDesignName]"
    Set-PnPHubSite @AdminSite -Identity $Url -SiteDesignId $SiteDesign.Id.Guid
}
#endregion

#region Remove pages with deprecated client side components
# TODO Fix Upgrade actions with connection handling
if ($Upgrade.IsPresent) {
    Try {
        Connect-SharePoint -Url $Url -ErrorAction Stop
        Write-Host "[INFO] Removing deprecated pages"    
        ."$PSScriptRoot\Scripts\RemoveDeprecatedPages.ps1"
        Disconnect-PnPOnline
        Write-Host "[SUCCESS] Removed deprecated pages" -ForegroundColor Green
    }
    Catch {}
}
#endregion

#region Install app packages
if (-not $SkipAppPackages.IsPresent) {
    $TenantAppCatalog = $null
    Try {
        if (-not $TenantAppCatalogUrl) {
            $TenantAppCatalogUrl = Get-PnPTenantAppCatalogUrl @AdminSite -ErrorAction SilentlyContinue
        }
        $TenantAppCatalog = @{
            Connection = Connect-SharePoint -Url $TenantAppCatalogUrl -ErrorAction Stop
        }
    }
    Catch {
        Write-Host "[ERROR] Failed to connect to Tenant App Catalog. Do you have a Tenant App Catalog in your tenant?" -ForegroundColor Red
        exit 0 
    }
    Try {
        Write-Host "[INFO] Installing SharePoint Framework app packages to [$TenantAppCatalogUrl]"
        foreach ($AppPkg in (Get-ChildItem "$PSScriptRoot\Apps" -ErrorAction SilentlyContinue)) {
            Write-Host "[INFO] Installing $($AppPkg.BaseName)..."  -NoNewline
            Add-PnPApp @TenantAppCatalog -Path $AppPkg.FullName -Scope Tenant -Publish -Overwrite -SkipFeatureDeployment -ErrorAction Stop >$null 2>&1
            Write-Host " DONE" -ForegroundColor Green
        }
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
        Remove-PnPFile @Portfolio -ServerRelativeUrl "$($Uri.LocalPath)/SitePages/Home.aspx" -Recycle -Force
    }
    Catch {}
}
#endregion

#region Applying PnP templates 
if (-not $SkipTemplate.IsPresent) {
    Try {
        $BasePath = $PSScriptRoot + [IO.Path]::DirectorySeparatorChar + "Templates"
        Set-PnPTenantSite @AdminSite -NoScriptSite:$false -Url $Url -ErrorAction SilentlyContinue >$null 2>&1

        if (-not $SkipTaxonomy.IsPresent -and -not $Upgrade.IsPresent) {
            Write-Host "[INFO] Applying PnP template [Taxonomy] to [$Url]"
            Invoke-PnPSiteTemplate @Portfolio ($BasePath + [IO.Path]::DirectorySeparatorChar + "Taxonomy.pnp") -ErrorAction Stop
            Write-Host "[SUCCESS] Successfully applied PnP template [Taxonomy] to [$Url]" -ForegroundColor Green
        }
        
        Write-Host "[INFO] Applying PnP template [Portfolio] to [$Url]"
        # $UILanguage = [PnP.Framework.Provisioning.Model.SupportedUILanguage]::new()
        # $UILanguage.LCID = $LanguageId

        # $Instance = Read-PnPSiteTemplate ($BasePath + [IO.Path]::DirectorySeparatorChar + "Portfolio.pnp")
        # $Instance.SupportedUILanguages = @($UILanguage)
        # Invoke-PnPSiteTemplate @Portfolio -InputInstance $Instance -Handlers SupportedUILanguages
        Invoke-PnPSiteTemplate @Portfolio ($BasePath + [IO.Path]::DirectorySeparatorChar + "Portfolio.pnp") -ErrorAction Stop
        
        Write-Host "[SUCCESS] Successfully applied PnP template [Portfolio] to [$Url]" -ForegroundColor Green

        if ($Upgrade.IsPresent) {
            Write-Host "[INFO] Applying PnP content template (Handlers:Files) to [$Url]"
            Invoke-PnPSiteTemplate @Portfolio ($BasePath + [IO.Path]::DirectorySeparatorChar + "Portfolio_content.$LanguageCode.pnp") -Handlers Files -ErrorAction Stop
            Write-Host "[SUCCESS] Successfully applied PnP content template to [$Url]" -ForegroundColor Green
        }
        else {
            Write-Host "[INFO] Applying PnP content template to [$Url]"
            Invoke-PnPSiteTemplate @Portfolio ($BasePath + [IO.Path]::DirectorySeparatorChar + "Portfolio_content.$LanguageCode.pnp") -ErrorAction Stop
            Write-Host "[SUCCESS] Successfully applied PnP content template to [$Url]" -ForegroundColor Green
        }

        Set-PnPTenantSite @AdminSite -NoScriptSite:$true -Url $Url -ErrorAction SilentlyContinue >$null 2>&1

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
    Get-PnPNavigationNode @Portfolio -Location QuickLaunch | Remove-PnPNavigationNode -Force
    Write-Host "[SUCCESS] Successfully cleared QuickLaunch" -ForegroundColor Green
}
Catch {
    Write-Host "[WARNING] Failed to clear QuickLaunch: $($_.Exception.Message)" -ForegroundColor Yellow
}
#endregion

#region Search Configuration 
if (-not $SkipSearchConfiguration.IsPresent) {
    Try {
        Write-Host "[INFO] Importing Search Configuration"    
        Set-PnPSearchConfiguration @AdminSite -Scope Subscription -Path ($PSScriptRoot + [IO.Path]::DirectorySeparatorChar + "SearchConfiguration.xml") -ErrorAction SilentlyContinue   
        Write-Host "[SUCCESS] Successfully imported Search Configuration" -ForegroundColor Green
    }
    Catch {
        Write-Host "[WARNING] Failed to import Search Configuration: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
#endregion

# TODO Handle post-install
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

Add-PnPListItem @Portfolio -List "Installasjonslogg" -Values $InstallEntry -ErrorAction SilentlyContinue >$null 2>&1

$InstallEntry.InstallUrl = $Url

try { 
    Invoke-WebRequest "https://pp365-install-pingback.azurewebsites.net/api/AddEntry" -Body ($InstallEntry | ConvertTo-Json) -Method 'POST' -ErrorAction SilentlyContinue >$null 2>&1 
}
catch {}
#endregion