
<#
.SYNOPSIS
Connect to SharePoint Online

.DESCRIPTION
Connect to SharePoint Online with the specified URL using PnP PowerShell

.PARAMETER Url
The URL to the SharePoint site

.EXAMPLE
Connect-SharePoint -Url https://contoso.sharepoint.com/sites/pp365

.EXAMPLE 
$ConnectionInfo = [PSCustomObject]@{
    ClientId         = $ClientId
    CI               = $CI.IsPresent
    Tenant           = $Tenant
    CertificateBase64Encoded = $CertificateBase64Encoded
}
Connect-SharePoint -Url https://contoso.sharepoint.com/sites/pp365 -ConnectionInfo $ConnectionInfo
#>
function Connect-SharePoint {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Url,
        [Parameter(Mandatory = $true)]
        $ConnectionInfo
    )

    Try {
        if ($ConnectionInfo.CI) {
            if ($ConnectionInfo.CertificateBase64Encoded -and $ConnectionInfo.Tenant) {
                Connect-PnPOnline -Url $Url -CertificateBase64Encoded $ConnectionInfo.CertificateBase64Encoded -Tenant $ConnectionInfo.Tenant -ClientId $ConnectionInfo.ClientId -ErrorAction Stop  -WarningAction Ignore
            }
            else {
                throw "Missing certificate or tenant for CI mode"
            }

        }
        else {
            Connect-PnPOnline -Url $Url -ClientId $ConnectionInfo.ClientId -ErrorAction Stop -WarningAction Ignore
        }
    }
    Catch {
        Write-Host "[INFO] Failed to connect to $($Url): $($_.Exception.Message)"
        throw $_.Exception.Message
    }
}

<#
.SYNOPSIS
Start action

.DESCRIPTION
Start action, write action name and start stopwatch

.PARAMETER Action
Action name to start
#>
function StartAction($Action) {
    $global:sw_action = [Diagnostics.Stopwatch]::StartNew()
    Write-Host "[INFO] $Action...  " -NoNewline
}

<#
.SYNOPSIS
End action

.DESCRIPTION
End action, stop stopwatch and write elapsed time
#>
function EndAction() {
    $global:sw_action.Stop()
    $ElapsedSeconds = [math]::Round(($global:sw_action.ElapsedMilliseconds) / 1000, 2)
    Write-Host "Completed in $($ElapsedSeconds)s" -ForegroundColor Green
}

<#
.SYNOPSIS
Load PnP.PowerShell from bundle

.DESCRIPTION
Loads PnP.PowerShell from bundle and return version.

.PARAMETER Version
The version of PnP.PowerShell to load.
#>
function LoadBundle() {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Version
    )
    Import-Module "$PWD/PnP.PowerShell/$Version/PnP.PowerShell.psd1" -ErrorAction SilentlyContinue -WarningAction SilentlyContinue
    return (Get-Command Connect-PnPOnline).Version
}

<#
.SYNOPSIS
Parse version string

.DESCRIPTION
Parse version string and return version object.

.PARAMETER VersionString
The version string to parse
#>
function ParseVersionString($VersionString) {
    try {
        $VersionParts = $VersionString.Split(".")
        if ($VersionParts.Length -gt 3) {
            return [version]::Parse($VersionString.Remove($VersionString.LastIndexOf(".")))
        }
        return [version]::Parse($VersionString)
    }
    catch {
        Write-Host "[ERROR] Failed to parse version string: $VersionString" -ForegroundColor Red
        Write-Host "[ERROR] Unable to compare with previous versions. Some upgrade actions might be skipped."
        Write-Host "[ERROR] Make sure that the field 'Versjonsnummer' has a valid version number value."
        
        $Input = Read-Host "Do you still want to continue? [Y/N]"
        if ($Input -ne "Y" -and $Input -ne "y") {
            exit 0
        }
        return [Version]"999.99.99"
    }
}

<#
.SYNOPSIS
Show countdown with option to skip

.DESCRIPTION
Shows a countdown timer that can be interrupted by pressing any key

.PARAMETER Message
The message to display before the countdown

.PARAMETER Seconds
Number of seconds to countdown (default: 10)
#>
function Show-Countdown {
    Param(
        [Parameter(Mandatory = $false)]
        [int]$Seconds = 10
    )

    $keyPressed = $false
    for ($sec = $Seconds; $sec -gt 0; $sec--) {
        if ([Console]::KeyAvailable) {
            [void][Console]::ReadKey($true)
            $keyPressed = $true
            break
        }
        Write-Host "`rContinuing in $sec second$(if ($sec -eq 1) { '' } else { 's' })... press any key to continue immediately" -NoNewline -ForegroundColor Yellow
        Start-Sleep -Seconds 1
    }
    Write-Host " - Continuing!" -ForegroundColor Green 
}

function Get-PPInstallationInfo() {
    $CurrentWeb = Get-PnPWeb -ErrorAction Stop
    $CurrentLanguage = Get-PnPProperty -ClientObject $CurrentWeb -Property "Language" -ErrorAction Stop

    $InstallationEntriesList = Get-PnPList -Identity (Get-Resource -Name "Lists_InstallationLog_Title") -ErrorAction SilentlyContinue
    if ($null -eq $InstallationEntriesList) {
        Write-Host "Could not find installation log list." -ForegroundColor Red
        return @{ LanguageId = $CurrentLanguage }
    }
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
        Write-Host "Could not identify previous installed versions." -ForegroundColor Yellow
        if ($null -ne $LatestInstallEntry) {
            $LatestInstallVersion = $LatestInstallEntry.FieldValues["InstallVersion"]
            $PreviousInstallVersion = "0.0.0"
        }
        else {
            Write-Host "Could not identify any installed versions." -ForegroundColor Red
            return @{ LanguageId = $CurrentLanguage }
        }
    }

    if ($LatestInstallVersion -eq $PreviousInstallVersion) {
        Write-Host "The newest installed version is the same as the previous. The script might have some issues upgrading projects." -ForegroundColor Yellow
    }

    $InstalledVersion = ParseVersionString -VersionString $LatestInstallVersion
    $PreviousVersion = ParseVersionString -VersionString $PreviousInstallVersion
    $Channel = $LatestInstallEntry.FieldValues["InstallChannel"]

    return @{ Latest = $InstalledVersion; Previous = $PreviousVersion; Channel = $Channel; LanguageId = $CurrentLanguage }
}