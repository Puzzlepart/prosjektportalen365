
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
    $global:PP365StepIndex++
    $global:PP365CurrentAction = $Action
    Write-Host "[INFO] $Action...  " -NoNewline
    Write-StepRecord -Status "Started" -ElapsedSeconds 0
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
    Write-StepRecord -Status "Completed" -ElapsedSeconds $ElapsedSeconds
}

<#
.SYNOPSIS
Emit a structured progress record for the current action

.DESCRIPTION
Writes a record tagged 'PP365.Step' to the information stream. It is silent by default,
so console output is unchanged, but a wrapper (GUI, CI) can capture it with 6> or -InformationVariable.
#>
function Write-StepRecord {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Status,
        [double]$ElapsedSeconds
    )
    $Record = [PSCustomObject]@{
        Step           = $global:PP365StepIndex
        Name           = $global:PP365CurrentAction
        Status         = $Status
        ElapsedSeconds = $ElapsedSeconds
    }
    Write-Information -MessageData $Record -Tags "PP365.Step"
}

<#
.SYNOPSIS
Write a non-fatal warning and remember it for the end-of-run summary

.PARAMETER Message
The warning message (without the [WARNING] prefix)

.PARAMETER ErrorRecord
Optional ErrorRecord whose details are written below the warning
#>
function Write-InstallWarning {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        $ErrorRecord
    )
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    if ($null -ne $ErrorRecord) {
        Write-ErrorDetails $ErrorRecord
    }
    Add-InstallIssue $Message
}

<#
.SYNOPSIS
Remember an issue for the end-of-run summary without writing it
#>
function Add-InstallIssue {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )
    if ($null -eq $global:PP365Issues) {
        $global:PP365Issues = [System.Collections.Generic.List[string]]::new()
    }
    $global:PP365Issues.Add($Message)
}

<#
.SYNOPSIS
Write the list of warnings collected during the run, if any
#>
function Write-InstallSummary {
    if ($null -eq $global:PP365Issues -or $global:PP365Issues.Count -eq 0) {
        return
    }
    Write-Host "[WARNING] Completed with $($global:PP365Issues.Count) warning(s). Review these before using the portfolio site:" -ForegroundColor Yellow
    $global:PP365Issues | ForEach-Object { Write-Host "          - $_" -ForegroundColor Yellow }
}

<#
.SYNOPSIS
Write a fatal error, stop the transcript and exit the script with exit code 1

.PARAMETER Message
The error message (without the [ERROR] prefix)

.PARAMETER Hint
Optional lines with guidance, written indented below the error

.PARAMETER ErrorRecord
Optional ErrorRecord whose details are written below the error
#>
function Exit-InstallWithError {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [string[]]$Hint,
        $ErrorRecord
    )
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    $Hint | Where-Object { $_ } | ForEach-Object { Write-Host "        $_" -ForegroundColor Red }
    if ($null -ne $ErrorRecord) {
        Write-ErrorDetails $ErrorRecord
    }
    Stop-InstallTranscript
    exit 1
}

<#
.SYNOPSIS
Start a transcript of the console output next to the install script

.OUTPUTS
The path to the transcript file, or $null if it could not be started.
#>
function Start-InstallTranscript {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )
    try {
        $null = Start-Transcript -Path $Path -ErrorAction Stop
        $global:PP365TranscriptPath = $Path
        return $Path
    }
    catch {
        Write-Host "[INFO] Could not start transcript at $($Path): $($_.Exception.Message)"
        return $null
    }
}

<#
.SYNOPSIS
Stop the transcript started by Start-InstallTranscript, if it is running
#>
function Stop-InstallTranscript {
    if ($null -eq $global:PP365TranscriptPath) {
        return
    }
    $global:PP365TranscriptPath = $null
    try { $null = Stop-Transcript -ErrorAction Stop } catch {}
}

<#
.SYNOPSIS
Validate a Prosjektportalen portfolio site URL

.DESCRIPTION
Checks the URL format without connecting to SharePoint, so invalid input is reported before sign-in.

.OUTPUTS
$null if the URL is valid, otherwise a message describing the problem.
#>
function Get-PortfolioUrlError {
    Param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Url
    )
    $Expected = "Expected format: https://<tenant>.sharepoint.com/sites/<alias>"
    [System.Uri]$Uri = $null
    if (-not [System.Uri]::TryCreate($Url.Trim().TrimEnd('/'), [System.UriKind]::Absolute, [ref]$Uri) -or $Uri.Scheme -ne "https") {
        return "Invalid URL '$Url'. $Expected"
    }
    if ($Uri.Segments.Count -lt 3) {
        return "Invalid URL '$Url'. $Expected"
    }
    $ManagedPath = $Uri.Segments[1]
    $Alias = $Uri.Segments[2]
    if ($Alias.Length -lt 2 -or (@("sites/", "teams/") -notcontains $ManagedPath) -or $Uri.Authority.Contains("-admin")) {
        return "It looks like you're trying to install to a root site or an invalid site ('$Url'). This is not supported. $Expected"
    }
    return $null
}

<#
.SYNOPSIS
Format a script invocation as a copy-pasteable PowerShell command line

.DESCRIPTION
Secrets (certificate) are masked. Switches are written without value when set, and omitted when not set.
#>
function Format-ScriptCommand {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$ScriptName,
        [Parameter(Mandatory = $true)]
        [System.Collections.IDictionary]$Parameters
    )
    $Parts = @($ScriptName)
    foreach ($Key in $Parameters.Keys) {
        $Value = $Parameters[$Key]
        if ($Value -is [switch] -or $Value -is [bool]) {
            if ($Value) { $Parts += "-$Key" }
            continue
        }
        if ($Key -eq "CertificateBase64Encoded") {
            $Value = "***"
        }
        $Values = @($Value) | ForEach-Object { "'" + ([string]$_).Replace("'", "''") + "'" }
        $Parts += "-$Key $($Values -join ',')"
    }
    return $Parts -join " "
}

