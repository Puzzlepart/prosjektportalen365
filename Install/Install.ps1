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
    [Parameter(Mandatory = $false, HelpMessage = "Which handlers to exclude when performing an upgrade")]
    [string[]]$UpgradeExcludeHandlers = @("Navigation", "SupportedUILanguages", "Files"),
    [Parameter(Mandatory = $false, HelpMessage = "Never wait for keyboard input (countdowns and prompts are skipped). Implied by -CI.")]
    [switch]$NonInteractive
)

# This block must stay parseable by Windows PowerShell 5.1 so users get guidance instead of a syntax error.
# Keep PowerShell 7-only syntax out of this file; the dot-sourced scripts are only loaded after the check.
if ($PSVersionTable.PSVersion -lt [version]"7.4") {
    Write-Host "[ERROR] Prosjektportalen 365 must be installed with PowerShell 7.4 or newer. You are running PowerShell $($PSVersionTable.PSVersion) ($($PSVersionTable.PSEdition))." -ForegroundColor Red
    Write-Host "        Install PowerShell 7 in one of these ways, then open a new PowerShell 7 window (pwsh) and run the script again:" -ForegroundColor Red
    Write-Host "          - winget install --id Microsoft.PowerShell --source winget" -ForegroundColor Red
    Write-Host "          - Download the MSI from https://aka.ms/powershell-release?tag=lts" -ForegroundColor Red
    Write-Host "          - Install 'PowerShell' from the Microsoft Store (no administrator rights needed)" -ForegroundColor Red
    Write-Host "        Tip: double-click Start-Install.cmd in the release folder; it checks your environment and guides you." -ForegroundColor Red
    exit 1
}
if ($ExecutionContext.SessionState.LanguageMode -ne "FullLanguage") {
    Write-Host "[ERROR] PowerShell is running in $($ExecutionContext.SessionState.LanguageMode) mode, usually enforced by AppLocker or WDAC. The installation requires FullLanguage mode. Contact your IT department." -ForegroundColor Red
    exit 1
}

. "$PSScriptRoot/Scripts/SharedFunctions.ps1"

$global:PP365NonInteractive = $NonInteractive.IsPresent -or $CI.IsPresent
$global:PP365Issues = [System.Collections.Generic.List[string]]::new()
$global:PP365StepIndex = 0
$RunTimestamp = [datetime]::Now.ToString("yy-MM-ddTHH-mm-ss")

# The transcript header contains the full command line, which in CI includes the certificate.
$TranscriptPath = $null
if (-not $CI.IsPresent) {
    $TranscriptPath = Start-InstallTranscript -Path "$PSScriptRoot/Install_Transcript_$RunTimestamp.txt"
}
trap {
    Stop-InstallTranscript
    break
}

$ConnectionInfo = [PSCustomObject]@{
    ClientId                 = $ClientId
    CI                       = $CI.IsPresent
    Tenant                   = $Tenant
    CertificateBase64Encoded = $CertificateBase64Encoded
}

#region Handling installation language and culture
$LanguageIds = @{
    "Norwegian" = 1044;
    "English"   = 1033;
}

$LanguageCodes = @{
    "Norwegian" = 'no-NB';
    "English"   = 'en-US';
}

$SiteDesignNames = @{
    "Norwegian" = "Prosjektomr%C3%A5de";
    "English"   = "Project%20Site";
}

$SiteTitleDefaults = @{
    "Norwegian" = "Prosjektportalen";
    "English"   = "Project Portal";
}

$LanguageId = $LanguageIds[$Language]
$LanguageCode = $LanguageCodes[$Language]

if ($SiteDesignName -eq "Prosjektomr%C3%A5de") {
    $SiteDesignName = $SiteDesignNames[$Language]
}

if ($Title -eq "Prosjektportalen") {
    $Title = $SiteTitleDefaults[$Language]
}

$Channel = "{CHANNEL_PLACEHOLDER}"
. "$PSScriptRoot/Scripts/Resources.ps1"
Initialize-Resources -LanguageCode $LanguageCode
#endregion

