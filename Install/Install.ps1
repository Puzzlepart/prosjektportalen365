[Diagnostics.CodeAnalysis.SuppressMessageAttribute("PSAvoidUsingPlainTextForPassword", "")]
Param(
    [Parameter(Mandatory = $true, HelpMessage = "N/A")]
    [string]$Url,
    [Parameter(Mandatory = $false, HelpMessage = "N/A")]
    [string]$Title = "Prosjektportalen",
    [Parameter(Mandatory = $false, HelpMessage = "Client ID of the Entra Id application used for interactive logins. Defaults to the multi-tenant Prosjektportalen app. In case of certificate-based authentication, this should be the Application ID of the Azure AD app.")]
    [string]$ClientId = "da6c31a6-b557-4ac3-9994-7315da06ea3a",
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
    [Parameter(Mandatory = $false, HelpMessage = "Site design description")]
    [string]$SiteDesignDescription = "Samarbeid i et prosjektomr%C3%A5de fra Prosjektportalen",
    [Parameter(Mandatory = $false, HelpMessage = "Site design description for channel installations")]
    [string]$SiteDesignDescriptionChannel = "Denne malen brukes n%C3%A5r det opprettes prosjekter under en {0}-kanal installasjon av Prosjektportalen",
    [Parameter(Mandatory = $false, HelpMessage = "Security group to give View access to site design")]
    [string]$SiteDesignSecurityGroupId,
    [Parameter(Mandatory = $false, HelpMessage = "Tenant App Catalog Url")]
    [string]$TenantAppCatalogUrl,
    [Parameter(Mandatory = $false, HelpMessage = "Language")]
    [ValidateSet('Norwegian', 'English')]
    [string]$Language = "Norwegian",
    [Parameter(Mandatory = $false, HelpMessage = "Used by Continuous Integration")]
    [switch]$CI,
    [Parameter(Mandatory = $false, HelpMessage = "Tenant in case of certificate based authentication")]
    [string]$Tenant,
    [Parameter(Mandatory = $false, HelpMessage = "Base64 encoded certificate")]
    [string]$CertificateBase64Encoded,
    [Parameter(Mandatory = $false, HelpMessage = "Do you want to include Bygg & Anlegg content (only when upgrading)")]
    [switch]$IncludeBAContent,
    [Parameter(Mandatory = $false, HelpMessage = "Which handlers to exclude when performing an upgrade")]
    [string[]]$UpgradeExcludeHandlers = @("Navigation", "SupportedUILanguages", "Files")
)

. "$PSScriptRoot/Scripts/SharedFunctions.ps1"

$ConnectionInfo = [PSCustomObject]@{
    ClientId                 = $ClientId
    CI                       = $CI.IsPresent
    Tenant                   = $Tenant
    CertificateBase64Encoded = $CertificateBase64Encoded
}

#region Handling installation language and culture
$LanguageIds = @{
    "Norwegian"    = 1044;
    "English"      = 1033;
}

$LanguageCodes = @{
    "Norwegian"    = 'no-NB';
    "English"      = 'en-US';
}

$Channel = "{CHANNEL_PLACEHOLDER}"
$LanguageId = $LanguageIds[$Language]
$LanguageCode = $LanguageCodes[$Language]
. "$PSScriptRoot/Scripts/Resources.ps1"
#endregion

$ErrorActionPreference = "Stop"
$sw = [Diagnostics.Stopwatch]::StartNew()
$global:sw_action = $null
$InstallStartTime = (Get-Date -Format o)


Write-Host "########################################################" -ForegroundColor Cyan
Write-Host "### $($Upgrade.IsPresent ? "Upgrading" : "Installing") Prosjektportalen 365 v{VERSION_PLACEHOLDER} ####" -ForegroundColor Cyan
if ($Channel -ne "main") {
    Write-Host "### Channel: $Channel ####" -ForegroundColor Cyan
}
if ($Language -ne "Norwegian") {
    Write-Host "### Language: $Language ####" -ForegroundColor Cyan
}
if ($CI.IsPresent) {
    Write-Host "### Running in Continuous Integration mode ####" -ForegroundColor Cyan
}
Write-Host "########################################################" -ForegroundColor Cyan


