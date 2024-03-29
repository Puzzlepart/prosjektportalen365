Param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [Parameter(Mandatory = $false, HelpMessage = "Used by Continuous Integration")]
    [string]$CI
)


$CI_MODE = (-not ([string]::IsNullOrEmpty($CI)))

$global:__InstalledVersion = $null
$global:__PreviousVersion = $null
$global:__PnPConnection = $null
$global:__CurrentChannelConfig = $null

$ScriptDir = (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)

if ($CI_MODE) {
    Write-Host "[INFO] Running in CI mode. Installing module PnP.PowerShell." -ForegroundColor Yellow
    Install-Module -Name PnP.PowerShell -Force -Scope CurrentUser -ErrorAction Stop
}

## Checks if file .current-channel-config.json exists and loads it if it does
if (Test-Path -Path "$ScriptDir/../.current-channel-config.json") {
    $global:__CurrentChannelConfig = Get-Content -Path "$ScriptDir/../.current-channel-config.json" -Raw -ErrorAction SilentlyContinue | ConvertFrom-Json
    Write-Host "[INFO] Loaded channel config from file .current-channel-config.json, will use channel $($global:__CurrentChannelConfig.Channel) when upgrading all sites to latest" -ForegroundColor Yellow
}


function Connect-SharePoint {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    Try {
        if ($CI_MODE) {
            $DecodedCred = ([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($CI))).Split("|")
            $Password = ConvertTo-SecureString -String $DecodedCred[1] -AsPlainText -Force
            $Credentials = New-Object -TypeName System.Management.Automation.PSCredential -ArgumentList $DecodedCred[0], $Password
            Connect-PnPOnline -Url $Url -Credentials $Credentials -ErrorAction Stop  -WarningAction Ignore
        }
        else {
            if ($null -ne $global:__PnPConnection.ClientId) {
                Connect-PnPOnline -Url $Url -Interactive -ClientId $global:__PnPConnection.ClientId -ErrorAction Stop -WarningAction Ignore
            }
            Connect-PnPOnline -Url $Url -Interactive -ErrorAction Stop -WarningAction Ignore
            $global:__PnPConnection = Get-PnPConnection
        }
    }
    Catch {
        Write-Host "[INFO] Failed to connect to [$Url]: $($_.Exception.Message)"
        throw $_.Exception.Message
    }
}


function UpgradeSite($Url) {
    Connect-SharePoint -Url $Url
    Get-ChildItem $ScriptDir/UpgradeAllSitesToLatest -Filter *.ps1 | ForEach-Object {
        . $_.FullName
    }
}

Write-Host "This script will update all existing sites in a Prosjektportalen installation. This requires you to have the SharePoint admin role"

Set-PnPTraceLog -Off
Start-Transcript -Path "$PSScriptRoot/UpgradeSites_Log-$((Get-Date).ToString('yyyy-MM-dd-HH-mm')).txt"

Connect-SharePoint -Url $Url
$InstallLogEntries = Get-PnPListItem -List "Installasjonslogg" -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>"
$global:__InstalledVersion = ($InstallLogEntries | Select-Object -First 1).FieldValues["InstallVersion"]
$global:__PreviousVersion = ($InstallLogEntries | Select-Object -Skip 1 -First 1).FieldValues["InstallVersion"] 

[System.Uri]$Uri = $Url
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")

Connect-SharePoint -Url $AdminSiteUrl

# Get current logged in user
$Context = Get-PnPContext
$Context.Load($Context.Web.CurrentUser)
$Context.ExecuteQuery()
$UserName = $Context.Web.CurrentUser.LoginName

Write-Host "Retrieving all sites of the Project Portal hub..."
$ProjectsHub = Get-PnPTenantSite -Identity $Url
$ProjectsInHub = Get-PnPTenantSite | Where-Object { $_.HubSiteId -eq $ProjectsHub.HubSiteId -and $_.Url -ne $ProjectsHub.Url } | ForEach-Object { return $_.Url }

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
    $ProjectsInHub | ForEach-Object {
        Write-Host "`tGranting access to $_"
        Set-PnPTenantSite -Url $_ -Owners $UserName
    }
}

Write-Host "Upgrading existing sites from version $global:__PreviousVersion to $global:__InstalledVersion)..."
$ProjectsInHub | ForEach-Object {
    Write-Host "`tUpgrading site $_"
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
    $ProjectsInHub | ForEach-Object {
        Write-Host "`tRemoving access to $_"
        Connect-SharePoint -Url $_
        Remove-PnPSiteCollectionAdmin -Owners $UserName
    }
}


Stop-Transcript
$global:__PnPConnection = $null