$ErrorActionPreference = "Stop"
$sw = [Diagnostics.Stopwatch]::StartNew()
$global:sw_action = $null
$InstallStartTime = (Get-Date -Format o)

Write-Host "########################################################" -ForegroundColor Cyan
$Operation = if ($Upgrade.IsPresent) { "Upgrading" } else { "Installing" }
Write-Host "### $Operation Prosjektportalen 365 v{VERSION_PLACEHOLDER} ####" -ForegroundColor Cyan
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


#region Setting variables based on input from user
# Validated before loading modules and signing in, so a typo is reported immediately
$UrlError = Get-PortfolioUrlError -Url $Url
if ($null -ne $UrlError) {
    Exit-InstallWithError -Message $UrlError
}
[System.Uri]$Uri = $Url.Trim().TrimEnd('/')
$Alias = $Uri.Segments[2]
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")
$TemplatesBasePath = "$PSScriptRoot/Templates"
#endregion

$PnPVersion = Initialize-PnPModule -CI:$CI -SkipLoadingBundle:$SkipLoadingBundle
if (-not $CI.IsPresent) {
    Write-Host "[INFO] As part of the authentication process with Microsoft 365, this script will open a browser window to authenticate."
    Write-Host "[INFO] Make sure you use the correct browser profile. You can copy the authentication URL and open it in the correct browser."
    Show-Countdown -Seconds 10
}

#region Print installation user
Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
$CurrentUser = Get-PnPProperty -Property CurrentUser -ClientObject (Get-PnPContext).Web -ErrorAction SilentlyContinue
if ($null -ne $CurrentUser -and $CurrentUser.LoginName) {
    Write-Host "[INFO] Installing with user [$($CurrentUser.LoginName)]"
}
else {
    Write-InstallWarning "Failed to get current user. Assuming installation is done with an app or service principal without e-mail."
}
#endregion

#region Ensure site collection admin access before upgrade checks
if ($Upgrade.IsPresent) {
    try {
        $null = Set-CurrentUserAsSiteAdmin -Url $Url -CurrentUser $CurrentUser -AdminSiteUrl $AdminSiteUrl -ConnectionInfo $ConnectionInfo
    }
    catch {
        Write-InstallWarning "Failed to ensure site collection administrator access before upgrade checks: $($_.Exception.Message)" -ErrorRecord $_
    }
}
#endregion

#region Check if installing to another installation channel when upgrading
Connect-SharePoint -Url $Uri.AbsoluteUri -ConnectionInfo $ConnectionInfo
$ExistingSite = Get-PnPSite -ErrorAction SilentlyContinue
if ($Upgrade.IsPresent -and $null -eq $ExistingSite) {
    Exit-InstallWithError "You specified -Upgrade, but no existing site was found at $($Uri.AbsoluteUri). Cannot upgrade a site that does not exist."
}
if ($Upgrade.IsPresent -and $null -ne $ExistingSite) {
    $InstallInfo = Get-PPInstallationInfo
    if ($InstallInfo.LanguageId -ne $LanguageId) {
        Exit-InstallWithError "The site you're trying to install to is already installed using language '$($InstallInfo.LanguageId)'. You are now trying to install using language '$LanguageId'. This is not supported."
    }
    if ($null -eq $InstallInfo -or $null -eq $InstallInfo.Latest) {
        Exit-InstallWithError "Could not determine existing installation version. This is a critical error. Exiting script."
    }
    if ($null -ne $InstallInfo.Channel -and "" -ne $InstallInfo.Channel -and $InstallInfo.Channel -ne $Channel) {
        Exit-InstallWithError "The site you're trying to install to is already installed using channel '$($InstallInfo.Channel)'. You are now trying to install using channel '$Channel'. This is not supported."
    }
}
else {
    if ($null -ne $ExistingSite) {
        Write-InstallWarning "The site you're trying to install to already exists. If you want to upgrade the site, use the -Upgrade switch. If you know what you're doing you can allow the script to continue"
        Show-Countdown -Seconds 10
    }
}
#endregion

