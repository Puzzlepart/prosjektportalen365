
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
        [Parameter(Mandatory = $false)]
        [string]$Version = (Get-PnPVersion).ToString()
    )
    $BundlePath = Join-Path $PSScriptRoot "../PnP.PowerShell/$Version/PnP.PowerShell.psd1"
    if (-not (Test-Path $BundlePath)) {
        return $null
    }
    Import-Module $BundlePath -ErrorAction SilentlyContinue -WarningAction SilentlyContinue
    $Cmd = Get-Command Connect-PnPOnline -ErrorAction SilentlyContinue
    if ($null -eq $Cmd) {
        return $null
    }
    return $Cmd.Version
}

function Get-PnPVersion {
    return [version]"3.2.0"
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

<#
.SYNOPSIS
Write detailed error information to the host

.DESCRIPTION
Writes inner exceptions and script stack trace from an ErrorRecord to the host for debugging purposes

.PARAMETER ErrorRecord
The ErrorRecord to extract details from
#>
function Write-ErrorDetails {
    param($ErrorRecord)
    $inner = $ErrorRecord.Exception.InnerException
    $depth = 1
    while ($null -ne $inner) {
        Write-Host "`t[INNER EXCEPTION $depth] $($inner.Message)" -ForegroundColor Red
        $inner = $inner.InnerException
        $depth++
    }
    if ($ErrorRecord.ScriptStackTrace) {
        Write-Host "`t[SCRIPT STACK TRACE]" -ForegroundColor DarkGray
        $ErrorRecord.ScriptStackTrace -split "`n" | ForEach-Object { Write-Host "`t  $_" -ForegroundColor DarkGray }
    }
}

<#
.SYNOPSIS
Apply a PnP content template with graceful handling of missing-term errors.

.DESCRIPTION
Content templates (Portfolio_content*.pnp) reference taxonomy terms by GUID
(e.g. project phases like Planlegge, Idé, Konsept, Avslutte). If those terms
have been deleted or renamed in the target tenant's term store, the server
returns a "GetTerm" / "Object reference not set" error that would otherwise
take down the entire install. This helper catches those errors, emits a clear
warning explaining the likely cause, and returns $false so the caller can
continue with the rest of the installation. Non-term errors are re-thrown.

.PARAMETER TemplatePath
Full path to the .pnp template file.

.PARAMETER ActionDescription
Friendly description used for StartAction/EndAction logging.

.PARAMETER Handlers
Optional handlers to pass through to Invoke-PnPSiteTemplate.

.PARAMETER ExcludeHandlers
Optional exclude handlers to pass through to Invoke-PnPSiteTemplate.

.OUTPUTS
$true on success, $false on a non-critical taxonomy/term failure.
#>
function Invoke-SiteTemplateSafely {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$TemplatePath,
        [Parameter(Mandatory = $true)]
        [string]$ActionDescription,
        [string[]]$Handlers,
        [string[]]$ExcludeHandlers
    )

    $invokeParams = @{
        Path          = $TemplatePath
        ErrorAction   = "Stop"
        WarningAction = "SilentlyContinue"
    }
    if ($Handlers) { $invokeParams["Handlers"] = $Handlers }
    if ($ExcludeHandlers) { $invokeParams["ExcludeHandlers"] = $ExcludeHandlers }

    StartAction $ActionDescription
    try {
        Invoke-PnPSiteTemplate @invokeParams
        EndAction
        return $true
    }
    catch {
        $msg = $_.Exception.Message
        $isMissingTerm = ($msg -match "GetTerm") -or ($msg -match "Object reference not set") -or ($msg -match "Term .* (not found|does not exist)")
        # Flush the NoNewline from StartAction so the warning starts on its own line
        Write-Host ""
        if ($isMissingTerm) {
            Write-Host "[WARNING] Failed to apply content template '$([System.IO.Path]::GetFileName($TemplatePath))' because one or more taxonomy terms referenced by the template could not be resolved on the server." -ForegroundColor Yellow
            Write-Host "          Most likely cause: project phase terms (e.g. Idé, Konsept, Planlegge, Avslutte) have been deleted or renamed in the 'Prosjektportalen' term group." -ForegroundColor Yellow
            Write-Host "          The installation will continue. To fully restore the bundled content, restore the missing terms in the term store and re-run the install with -Upgrade." -ForegroundColor Yellow
            Write-Host "          Server message: $msg" -ForegroundColor DarkYellow
            Write-ErrorDetails $_
            return $false
        }
        # Not term-related: re-throw so the caller's outer Catch can decide whether to fail the install.
        throw
    }
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

    $InstalledVersion = ParseVersionString -VersionString $LatestInstallVersion
    $PreviousVersion = ParseVersionString -VersionString $PreviousInstallVersion
    $Channel = $LatestInstallEntry.FieldValues["InstallChannel"]

    return @{ Latest = $InstalledVersion; Previous = $PreviousVersion; Channel = $Channel; LanguageId = $CurrentLanguage }
}