<#
.SYNOPSIS
Run a script block, retrying on failure

.PARAMETER Description
What the script block does, used in messages ("Failed to <Description>")
#>
function Invoke-WithRetry {
    Param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$ScriptBlock,
        [Parameter(Mandatory = $true)]
        [string]$Description,
        [int]$MaxRetries = 3
    )
    for ($Attempt = 1; $Attempt -le $MaxRetries; $Attempt++) {
        try {
            & $ScriptBlock
            return
        }
        catch {
            if ($Attempt -eq $MaxRetries) {
                Write-Host "[ERROR] Failed to $Description after $MaxRetries attempts" -ForegroundColor Red
                Write-ErrorDetails $_
                throw
            }
            Write-Host "`t[WARNING] Failed to $Description. $($MaxRetries - $Attempt) attempt(s) remaining..." -ForegroundColor Yellow
            Write-ErrorDetails $_
        }
    }
}

<#
.SYNOPSIS
Add the signed-in user as site collection administrator of a site

.OUTPUTS
$true if the owner was set, $false if no current user is available (e.g. app-only sign-in).
#>
function Set-CurrentUserAsSiteAdmin {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Url,
        $CurrentUser,
        [Parameter(Mandatory = $true)]
        [string]$AdminSiteUrl,
        [Parameter(Mandatory = $true)]
        $ConnectionInfo
    )
    if ($null -eq $CurrentUser -or -not $CurrentUser.LoginName) {
        return $false
    }
    Connect-SharePoint -Url $AdminSiteUrl -ConnectionInfo $ConnectionInfo
    Set-PnPTenantSite -Url $Url -Owners $CurrentUser.LoginName -ErrorAction SilentlyContinue
    return $true
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
Make PnP.PowerShell available in the session

.DESCRIPTION
In CI mode the required version is installed from the PowerShell Gallery. Otherwise the bundled
version is loaded, or with -SkipLoadingBundle the version already in the session is used.
Exits the script with a clear message if PnP.PowerShell is missing or too old.

.OUTPUTS
The loaded PnP.PowerShell version.
#>
function Initialize-PnPModule {
    Param(
        [switch]$CI,
        [switch]$SkipLoadingBundle
    )
    $RequiredVersion = Get-PnPVersion
    $InstallHint = "Install-Module -Name PnP.PowerShell -Scope CurrentUser -RequiredVersion $RequiredVersion"

    if ($CI.IsPresent -and $null -eq (Get-Module -Name PnP.PowerShell)) {
        Write-Host "[Running in CI mode. Installing module PnP.PowerShell.]" -ForegroundColor Yellow
        Install-Module -Name PnP.PowerShell -Force -Scope CurrentUser -ErrorAction Stop -RequiredVersion $RequiredVersion
        $Version = (Get-Command Connect-PnPOnline -ErrorAction SilentlyContinue).Version
        Write-Host "[INFO] Installed module PnP.PowerShell v$($Version) from PowerShell Gallery"
        return $Version
    }

    if (-not $SkipLoadingBundle.IsPresent) {
        $Version = LoadBundle -Version $RequiredVersion
        if ($null -eq $Version) {
            Exit-InstallWithError `
                -Message "Failed to load bundled PnP.PowerShell v$RequiredVersion from '$([System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../PnP.PowerShell/$RequiredVersion")))'." `
                -Hint @("Make sure the release archive was extracted with the PnP.PowerShell folder intact, or install PnP.PowerShell manually and rerun with -SkipLoadingBundle:", "    $InstallHint")
        }
        Write-Host "[INFO] Loaded module PnP.PowerShell v$($Version) from bundle"
    }
    else {
        $Version = (Get-Command Connect-PnPOnline -ErrorAction SilentlyContinue).Version
        if ($null -eq $Version) {
            Exit-InstallWithError `
                -Message "-SkipLoadingBundle was specified but PnP.PowerShell is not available in this session. Install it with:" `
                -Hint @("    $InstallHint")
        }
        Write-Host "[INFO] Loaded PnP.PowerShell v$($Version) from your environment"
    }
    if ($Version -lt $RequiredVersion) {
        Exit-InstallWithError -Message "PnP.PowerShell v$Version is too old. v$RequiredVersion or newer is required."
    }
    return $Version
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

        if (Test-NonInteractive) {
            Exit-InstallWithError -Message "Cannot ask whether to continue because the script is running non-interactively. Aborting."
        }
        $Answer = Read-Host "Do you still want to continue? [Y/N]"
        if ($Answer -ne "Y" -and $Answer -ne "y") {
            exit 0
        }
        return [Version]"999.99.99"
    }
}

<#
.SYNOPSIS
Whether the script must not wait for or read keyboard input

.DESCRIPTION
True when -NonInteractive/-CI was passed, or when stdin is redirected ([Console]::KeyAvailable throws then).
#>
function Test-NonInteractive {
    return ($global:PP365NonInteractive -eq $true) -or [Console]::IsInputRedirected
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

    if (Test-NonInteractive) {
        return
    }
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
            Add-InstallIssue "Content template '$([System.IO.Path]::GetFileName($TemplatePath))' was not applied because taxonomy terms are missing"
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