$LogFilePath = "$PSScriptRoot/Install_Log_$RunTimestamp.txt"
Start-PnPTraceLog -Path $LogFilePath -Level Debug

#region Create site
if (-not $SkipSiteCreation.IsPresent -and -not $Upgrade.IsPresent) {
    Try {
        Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
        $PortfolioSite = Get-PnPTenantSite -Url $Uri.AbsoluteUri -ErrorAction SilentlyContinue
        if ($null -eq $PortfolioSite) {
            StartAction("Creating portfolio site at $($Uri.AbsoluteUri)")
            Try {
                $PortfolioSite = New-PnPSite -Type TeamSite -Title $Title -Alias $Alias -IsPublic:$true -ErrorAction Stop -Lcid $LanguageId -Wait -HideGroupInOutlook -WelcomeEmailDisabled
            }
            Catch {
                Write-Host "[WARNING] Failed to create site: $($_.Exception.Message)" -ForegroundColor Yellow
                Write-Host "[INFO] Reconnecting with a fresh session and retrying. This can happen when app permissions were recently granted on a new tenant." -ForegroundColor Yellow
                Disconnect-PnPOnline -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 10
                Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
                $PortfolioSite = New-PnPSite -Type TeamSite -Title $Title -Alias $Alias -IsPublic:$true -ErrorAction Stop -Lcid $LanguageId -Wait -HideGroupInOutlook -WelcomeEmailDisabled
            }
            EndAction
        }
    }
    Catch {
        Exit-InstallWithError "Failed to create site: $($_.Exception.Message)" -ErrorRecord $_
    }
}
#endregion

#region Promote site to hub site
if (-not $Upgrade.IsPresent) {
    Try {
        Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
        StartAction("Promoting $($Uri.AbsoluteUri) to hubsite")
        $HubSiteOutput = Register-PnPHubSite -Site $Uri.AbsoluteUri -ErrorAction SilentlyContinue
        EndAction
    }
    Catch {
        Exit-InstallWithError "Failed to promote site to hub site: $($_.Exception.Message)" -ErrorRecord $_
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
        Write-InstallWarning "Failed to set permissions for associated member group: $($_.Exception.Message)" -ErrorRecord $_
    }
}
#endregion


#region Creating/updating site design
$SiteDesignName = [Uri]::UnescapeDataString($SiteDesignName)
$SiteDesignDescription = [Uri]::UnescapeDataString($SiteDesignDescription)
$SiteDesignThumbnail = "https://publiccdn.sharepointonline.com/prosjektportalen.sharepoint.com/sites/ppassets/Thumbnails/prosjektomrade.png"

# Add channel to name for the site design if channel is specified and not main
if ($Channel -ne "main") {
    $SiteDesignName = $SiteDesignName + " [$Channel]"
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
            $SiteScriptTitle = $s.BaseName.Substring(9)
            # Add channel to name for the site script if channel is specified and not main
            if ($Channel -ne "main") {
                $SiteScriptTitle += " - $Channel"
            }
            $Content = (Get-Content -Path $s.FullName -Raw | Out-String)
            $SiteScript = $SiteScripts | Where-Object { $_.Title -eq $SiteScriptTitle }
            if ($null -ne $SiteScript) {
                $SiteScriptOutput = Set-PnPSiteScript -Identity $SiteScript -Content $Content -ErrorAction SilentlyContinue
            }
            else {
                $SiteScript = Add-PnPSiteScript -Title $SiteScriptTitle -Content $Content
            }
            $SiteScriptIds += $SiteScript.Id.Guid
        }
        EndAction
    }
    Catch {
        Exit-InstallWithError "Failed to create/update site scripts: $($_.Exception.Message)" -ErrorRecord $_
    }

    Try {
        StartAction("Creating/updating site design $SiteDesignName")
        Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
    
        Get-PnPSiteDesign | Where-Object { $_.Title.Contains("Prosjektområde - test") } | Remove-PnPSiteDesign -Force -ErrorAction SilentlyContinue >$null 2>&1

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
        Exit-InstallWithError "Failed to create/update site design: $($_.Exception.Message)" -ErrorRecord $_
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
        Write-InstallWarning "Failed to set default site design: $($_.Exception.Message)" -ErrorRecord $_
    }
    EndAction
}