if ($CI.IsPresent -and $null -eq (Get-Module -Name PnP.PowerShell)) {
    Write-Host "[Running in CI mode. Installing module PnP.PowerShell.]" -ForegroundColor Yellow
    Install-Module -Name PnP.PowerShell -Force -Scope CurrentUser -ErrorAction Stop -RequiredVersion 2.12.0
    $Version = (Get-Command Connect-PnPOnline).Version
    Write-Host "[INFO] Installed module PnP.PowerShell v$($Version) from PowerShell Gallery"
}
else {
    if (-not $SkipLoadingBundle.IsPresent) {
        $PnPVersion = LoadBundle -Version 2.12.0
        Write-Host "[INFO] Loaded module PnP.PowerShell v$($PnPVersion) from bundle"
    }
    else {
        Write-Host "[INFO] Loaded PnP.PowerShell v$((Get-Command Connect-PnPOnline).Version) from your environment"
    }
}

#region Setting variables based on input from user
[System.Uri]$Uri = $Url.TrimEnd('/')
$ManagedPath = $Uri.Segments[1]
$Alias = $Uri.Segments[2]
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")
$TemplatesBasePath = "$PSScriptRoot/Templates"
#endregion

#region Print installation user
Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
$CurrentUser = Get-PnPProperty -Property CurrentUser -ClientObject (Get-PnPContext).Web -ErrorAction SilentlyContinue
if ($null -ne $CurrentUser -and $CurrentUser.LoginName) {
    Write-Host "[INFO] Installing with user [$($CurrentUser.LoginName)]"
}
else {
    Write-Host "[WARNING] Failed to get current user. Assuming installation is done with an app or a service principal without e-mail." -ForegroundColor Yellow
}

#endregion

#region Check if URL specified is root site or admin site or invalid managed path
if ($Alias.Length -lt 2 -or (@("sites/", "teams/") -notcontains $ManagedPath) -or $Uri.Authority.Contains("-admin")) {
    Write-Host "[ERROR] It looks like you're trying to install to a root site or an invalid site. This is not supported." -ForegroundColor Red
    exit 0
}
#endregion

$LogFilePath = "$PSScriptRoot/Install_Log_$([datetime]::Now.ToString("yy-MM-ddThh-mm-ss")).txt"
Set-PnPTraceLog -On -Level Debug -LogFile $LogFilePath

