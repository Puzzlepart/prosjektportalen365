Param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [Parameter(Mandatory = $false, HelpMessage = "Used by Continuous Integration")]
    [switch]$CI,
    [Parameter(Mandatory = $false, HelpMessage = "Client ID of the Entra Id application used for interactive logins. Defaults to the multi-tenant Prosjektportalen app")]
    [string]$ClientId = "da6c31a6-b557-4ac3-9994-7315da06ea3a",
    [Parameter(Mandatory = $false, HelpMessage = "Tenant in case of certificate based authentication")]
    [string]$Tenant,
    [Parameter(Mandatory = $false, HelpMessage = "Base64 encoded certificate")]
    [string]$CertificateBase64Encoded,
    [Parameter(Mandatory = $false, HelpMessage = "Do you want to handle PnP libraries and PnP PowerShell without using bundled files?")]
    [switch]$SkipLoadingBundle,
    [Parameter(Mandatory = $false, HelpMessage = "Language")]
    [ValidateSet('Norwegian', 'English')]
    [string]$Language = "Norwegian"
)

$ErrorActionPreference = "Stop"

$LanguageCodes = @{
    "Norwegian"    = 'no-NB';
    "English"      = 'en-US';
}
$LanguageCode = $LanguageCodes[$Language]

. $PSScriptRoot\SharedFunctions.ps1
. $PSScriptRoot\Resources.ps1

$InstallationEntriesList = Get-PnPList -Identity (Get-Resource -Name "Lists_InstallationLog_Title") -ErrorAction Stop

$ConnectionInfo = [PSCustomObject]@{
    ClientId                 = $ClientId
    CI                       = $CI.IsPresent
    Tenant                   = $Tenant
    CertificateBase64Encoded = $CertificateBase64Encoded
}

$CI_MODE = $CI.IsPresent

[version]$global:__InstalledVersion = $null
[version]$global:__PreviousVersion = $null
$global:__PnPConnection = $null
$global:__CurrentChannelConfig = $null
$InstallStartTime = (Get-Date -Format o)

$ScriptDir = (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)

if ($CI.IsPresent -and $null -eq (Get-Module -Name PnP.PowerShell)) {
    Write-Host "[Running in CI mode. Installing module PnP.PowerShell.]" -ForegroundColor Yellow
    Install-Module -Name PnP.PowerShell -Force -Scope CurrentUser -ErrorAction Stop
}
else {
    if (-not $SkipLoadingBundle.IsPresent) {
        $PnPVersion = LoadBundle -ScriptPath "$PSScriptRoot\.."
        Write-Host "Loaded module PnP.PowerShell v$($PnPVersion) from bundle"
    }
    else {
        if ($null -eq (Get-Command Connect-PnPOnline -ErrorAction SilentlyContinue)) {
            Write-Host "[ERROR] PnP.PowerShell is not loaded. Please install the module or use the bundled version." -ForegroundColor Red
            exit 0
        } else {
            Write-Host "Loaded module PnP.PowerShell v$((Get-Command Connect-PnPOnline).Version) from your environment"
        }     
    }
}

## Checks if file .current-channel-config.json exists and loads it if it does
if (Test-Path -Path "$ScriptDir/../.current-channel-config.json") {
    $global:__CurrentChannelConfig = Get-Content -Path "$ScriptDir/../.current-channel-config.json" -Raw -ErrorAction SilentlyContinue | ConvertFrom-Json
    Write-Host "Loaded channel config from file .current-channel-config.json, will use channel $($global:__CurrentChannelConfig.Channel) when upgrading all sites to latest" -ForegroundColor Yellow
}

function UpgradeSite($Url) {
    Connect-SharePoint -Url $Url -ConnectionInfo $ConnectionInfo
    $ProjectPropertiesList = Get-PnPList -Identity "Prosjektegenskaper" -ErrorAction SilentlyContinue
    if ($null -eq $ProjectPropertiesList) {
        Write-Host "`t`tNo Prosjektegenskaper list found - this site is not a qualified Prosjektportalen site. Skipping upgrade of site $Url" -ForegroundColor Yellow
        return
    }
    Get-ChildItem $ScriptDir/UpgradeAllSitesToLatest -Filter *.ps1 | ForEach-Object {
        . $_.FullName
    }
}