try {
    StartAction("Ensuring site collection administrator access to $Url")
    if (-not (Set-CurrentUserAsSiteAdmin -Url $Url -CurrentUser $CurrentUser -AdminSiteUrl $AdminSiteUrl -ConnectionInfo $ConnectionInfo)) {
        Write-InstallWarning "Current user not available. Skipping owner assignment."
    }
}
catch {
    Write-InstallWarning "Failed to ensure site collection administrator access: $($_.Exception.Message)" -ErrorRecord $_
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
        Exit-InstallWithError "Failed to run pre-install upgrade steps: $($_.Exception.Message)" -ErrorRecord $_
    }
}
#endregion

#region Install app packages
if (-not $SkipAppPackages.IsPresent) {
    Try {
        if (-not $TenantAppCatalogUrl) {
            Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
            $TenantAppCatalogUrl = Get-PnPTenantAppCatalogUrl -ErrorAction SilentlyContinue
            $null = Set-CurrentUserAsSiteAdmin -Url $TenantAppCatalogUrl -CurrentUser $CurrentUser -AdminSiteUrl $AdminSiteUrl -ConnectionInfo $ConnectionInfo
        }
        Connect-SharePoint -Url $TenantAppCatalogUrl -ConnectionInfo $ConnectionInfo
    }
    Catch {
        Exit-InstallWithError "Failed to connect to Tenant App Catalog. Do you have a Tenant App Catalog in your tenant?" -ErrorRecord $_
    }
    Try {
        StartAction("Installing SharePoint Framework app packages to $TenantAppCatalogUrl")
        $AppPackages = @(Get-ChildItem "$PSScriptRoot/Apps/*.sppkg" -ErrorAction SilentlyContinue)
        $TotalApps = $AppPackages.Count
        $CurrentApp = 0
        
        foreach ($AppPkg in $AppPackages) {
            $CurrentApp++
            $PercentComplete = [int](($CurrentApp / $TotalApps) * 100)
            Write-Progress -Activity "Installing SharePoint Framework app packages" -Status "Installing $($AppPkg.Name) ($CurrentApp of $TotalApps)" -PercentComplete $PercentComplete
            $AppOutput = Add-PnPApp -Path $AppPkg.FullName -Scope Tenant -Publish -Overwrite -SkipFeatureDeployment -Force -ErrorAction Stop
        }
        Write-Progress -Activity "Installing SharePoint Framework app packages" -Completed
        EndAction
    }
    Catch {
        Exit-InstallWithError "Failed to install app packages to $($TenantAppCatalogUrl): $($_.Exception.Message)" -ErrorRecord $_
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
        Write-InstallWarning "Failed to delete page Home.aspx. Please delete it manually." -ErrorRecord $_
    }
}
#endregion