#region Create site
if (-not $SkipSiteCreation.IsPresent -and -not $Upgrade.IsPresent) {
    Try {
        Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
        $PortfolioSite = Get-PnPTenantSite -Url $Uri.AbsoluteUri -ErrorAction SilentlyContinue
        if ($null -eq $PortfolioSite) {
            StartAction("Creating portfolio site at $($Uri.AbsoluteUri)")
            $PortfolioSite = New-PnPSite -Type TeamSite -Title $Title -Alias $Alias -IsPublic:$true -ErrorAction Stop -Lcid $LanguageId
            EndAction
        }
    }
    Catch {
        Write-Host "[ERROR] Failed to create site: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
#endregion

#region Promote site to hub site
if (-not $Upgrade.IsPresent) {
    Try {
        Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
        StartAction("Promoting $($Uri.AbsoluteUri) to hubsite")
        Register-PnPHubSite -Site $Uri.AbsoluteUri -ErrorAction SilentlyContinue >$null 2>&1
        EndAction
    }
    Catch {
        Write-Host "[ERROR] Failed to promote site to hub site: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
#endregion

#region Setting permissions
if (-not $Upgrade.IsPresent) {
    Try {
        StartAction("Setting permissions for associated member group")
        Connect-SharePoint -Url $Uri.AbsoluteUri -ConnectionInfo $ConnectionInfo
        # Must use english names to avoid errors, even on non 1033 sites
        # Where-Object doesn't work directly on Get-PnPRoleDefinition, so need to clone it first (https://github.com/Puzzlepart/prosjektportalen365/issues/35)
        $RoleDefinitions = @()
        Get-PnPRoleDefinition -ErrorAction SilentlyContinue | ForEach-Object { $RoleDefinitions += $_ }
        Set-PnPGroupPermissions -Identity (Get-PnPGroup -AssociatedMemberGroup) -RemoveRole ($RoleDefinitions | Where-Object { $_.RoleTypeKind -eq "Editor" }) -ErrorAction SilentlyContinue
        Set-PnPGroupPermissions -Identity (Get-PnPGroup -AssociatedMemberGroup) -AddRole ($RoleDefinitions | Where-Object { $_.RoleTypeKind -eq "Reader" }) -ErrorAction SilentlyContinue    
        EndAction
    }
    Catch {
        Write-Host "[ERROR] Failed to set permissions for associated member group: $($_.Exception.Message)" -ForegroundColor Red
    }
}
#endregion


#region Creating/updating site design
$SiteDesignName = [Uri]::UnescapeDataString($SiteDesignName)
$SiteDesignDescription = [Uri]::UnescapeDataString($SiteDesignDescription)
$SiteDesignThumbnail = "https://publiccdn.sharepointonline.com/prosjektportalen.sharepoint.com/sites/ppassets/Thumbnails/prosjektomrade.png"

# Add channel to name for the site design if channel is specified and not main
if ($Channel -ne "main") {
    $SiteDesignName = [Uri]::UnescapeDataString($SiteDesignName) + " [$Channel]"
    $SiteDesignDescription = [string]::Format($SiteDesignDescriptionChannel, $Channel)
    $SiteDesignDescription = [Uri]::UnescapeDataString($SiteDesignDescription)
    $SiteDesignThumbnail = "https://publiccdn.sharepointonline.com/prosjektportalen.sharepoint.com/sites/ppassets/Thumbnails/prosjektomrade-test.png"
}

if (-not $SkipSiteDesign.IsPresent) {
    $SiteScriptIds = @()

    Try {
        StartAction("Creating/updating site scripts")  
        Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
        $SiteScripts = Get-PnPSiteScript
        $SiteScriptSrc = Get-ChildItem "$PSScriptRoot/SiteScripts/*.txt"
        foreach ($s in $SiteScriptSrc) {
            $Title = $s.BaseName.Substring(9)
            # Add channel to name for the site script if channel is specified and not main
            if ($Channel -ne "main") {
                $Title += " - $Channel"
            }
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
        EndAction
    }
    Catch {
        Write-Host "[ERROR] Failed to create/update site scripts: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }

    Try {
        StartAction("Creating/updating site design $SiteDesignName")
        Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
    
        Get-PnPSiteDesign | Where-Object {$_.Title.Contains("Prosjektområde - test")} | Remove-PnPSiteDesign -Force -ErrorAction SilentlyContinue >$null 2>&1

        $SiteDesign = Get-PnPSiteDesign -Identity $SiteDesignName


        if ($null -ne $SiteDesign) {
            $SiteDesign = Set-PnPSiteDesign -Identity $SiteDesign -SiteScriptIds $SiteScriptIds -Description $SiteDesignDescription -Version "1" -ThumbnailUrl $SiteDesignThumbnail
        }
        else {
            $SiteDesign = Add-PnPSiteDesign -Title $SiteDesignName -SiteScriptIds $SiteScriptIds -Description $SiteDesignDescription -WebTemplate TeamSite -ThumbnailUrl $SiteDesignThumbnail
        }
        if (-not [string]::IsNullOrEmpty($SiteDesignSecurityGroupId)) {         
            Grant-PnPSiteDesignRights -Identity $SiteDesign.Id.Guid -Principals @("c:0t.c|tenant|$SiteDesignSecurityGroupId")
        }
        EndAction
    }
    Catch {
        Write-Host "[ERROR] Failed to create/update site design: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
if (-not $SkipDefaultSiteDesignAssociation.IsPresent) {
    StartAction("Setting default site design for hub $($Uri.AbsoluteUri) to $SiteDesignName")
    try {
        Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
        $SiteDesign = Get-PnPSiteDesign -Identity $SiteDesignName 
        Set-PnPHubSite -Identity $Uri.AbsoluteUri -SiteDesignId $SiteDesign.Id.Guid
    }
    catch {
        Write-Host ""
        Write-Host "[WARNING] Failed to set default site design: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    EndAction
}

try {
    StartAction("Ensuring site collection administrator access to $Url")
    $UserName = $CurrentUser.LoginName

    Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
    Set-PnPTenantSite -Url $Url -Owners $UserName -ErrorAction SilentlyContinue
}
catch {
    Write-Host "Failed to get current user. Unable to ensure access to $Url." -ForegroundColor Yellow
}
finally {
    EndAction
}

#endregion

#region Running pre-install upgrade steps
if ($Upgrade.IsPresent) {
    Write-Host "[INFO] Running pre-install upgrade steps"
    try {
        Connect-SharePoint -Url $Uri.AbsoluteUri -ConnectionInfo $ConnectionInfo
        ."$PSScriptRoot/Scripts/PreInstallUpgrade.ps1"
    }
    catch {
        Write-Host "[ERROR] Failed to run pre-install upgrade steps: $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
#endregion

#region Install app packages
if (-not $SkipAppPackages.IsPresent) {
    Try {
        if (-not $TenantAppCatalogUrl) {
            Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
            $TenantAppCatalogUrl = Get-PnPTenantAppCatalogUrl -ErrorAction SilentlyContinue
            Set-PnPTenantSite -Url $TenantAppCatalogUrl -Owners $UserName -ErrorAction SilentlyContinue
        }
        Connect-SharePoint -Url $TenantAppCatalogUrl -ConnectionInfo $ConnectionInfo
    }
    Catch {
        Write-Host "[ERROR] Failed to connect to Tenant App Catalog. Do you have a Tenant App Catalog in your tenant?" -ForegroundColor Red
        exit 0 
    }
    Try {
        StartAction("Installing SharePoint Framework app packages to $TenantAppCatalogUrl")
        foreach ($AppPkg in (Get-ChildItem "$PSScriptRoot/Apps/*.sppkg" -ErrorAction SilentlyContinue)) {
            Add-PnPApp -Path $AppPkg.FullName -Scope Tenant -Publish -Overwrite -SkipFeatureDeployment -ErrorAction Stop >$null 2>&1
        }
        EndAction
    }
    Catch {
        Write-Host "[ERROR] Failed to install app packages to $($TenantAppCatalogUrl): $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
#endregion

#region Remove existing Home.aspx
if (-not $Upgrade.IsPresent) {
    Try {
        Connect-SharePoint -Url $Uri.AbsoluteUri -ConnectionInfo $ConnectionInfo
        Remove-PnPClientSidePage -Identity Home.aspx -Force
    }
    Catch {
        Write-Host "[WARNING] Failed to delete page Home.aspx. Please delete it manually." -ForegroundColor Yellow
    }
}
#endregion

#region Applying PnP templates 
if (-not $SkipTemplate.IsPresent) {
    Try {
        Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
        Set-PnPTenantSite -NoScriptSite:$false -Url $Uri.AbsoluteUri -ErrorAction SilentlyContinue >$null 2>&1

        Connect-SharePoint -Url $Uri.AbsoluteUri -ConnectionInfo $ConnectionInfo

        # Applying additional check that we're connected to the correct site before applying templates
        $CurrentContext = Get-PnPContext
        if ($CurrentContext.Url -ne $Uri.AbsoluteUri) {
            Write-Host "[ERROR] Attempted to install to $($Uri.AbsoluteUri) but connection was active against $($CurrentContext.Url)"
            throw "Wrong connection identified - you are not connected to the correct site"
        }
        if (-not $SkipTaxonomy.IsPresent -and -not $Upgrade.IsPresent) {
            StartAction("Applying PnP template Taxonomy to $($Uri.AbsoluteUri)")
            Invoke-PnPSiteTemplate "$TemplatesBasePath/Taxonomy.pnp" -ErrorAction Stop -WarningAction SilentlyContinue
            Invoke-PnPSiteTemplate "$TemplatesBasePath/TaxonomyBA.pnp" -ErrorAction Stop -WarningAction SilentlyContinue
            EndAction
        }
        elseif (-not $SkipTaxonomy.IsPresent -and $Upgrade.IsPresent) {
            $TermSetA = Get-PnPTermSet -Identity "cc6cdd18-c7d5-42e1-8d19-a336dd78f3f2" -TermGroup "Prosjektportalen" -ErrorAction SilentlyContinue
            $TermSetB = Get-PnPTermSet -Identity "ec5ceb95-7259-4282-811f-7c57304be71e" -TermGroup "Prosjektportalen" -ErrorAction SilentlyContinue
            if (-not $TermSetA -or -not $TermSetB) {
                StartAction("Applying PnP template Taxonomy (B&A) to $($Uri.AbsoluteUri)")
                Invoke-PnPSiteTemplate "$TemplatesBasePath/TaxonomyBA.pnp" -ErrorAction Stop -WarningAction SilentlyContinue
                EndAction
            }
        }

        if ($Upgrade.IsPresent) {
            StartAction("Applying PnP template Portfolio to $($Uri.AbsoluteUri)")
            $Retry = 0
            $MaxRetries = 5
            while($Retry -lt $MaxRetries) {
                try {
                    Invoke-PnPSiteTemplate "$TemplatesBasePath/Portfolio.pnp" -ExcludeHandlers $UpgradeExcludeHandlers -ErrorAction Stop -WarningAction SilentlyContinue
                    break
                }
                catch {
                    Write-Host "`t[WARNING] Failed to apply PnP Portfolio template, retrying $($MaxRetries - $Retry) times..." -ForegroundColor Yellow
                    $Retry++
                    if ($Retry -eq $MaxRetries) {
                        Write-Host "[ERROR] Failed to apply PnP Portfolio template after $MaxRetries attempts" -ForegroundColor Red
                        throw
                    }
                }
            }
            EndAction

            if(Test-Path "$TemplatesBasePath/Portfolio_content.$LanguageCode.pnp") {
                StartAction("Applying PnP content template to $($Uri.AbsoluteUri)")
                Invoke-PnPSiteTemplate "$TemplatesBasePath/Portfolio_content.$LanguageCode.pnp" -Handlers Files -ErrorAction Stop -WarningAction SilentlyContinue
                EndAction
            } else {
                Write-Host "[WARNING] No content template found for language $LanguageCode. Skipping content template." -ForegroundColor Yellow
            }

            if ($IncludeBAContent.IsPresent -and (Test-Path "$TemplatesBasePath/Portfolio_content_BA.$LanguageCode.pnp")) {
                StartAction("Applying PnP B&A content template to $($Uri.AbsoluteUri)")
                Invoke-PnPSiteTemplate "$TemplatesBasePath/Portfolio_content_BA.$LanguageCode.pnp" -ErrorAction Stop -WarningAction SilentlyContinue
                EndAction
            }
        }
        else {
            StartAction("Applying PnP template Portfolio to $($Uri.AbsoluteUri)")
            $Instance = Read-PnPSiteTemplate "$TemplatesBasePath/Portfolio.pnp"
            $Instance.SupportedUILanguages[0].LCID = $LanguageId
            Invoke-PnPSiteTemplate -InputInstance $Instance -Handlers SupportedUILanguages
            $Retry = 0
            $MaxRetries = 5
            while($Retry -lt $MaxRetries) {
                try {                
                    Invoke-PnPSiteTemplate "$TemplatesBasePath/Portfolio.pnp" -ExcludeHandlers SupportedUILanguages -ErrorAction Stop -WarningAction SilentlyContinue
                    break
                }
                catch {
                    Write-Host "`t[WARNING] Failed to apply PnP Portfolio template, retrying $($MaxRetries - $Retry) times..." -ForegroundColor Yellow
                    $Retry++
                    if ($Retry -eq $MaxRetries) {
                        Write-Host "[ERROR] Failed to apply PnP Portfolio template after $MaxRetries attempts" -ForegroundColor Red
                        throw
                    }
                }
            }
            EndAction

            if (Test-Path "$TemplatesBasePath/Portfolio_content.$LanguageCode.pnp") {
                StartAction("Applying PnP content template to $($Uri.AbsoluteUri)")
                Invoke-PnPSiteTemplate "$TemplatesBasePath/Portfolio_content.$LanguageCode.pnp" -Handlers Files -ErrorAction Stop -WarningAction SilentlyContinue
                EndAction
            }

            if (Test-Path "$TemplatesBasePath/Portfolio_content_BA.$LanguageCode.pnp") {
                StartAction("Applying PnP B&A content template to $($Uri.AbsoluteUri)")
                Invoke-PnPSiteTemplate "$TemplatesBasePath/Portfolio_content_BA.$LanguageCode.pnp" -ErrorAction Stop -WarningAction SilentlyContinue
                EndAction
            }
        }
        

        Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
        Set-PnPTenantSite -NoScriptSite:$true -Url $Uri.AbsoluteUri -ErrorAction SilentlyContinue >$null 2>&1
    }
    Catch {
        Write-Host "[ERROR] Failed to apply PnP templates to $($Uri.AbsoluteUri): $($_.Exception.Message)" -ForegroundColor Red
        exit 0
    }
}
#endregion

#region QuickLaunch 
Try {
    Connect-SharePoint -Url $Uri.AbsoluteUri -ConnectionInfo $ConnectionInfo
    StartAction("Clearing QuickLaunch")
    Get-PnPNavigationNode -Location QuickLaunch | Remove-PnPNavigationNode -Force
    EndAction
}
Catch {
    Write-Host "[WARNING] Failed to clear QuickLaunch: $($_.Exception.Message)" -ForegroundColor Yellow
}
#endregion

#region Search Configuration 
if (-not $SkipSearchConfiguration.IsPresent) {
    Try {
        Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
        StartAction("Importing Search Configuration")
        Set-PnPSearchConfiguration -Scope Subscription -Path "$PSScriptRoot/SearchConfiguration.xml" -ErrorAction SilentlyContinue
        EndAction
    }
    Catch {
        Write-Host "[WARNING] Failed to import Search Configuration: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
#endregion

#region Post install - running post-install scripts and applying PnP templates
Write-Host "[INFO] Running post-install steps" 
Connect-SharePoint -Url $Uri.AbsoluteUri -ConnectionInfo $ConnectionInfo
try {
    ."$PSScriptRoot/Scripts/PostInstall.ps1"
    Write-Host "[SUCCESS] Successfully ran post-install steps" -ForegroundColor Green
}
catch {
    Write-Host "[WARNING] Failed to run post-install steps: $($_.Exception.Message)" -ForegroundColor Yellow
}

if ($Upgrade.IsPresent) {
    Write-Host "[INFO] Running post-install upgrade steps" 
    try {
        ."$PSScriptRoot/Scripts/PostInstallUpgrade.ps1"
        Write-Host "[SUCCESS] Successfully ran post-install upgrade steps" -ForegroundColor Green
    }
    catch {
        Write-Host "[WARNING] Failed to run post-install upgrade steps: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

$sw.Stop()

if ($Upgrade.IsPresent) {
    Write-Host "[SUCCESS] Upgrade completed in $($sw.Elapsed.ToString('hh\:mm\:ss'))" -ForegroundColor Green
}
else {
    if (-not $CI.IsPresent) {
        Write-Host "[REQUIRED ACTION] Go to $($AdminSiteUrl)/_layouts/15/online/AdminHome.aspx#/webApiPermissionManagement and approve the pending requests" -ForegroundColor Yellow
        Write-Host "[RECOMMENDED ACTION] Go to https://github.com/Puzzlepart/prosjektportalen365/wiki/Installasjon#steg-4-manuelle-steg-etter-installasjonen and verify post-install steps" -ForegroundColor Yellow
    }
    Write-Host "[SUCCESS] Installation completed in $($sw.Elapsed.ToString('hh\:mm\:ss'))" -ForegroundColor Green
}
Write-Host "[INFO] Consider running .\Install\Scripts\UpgradeAllSitesToLatest.ps1 to upgrade all sites to the latest version of Prosjektportalen 365."
Write-Host "[INFO] This is required after upgrading between minor versions, e.g. from 1.10.x to 1.11.x."
#endregion

#region Log installation and send pingback to Azure Function
Write-Host "[INFO] Logging installation entry" 
$InstallEndTime = (Get-Date -Format o)

$InstallEntry = @{
    Title            = "PP365 {VERSION_PLACEHOLDER}"
    InstallStartTime = $InstallStartTime; 
    InstallEndTime   = $InstallEndTime; 
    InstallVersion   = "{VERSION_PLACEHOLDER}";
    InstallCommand   = $MyInvocation.Line.Substring(2);
    InstallChannel   = $Channel;
}

if ($null -ne $CurrentUser -and $CurrentUser.LoginName) {
    $InstallEntry.InstallUser = $CurrentUser.LoginName
}

if ($CI.IsPresent) {
    $InstallEntry.InstallCommand = "GitHub CI";
}

try {
    $InstallationEntriesList = Get-PnPList -Identity (Get-Resource -Name "Lists_InstallationLog_Title") -ErrorAction Stop

    ## Logging installation to SharePoint list
    $InstallationEntry = Add-PnPListItem -List $InstallationEntriesList.Id -Values $InstallEntry -ErrorAction Continue

    ## Attempting to attach the log file to installation entry
    if ($null -ne $InstallationEntry) {
        $File = Get-Item -Path $LogFilePath
        if ($null -ne $File -and $File.Length -gt 0) {
            Write-Host "[INFO] Attaching installation log file to installation entry"
            $AttachmentOutput = Add-PnPListItemAttachment -List $InstallationEntriesList.Id -Identity $InstallationEntry.Id -Path $LogFilePath -ErrorAction Continue
        }    
    }
} catch {
    Write-Host "[WARNING] Installation log list not found. Skipping logging installation entry." -ForegroundColor Yellow
}

Disconnect-PnPOnline

$InstallEntry.InstallUrl = $Uri.AbsoluteUri

try { 
    Invoke-WebRequest "https://pp365-install-pingback.azurewebsites.net/api/AddEntry" -Body ($InstallEntry | ConvertTo-Json) -Method 'POST' -ErrorAction SilentlyContinue >$null 2>&1 
}
catch {}
#endregion