Write-Host "This script will update all existing sites belonging to the PP installation $Url."
Write-Host "This requires you to have the SharePoint administrator role"

Set-PnPTraceLog -Off
$LogFilePath = "$PSScriptRoot/UpgradeSites_Log-$((Get-Date).ToString('yyyy-MM-dd-HH-mm')).txt"
Start-Transcript -Path $LogFilePath

try {
    Connect-SharePoint -Url $Url -ConnectionInfo $ConnectionInfo
    $InstallLogEntries = Get-PnPListItem -List $InstallationEntriesList.Id -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>"
    $NativeLogEntries = $InstallLogEntries | Where-Object { $_.FieldValues.Title -match "PP365+[\s]+[0-9]+[.][0-9]+[.][0-9]+[.][a-zA-Z0-9]+" }
    $LatestInstallEntry = $NativeLogEntries | Select-Object -First 1
    $PreviousInstallEntry = $NativeLogEntries | Select-Object -Skip 1 -First 1

    if ($null -eq $LatestInstallEntry) {
        $LatestInstallEntry = $InstallLogEntries | Select-Object -First 1
        $PreviousInstallEntry = $InstallLogEntries | Select-Object -Skip 1 -First 1
    } 
    elseif ($null -eq $PreviousInstallEntry) {
        $LatestInstallEntry = $InstallLogEntries | Select-Object -First 1
        $PreviousInstallEntry = $InstallLogEntries | Select-Object -Skip 1 -First 1
    }

    if ($null -ne $LatestInstallEntry -and $null -ne $PreviousInstallEntry) {
        $LatestInstallVersion = $LatestInstallEntry.FieldValues["InstallVersion"]
        $PreviousInstallVersion = $PreviousInstallEntry.FieldValues["InstallVersion"]
    }
    else {
        Write-Host "Could not identify previous installed versions. It's still possible to attempt to upgrade sites. We will attempt to run all avilable upgrade actions" -ForegroundColor Yellow
        if ($null -ne $LatestInstallEntry) {
            $LatestInstallVersion = $LatestInstallEntry.FieldValues["InstallVersion"]
            $PreviousInstallVersion = "0.0.0"
        }
        else {
            Write-Host "Could not identify any installed versions. This is a critical error. Exiting script." -ForegroundColor Red
            Stop-Transcript
            exit 0
        }
    }

    if ($LatestInstallVersion -eq $PreviousInstallVersion) {
        Write-Host "The newest installed version is the same as the previous. The script might have some issues upgrading projects." -ForegroundColor Yellow
    }

    $global:__InstalledVersion = ParseVersionString -VersionString $LatestInstallVersion
    $global:__PreviousVersion = ParseVersionString -VersionString $PreviousInstallVersion

    Write-Host "Getting ready to upgrade feature discrepancy between version $global:__PreviousVersion and $global:__InstalledVersion"

    [System.Uri]$Uri = $Url
    $AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")

    Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
    $CurrentUser = Get-PnPProperty -Property CurrentUser -ClientObject (Get-PnPContext).Web -ErrorAction SilentlyContinue
    if ($null -ne $CurrentUser -and $CurrentUser.LoginName) {
        Write-Host "Installing with user [$($CurrentUser.LoginName)]"
        $UserName = $CurrentUser.LoginName
    }
    else {
        Write-Host "Failed to get current user. Assuming installation is done with an app or a service principal without e-mail." -ForegroundColor Yellow
    }

    Write-Host "Retrieving all sites of the Project Portal hub..."
    $ProjectsHub = Get-PnPTenantSite -Identity $Url
    $ProjectsInHub = Get-PnPTenantSite -Template "GROUP#0" | Where-Object { $_.HubSiteId -eq $ProjectsHub.HubSiteId -and $_.Url -ne $ProjectsHub.Url } | ForEach-Object { return $_.Url }

    Write-Host "The following sites were found to be part of the Project Portal hub:"
    $ProjectsInHub | ForEach-Object { Write-Host "`t$_" }

    if (-not $CI_MODE) {
        Write-Host "We can grant $UserName admin access to existing projects. This will ensure that all project will be upgraded. If you select no, the script will only upgrade the sites you are already an owner of."
        do {
            $YesOrNo = Read-Host "Do you want to grant $UserName access to all sites in the hub (listed above)? (y/n)"
        } 
        while ("y", "n" -notcontains $YesOrNo)
    }

    if ($YesOrNo -eq "y" -or $CI_MODE) {    
        $ProjectsInHub | ForEach-Object -Begin { $ProgressCount = 0 } {
            [Int16]$PercentComplete = (++$ProgressCount) * 100 / $ProjectsInHub.Count
            Write-Progress -Activity "Granting access to all sites in the hub" -Status "$PercentComplete% Complete" -PercentComplete $PercentComplete -CurrentOperation "Processing site $_"
        
            Write-Host "`tGranting access to $_"
            Set-PnPTenantSite -Url $_ -Owners $UserName
        }
    }

    Write-Host "Upgrading existing sites from version $global:__PreviousVersion to $global:__InstalledVersion..."
    $ProjectsInHub | ForEach-Object -Begin { $ProgressCount = 0 } {    
        [Int16]$PercentComplete = (++$ProgressCount) * 100 / $ProjectsInHub.Count
        Write-Progress -Activity "Upgrading all sites in hub" -Status "$PercentComplete% Complete" -PercentComplete $PercentComplete -CurrentOperation "Processing site $_"
    
        Write-Host "`tProcessing site $_"
        UpgradeSite -Url $_
        Write-Host "`t`tDone processing $_" -ForegroundColor Green
    }

    if (-not $CI_MODE) {
        Write-Host "We can remove $UserName's admin access from existing projects."
        do {
            $YesOrNo = Read-Host "Do you want to remove $UserName's admin access from all sites in the hub? (y/n)"
        } 
        while ("y", "n" -notcontains $YesOrNo)
    }

    if ($YesOrNo -eq "y" -or $CI_MODE) {
        $ProjectsInHub | ForEach-Object -Begin { $ProgressCount = 0 } {    
            [Int16]$PercentComplete = (++$ProgressCount) * 100 / $ProjectsInHub.Count
            Write-Progress -Activity "Removing admin access" -Status "$PercentComplete% Complete" -PercentComplete $PercentComplete -CurrentOperation "Processing site $_"
        
            try {
                Write-Host "`tRemoving access to $_"
                Connect-SharePoint -Url $_ -ConnectionInfo $ConnectionInfo
                Remove-PnPSiteCollectionAdmin -Owners $UserName
            } catch {
                Write-Host "`t`tFailed to remove access to $_" -ForegroundColor Yellow
            }
        }
    }

    Write-Progress -Activity "Upgrading all sites in hub" -Status "Completed" -PercentComplete 100 -Completed
    Write-Host "Upgrade of all project sites is complete" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] An error occurred during the upgrade process. Check the log file for more information." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.Exception.StackTrace -ForegroundColor Red
}
finally {
    Stop-Transcript
}

Connect-SharePoint -Url $Url -ConnectionInfo $ConnectionInfo

$InstallEntry = @{
    Title            = "PP365 UpgradeAllSitesToLatest $LatestInstallVersion";
    InstallStartTime = $InstallStartTime; 
    InstallEndTime   = (Get-Date -Format o); 
    InstallVersion   = $LatestInstallVersion;
    InstallCommand   = $MyInvocation.Line.Substring(2);
}

if ($null -ne $UserName) {
    $InstallEntry.InstallUser = $UserName
}
if (-not [string]::IsNullOrEmpty($CI)) {
    $InstallEntry.InstallCommand = "GitHub CI";
}
if ($Channel -ne "main") {
    $InstallEntry.InstallChannel = $global:__CurrentChannelConfig.Channel
}

$InstallationEntry = Add-PnPListItem -List $InstallationEntriesList.Id -Values $InstallEntry -ErrorAction SilentlyContinue

if ($null -ne $InstallationEntry) {
    $AttachmentOutput = Add-PnPListItemAttachment -List $InstallationEntriesList.Id -Identity $InstallationEntry.Id -Path $LogFilePath -ErrorAction SilentlyContinue
}

    
$global:__PnPConnection = $null
Disconnect-PnPOnline