#region Applying PnP templates 
if (-not $SkipTemplate.IsPresent) {
    Try {
        Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
        $NoScriptOutput = Set-PnPTenantSite -NoScriptSite:$false -Url $Uri.AbsoluteUri -ErrorAction SilentlyContinue

        Connect-SharePoint -Url $Uri.AbsoluteUri -ConnectionInfo $ConnectionInfo

        # Applying additional check that we're connected to the correct site before applying templates
        $CurrentContext = Get-PnPContext
        $CurrentUrl = $CurrentContext.Url.TrimEnd('/')
        $TargetUrl = $Uri.AbsoluteUri.TrimEnd('/')
        if ($CurrentUrl -ne $TargetUrl) {
            Write-Host "[ERROR] Attempted to install to $TargetUrl but connection was active against $CurrentUrl"
            throw "Wrong connection identified - you are not connected to the correct site"
        }
        if (-not $SkipTaxonomy.IsPresent -and -not $Upgrade.IsPresent) {
            StartAction("Applying PnP template Taxonomy to $($Uri.AbsoluteUri)")
            Invoke-PnPSiteTemplate "$TemplatesBasePath/Taxonomy.pnp" -ErrorAction Stop -WarningAction SilentlyContinue
            EndAction
        }

        Write-Host "[INFO] The next step applies the PnP site template. This takes several minutes..." -ForegroundColor Yellow
        if ($Upgrade.IsPresent) {
            StartAction -Action "Applying PnP template Portfolio to $($Uri.AbsoluteUri)"
            Invoke-WithRetry -Description "apply PnP Portfolio template" -ScriptBlock {
                Invoke-PnPSiteTemplate "$TemplatesBasePath/Portfolio.pnp" -ExcludeHandlers $UpgradeExcludeHandlers -ErrorAction Stop -WarningAction SilentlyContinue
            }
            EndAction

            # Ved oppgradering kjøres innholdsmalen kun med Files-handleren, slik at
            # virksomhetens listedata ikke røres. DataRows i innholdsmalen provisjoneres
            # dermed IKKE her — nye lister som skal fylles ved oppgradering (f.eks. v6-hub-
            # listene i 1.14.0) håndteres tilstandsstyrt i Scripts/PostInstallUpgrade.ps1.
            if (Test-Path "$TemplatesBasePath/Portfolio_content.$LanguageCode.pnp") {
                $null = Invoke-SiteTemplateSafely `
                    -TemplatePath "$TemplatesBasePath/Portfolio_content.$LanguageCode.pnp" `
                    -ActionDescription "Applying PnP content template to $($Uri.AbsoluteUri)" `
                    -Handlers Files
            }
            else {
                Write-InstallWarning "No content template found for language $LanguageCode. Skipping content template."
            }
        }
        else {
            StartAction -Action "Applying PnP template Portfolio to $($Uri.AbsoluteUri)"
            $Instance = Read-PnPSiteTemplate "$TemplatesBasePath/Portfolio.pnp"
            if ($null -ne $Instance.SupportedUILanguages -and $Instance.SupportedUILanguages.Count -gt 0) {
                $Instance.SupportedUILanguages[0].LCID = $LanguageId
                Invoke-PnPSiteTemplate -InputInstance $Instance -Handlers SupportedUILanguages
            }
            else {
                Write-InstallWarning "Template has no SupportedUILanguages entries; skipping LCID override."
            }
            Invoke-WithRetry -Description "apply PnP Portfolio template" -ScriptBlock {
                Invoke-PnPSiteTemplate "$TemplatesBasePath/Portfolio.pnp" -ExcludeHandlers SupportedUILanguages -ErrorAction Stop -WarningAction SilentlyContinue
            }
            EndAction

            if (Test-Path "$TemplatesBasePath/Portfolio_content.$LanguageCode.pnp") {
                $null = Invoke-SiteTemplateSafely `
                    -TemplatePath "$TemplatesBasePath/Portfolio_content.$LanguageCode.pnp" `
                    -ActionDescription "Applying PnP content template to $($Uri.AbsoluteUri)"
            }
        }
    }
    Catch {
        Exit-InstallWithError "Failed to apply PnP templates to $($Uri.AbsoluteUri): $($_.Exception.Message)" -ErrorRecord $_
    }
    Finally {
        # Ensure NoScriptSite is re-enabled even if errors occur
        Try {
            Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
            $NoScriptOutput = Set-PnPTenantSite -NoScriptSite:$true -Url $Uri.AbsoluteUri -ErrorAction SilentlyContinue
        }
        Catch {
            Write-InstallWarning "Failed to re-enable NoScriptSite protection: $($_.Exception.Message)" -ErrorRecord $_
        }
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
    Write-InstallWarning "Failed to clear QuickLaunch: $($_.Exception.Message)" -ErrorRecord $_
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
        Write-InstallWarning "Failed to import Search Configuration: $($_.Exception.Message)" -ErrorRecord $_
    }
}
#endregion

#region Post install - running post-install scripts and applying PnP templates
Write-Host "[INFO] Running post-install steps" 
Connect-SharePoint -Url $Uri.AbsoluteUri -ConnectionInfo $ConnectionInfo
try {
    ."$PSScriptRoot/Scripts/PostInstall.ps1"
}
catch {
    Write-InstallWarning "Failed to run post-install steps: $($_.Exception.Message)" -ErrorRecord $_
}

if ($Upgrade.IsPresent) {
    Write-Host "[INFO] Running post-install upgrade steps" 
    try {
        ."$PSScriptRoot/Scripts/PostInstallUpgrade.ps1"
    }
    catch {
        Write-InstallWarning "Failed to run post-install upgrade steps: $($_.Exception.Message)" -ErrorRecord $_
    }
}

$sw.Stop()
Stop-PnPTraceLog -StopFileLogging

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
Write-Host "[INFO] Consider running ./Scripts/UpgradeAllSitesToLatest.ps1 -Url $($Uri.AbsoluteUri) (or Start-Install.cmd) to upgrade all sites to the latest version of Prosjektportalen 365."
Write-Host "[INFO] This is required if upgrading from a version earlier than 1.10.0."
Write-InstallSummary
#endregion

#region Log installation and send pingback to Azure Function
Write-Host "[INFO] Logging installation entry" 
$InstallEndTime = (Get-Date -Format o)

# Built from the bound parameters so the entry is the same whether the script was started directly or via Start-Install.cmd
$InstallCommand = if ($CI.IsPresent) {
    "GitHub CI"
}
else {
    Format-ScriptCommand -ScriptName "Install.ps1" -Parameters $PSBoundParameters
}

$InstallEntry = @{
    Title            = "PP365 {VERSION_PLACEHOLDER}"
    InstallStartTime = $InstallStartTime; 
    InstallEndTime   = $InstallEndTime; 
    InstallVersion   = "{VERSION_PLACEHOLDER}";
    InstallCommand   = $InstallCommand;
    InstallChannel   = $Channel;
}

if ($null -ne $CurrentUser -and $CurrentUser.LoginName) {
    $InstallEntry.InstallUser = $CurrentUser.LoginName
}

try {
    $InstallationEntriesList = Get-PnPList -Identity (Get-Resource -Name "Lists_InstallationLog_Title") -ErrorAction Stop

    ## Logging installation to SharePoint list
    $InstallationEntry = Add-PnPListItem -List $InstallationEntriesList.Id -Values $InstallEntry -ErrorAction Continue

    ## Attempting to attach the log files to installation entry
    if ($null -ne $InstallationEntry) {
        # The transcript is locked while it is running
        Stop-InstallTranscript
        foreach ($AttachmentPath in @($LogFilePath, $TranscriptPath)) {
            if ([string]::IsNullOrEmpty($AttachmentPath) -or -not (Test-Path $AttachmentPath)) {
                continue
            }
            $File = Get-Item -Path $AttachmentPath
            if ($File.Length -gt 0) {
                Write-Host "[INFO] Attaching $($File.Name) to installation entry"
                $AttachmentOutput = Add-PnPListItemAttachment -List $InstallationEntriesList.Id -Identity $InstallationEntry.Id -Path $AttachmentPath -ErrorAction Continue
            }
        }
    }
}
catch {
    Write-InstallWarning "Installation log list not found. Skipping logging installation entry." -ErrorRecord $_
}

Disconnect-PnPOnline

$InstallEntry.InstallUrl = $Uri.AbsoluteUri

try { 
    Invoke-WebRequest "https://pp365-install-pingback.azurewebsites.net/api/AddEntry" -Body ($InstallEntry | ConvertTo-Json) -Method 'POST' -ErrorAction SilentlyContinue >$null 2>&1 
}
catch {}
#endregion

Stop-InstallTranscript
