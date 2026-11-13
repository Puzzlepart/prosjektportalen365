
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
Install a module from the PowerShell Gallery, trying again when it fails

.DESCRIPTION
Installs the module for the current user. A CI runner sometimes cannot reach the gallery for a
moment ("Unable to resolve package source", CI run 38522211703), and a later attempt gets through,
so a failed attempt is retried after a pause. The last failure is thrown.

.PARAMETER Name
The module to install

.PARAMETER RequiredVersion
The exact version to install; the latest when left out

.PARAMETER Attempts
How many times to try

.PARAMETER DelaySeconds
The pause before the next attempt
#>
function Install-ModuleWithRetry {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $false)]
        [string]$RequiredVersion,
        [Parameter(Mandatory = $false)]
        [int]$Attempts = 3,
        [Parameter(Mandatory = $false)]
        [int]$DelaySeconds = 30
    )
    $InstallParams = @{ Name = $Name; Force = $true; Scope = "CurrentUser"; ErrorAction = "Stop" }
    if (-not [string]::IsNullOrEmpty($RequiredVersion)) {
        $InstallParams.RequiredVersion = $RequiredVersion
    }
    for ($Attempt = 1; $Attempt -le $Attempts; $Attempt++) {
        try {
            Install-Module @InstallParams
            return
        }
        catch {
            if ($Attempt -ge $Attempts) {
                throw
            }
            Write-Host "[WARNING] Installing module $Name failed (attempt $Attempt of $Attempts): $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "[WARNING] Trying again in $DelaySeconds seconds." -ForegroundColor Yellow
            Start-Sleep -Seconds $DelaySeconds
        }
    }
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

#region Usage statistics (bruksstatistikk)
# The setting UsageStatisticsLevel in Globale innstillinger decides how much usage statistics the
# browsers send to the Prosjektportalen team (docs/plans/usage-logging.md, P3, P7 and P10). The
# Portfolio template seeds the row as 2. An upgrade adds a missing row before the template, carrying
# an earlier opt-out over as 0, and -UsageStatisticsLevel writes an explicit level after it.

# The GtSettingsId the Portfolio template seeds the level row with (Objects/Lists/Globale
# innstillinger.xml). The steps that add or write the row use it, so the template's Skip finds it.
$UsageStatisticsLevelSettingId = "{b4d62fcd-26ac-4bc3-aeb8-c7d5e4503248}"

# The Name of the template catalog command set's web custom action (Objects/CustomActions.xml),
# matched by Name because channel builds swap the component id and leave the Name.
$TemplatePackageCatalogCustomActionName = "{bacfe2c8-77b4-4629-b84a-6d90f013f627}"

# The first release whose template seeds the level row: a hub logged at this version or later had
# the row, so one without it lost it (rule 5 of Resolve-InitialUsageStatisticsLevel). It must be the
# release that ships usage statistics. A hub upgraded with an earlier build stamped with the same
# version never had the row, and starts at 0 (the dev and test hubs, which log 1.15.0 since the bump).
$UsageStatisticsLevelSinceVersion = [version]"1.15.0"

<#
.SYNOPSIS
Convert a usage statistics level between its name and its value

.DESCRIPTION
A name (Off, Basic, Standard or Extended, in any case) gives its value (0 to 3), and a value, as a
number or a text, gives its name. Anything else is an error.

.PARAMETER Level
The name or the value
#>
function Convert-UsageStatisticsLevel {
    Param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Level
    )
    $Names = @('Off', 'Basic', 'Standard', 'Extended')
    $Trimmed = $Level.Trim()
    for ($Value = 0; $Value -lt $Names.Count; $Value++) {
        if ($Trimmed -eq $Names[$Value]) { return $Value }
        if ($Trimmed -ceq "$Value") { return $Names[$Value] }
    }
    throw "'$Level' is not a usage statistics level: use Off, Basic, Standard or Extended, or 0 to 3"
}

<#
.SYNOPSIS
Tell whether two ids name the same GUID

.DESCRIPTION
Compares without braces, surrounding whitespace or case, which SharePoint and the templates write
differently for the same id. An empty id matches nothing.
#>
function Test-SameGuid {
    Param(
        [AllowNull()][AllowEmptyString()][string]$First,
        [AllowNull()][AllowEmptyString()][string]$Second
    )
    if ([string]::IsNullOrWhiteSpace($First) -or [string]::IsNullOrWhiteSpace($Second)) {
        return $false
    }
    return $First.Trim().Trim('{', '}').ToLowerInvariant() -eq $Second.Trim().Trim('{', '}').ToLowerInvariant()
}

<#
.SYNOPSIS
Tell whether a command set's properties turn the template catalog's events off

.DESCRIPTION
True when the properties set telemetryUrl to an empty string, the catalog's switch for the whole
installation. Properties that are not JSON are searched for that setting as text.

.PARAMETER Properties
The custom action's ClientSideComponentProperties
#>
function Test-TelemetryUrlOptOut {
    Param(
        [AllowNull()][AllowEmptyString()][string]$Properties
    )
    if ([string]::IsNullOrWhiteSpace($Properties)) {
        return $false
    }
    try {
        $Parsed = $Properties | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        return $Properties -cmatch '"telemetryUrl"\s*:\s*""'
    }
    if ($null -eq $Parsed) {
        return $false
    }
    $Property = $Parsed.PSObject.Properties | Where-Object { $_.Name -ceq 'telemetryUrl' } | Select-Object -First 1
    return $null -ne $Property -and $Property.Value -is [string] -and $Property.Value -eq ''
}

<#
.SYNOPSIS
Tell whether the hub's template catalog has its events turned off for the installation

.DESCRIPTION
Reads the hub's web custom actions, and looks for the catalog command set's, by Name, with
telemetryUrl set to an empty string (Test-TelemetryUrlOptOut). Errors are not caught.
#>
function Test-CatalogTelemetryUrlDisabled {
    $Actions = @(Get-PnPCustomAction -Scope Web -ErrorAction Stop)
    $Disabled = $Actions | Where-Object {
        (Test-SameGuid $_.Name $TemplatePackageCatalogCustomActionName) -and (Test-TelemetryUrlOptOut $_.ClientSideComponentProperties)
    } | Select-Object -First 1
    return $null -ne $Disabled
}

<#
.SYNOPSIS
The level a hub without a UsageStatisticsLevel row starts at

.DESCRIPTION
Pure: carries an earlier opt-out over (P7 in docs/plans/usage-logging.md). The first rule that
matches gives the value:
1. an explicit -UsageStatisticsLevel gives that level;
2. the template catalog's telemetryUrl set to an empty string gives 0;
3. a CatalogTelemetryEnabled row that is disabled, or whose value is not exactly 1, gives 0;
4. no CatalogTelemetryEnabled row, on a hub at 1.14.0 or later, gives 0;
5. a hub at $UsageStatisticsLevelSinceVersion or later, which had the level row and lost it, gives 0;
6. otherwise Standard, 2.

.PARAMETER ExplicitLevel
-UsageStatisticsLevel, or empty when it was not given

.PARAMETER TelemetryUrlDisabled
Whether the catalog's telemetryUrl is an empty string (Test-CatalogTelemetryUrlDisabled)

.PARAMETER CatalogRows
The hub's CatalogTelemetryEnabled rows (Get-UsageStatisticsRows)

.PARAMETER PreviousVersion
The version the hub was last installed or upgraded with, or nothing when it is not known

.OUTPUTS
Value (0 to 3), Reason (explicit, telemetry-url-opt-out, catalog-opt-out, catalog-deleted,
level-deleted or default) and Text (the reason in words)
#>
function Resolve-InitialUsageStatisticsLevel {
    Param(
        [AllowNull()][AllowEmptyString()][string]$ExplicitLevel,
        [bool]$TelemetryUrlDisabled,
        [AllowNull()][object[]]$CatalogRows = @(),
        [AllowNull()][object]$PreviousVersion
    )
    $Version = $null
    if ($PreviousVersion -is [version]) {
        $Version = $PreviousVersion
    }
    elseif (-not [string]::IsNullOrWhiteSpace("$PreviousVersion")) {
        $Parsed = $null
        if ([version]::TryParse("$PreviousVersion".Trim(), [ref]$Parsed)) { $Version = $Parsed }
    }
    $Catalog = @($CatalogRows | Where-Object { $null -ne $_ })

    if (-not [string]::IsNullOrWhiteSpace($ExplicitLevel)) {
        return [PSCustomObject]@{ Value = (Convert-UsageStatisticsLevel -Level $ExplicitLevel); Reason = 'explicit'; Text = "from -UsageStatisticsLevel $ExplicitLevel" }
    }
    if ($TelemetryUrlDisabled) {
        return [PSCustomObject]@{ Value = 0; Reason = 'telemetry-url-opt-out'; Text = "the template catalog's telemetryUrl is empty" }
    }
    if ($Catalog | Where-Object { $_.Enabled -ne $true -or "$($_.Value)".Trim() -ne '1' }) {
        return [PSCustomObject]@{ Value = 0; Reason = 'catalog-opt-out'; Text = 'CatalogTelemetryEnabled is turned off' }
    }
    if ($Catalog.Count -eq 0 -and $null -ne $Version -and $Version -ge [version]'1.14.0') {
        return [PSCustomObject]@{ Value = 0; Reason = 'catalog-deleted'; Text = 'CatalogTelemetryEnabled was deleted' }
    }
    if ($null -ne $Version -and $Version -ge $UsageStatisticsLevelSinceVersion) {
        return [PSCustomObject]@{ Value = 0; Reason = 'level-deleted'; Text = 'UsageStatisticsLevel was deleted' }
    }
    return [PSCustomObject]@{ Value = 2; Reason = 'default'; Text = 'the default, Standard' }
}

<#
.SYNOPSIS
The level the browsers' gate reads from the hub's rows

.DESCRIPTION
Pure: mirrors resolveTelemetryGate in pp365-shared-library (P3) over the settings the browsers
read, which are the enabled rows by their exact key, a duplicated key taking the row read last, and
their values without surrounding whitespace. The browsers' own signals (the tester flag, Global
Privacy Control and Do Not Track) are not seen here.

.PARAMETER Rows
The hub's rows (Get-UsageStatisticsRows), in the order the list returns them

.OUTPUTS
Level (0 to 3); Reason (setting, catalog-opt-out, level-missing, level-disabled or invalid-level);
Value, the level row's value as the browsers read it; Catalog, whether template catalog events are
sent; and Assistant, whether UseAssistant is on
#>
function Get-EffectiveUsageStatisticsLevel {
    Param(
        [AllowNull()][object[]]$Rows = @()
    )
    $AllRows = @($Rows | Where-Object { $null -ne $_ })
    $Settings = [System.Collections.Generic.Dictionary[string, string]]::new([System.StringComparer]::Ordinal)
    foreach ($Row in $AllRows) {
        if ($Row.Enabled -eq $true -and $null -ne $Row.Key) {
            $Settings["$($Row.Key)"] = "$($Row.Value)".Trim()
        }
    }
    $CatalogValue = if ($Settings.ContainsKey('CatalogTelemetryEnabled')) { $Settings['CatalogTelemetryEnabled'] } else { $null }
    $Assistant = $Settings.ContainsKey('UseAssistant') -and $Settings['UseAssistant'] -eq '1'

    if ($CatalogValue -eq '0') {
        return [PSCustomObject]@{ Level = 0; Reason = 'catalog-opt-out'; Value = $null; Catalog = $false; Assistant = $Assistant }
    }
    if (-not $Settings.ContainsKey('UsageStatisticsLevel')) {
        $Disabled = @($AllRows | Where-Object { "$($_.Key)" -ceq 'UsageStatisticsLevel' }).Count -gt 0
        $Reason = if ($Disabled) { 'level-disabled' } else { 'level-missing' }
        return [PSCustomObject]@{ Level = 0; Reason = $Reason; Value = $null; Catalog = $false; Assistant = $Assistant }
    }
    $Value = $Settings['UsageStatisticsLevel']
    if (@('0', '1', '2', '3') -cnotcontains $Value) {
        return [PSCustomObject]@{ Level = 0; Reason = 'invalid-level'; Value = $Value; Catalog = $false; Assistant = $Assistant }
    }
    $Level = [int]$Value
    return [PSCustomObject]@{ Level = $Level; Reason = 'setting'; Value = $Value; Catalog = ($Level -ge 2 -and $CatalogValue -eq '1'); Assistant = $Assistant }
}

<#
.SYNOPSIS
The lines of the usage statistics summary at the end of an installation or upgrade

.DESCRIPTION
Pure. Tells the level the hub's rows give, what it sends and never sends, where to change it,
whether template catalog events are sent, and whether the installation pingback is sent. Without
the rows it says so and names the list, and gives no level.

.PARAMETER Effective
The level (Get-EffectiveUsageStatisticsLevel), or nothing when the rows could not be read

.PARAMETER ListTitle
The title of Globale innstillinger in the installation's language

.PARAMETER PingbackSent
Whether the run sends the installation pingback (no -SkipPingback)

.PARAMETER ReadError
Why the rows could not be read
#>
function Format-UsageStatisticsSummary {
    Param(
        [AllowNull()][object]$Effective,
        [Parameter(Mandatory = $true)][string]$ListTitle,
        [bool]$PingbackSent,
        [AllowNull()][AllowEmptyString()][string]$ReadError
    )
    $Details = "[INFO]   Details: https://github.com/Puzzlepart/prosjektportalen365/wiki/Bruksstatistikk"
    $Pingback = if ($PingbackSent) {
        "[INFO] Installation pingback (a separate flow): sent at the end of this run"
    }
    else {
        "[INFO] Installation pingback (a separate flow): not sent (-SkipPingback)"
    }
    if ($null -eq $Effective) {
        return @(
            "[WARNING] Usage statistics (bruksstatistikk): could not read '$ListTitle' on the hub, so the level is not known here: $ReadError",
            "[INFO]   Check UsageStatisticsLevel in '$ListTitle' on the hub (0 = off, 1 = basic, 2 = standard, 3 = extended).",
            $Details,
            $Pingback
        )
    }
    $Lines = @()
    if ($Effective.Level -eq 0) {
        $Why = switch ($Effective.Reason) {
            'catalog-opt-out' { 'CatalogTelemetryEnabled is 0, which turns all usage statistics off; set it to 1 to use the level' }
            'level-missing' { 'there is no UsageStatisticsLevel row' }
            'level-disabled' { 'the UsageStatisticsLevel row is disabled' }
            'invalid-level' { "UsageStatisticsLevel is '$($Effective.Value)', which is not 0, 1, 2 or 3" }
            default { 'UsageStatisticsLevel is set to 0' }
        }
        $Lines += "[INFO] Usage statistics (bruksstatistikk): Off (0): no usage statistics are sent to the Prosjektportalen team ($Why)"
    }
    else {
        $Lines += "[INFO] Usage statistics (bruksstatistikk): $(Convert-UsageStatisticsLevel -Level "$($Effective.Level)") ($($Effective.Level))"
        if ($Effective.Level -eq 1) {
            $Lines += @(
                "[INFO]   Sent from browsers to the Prosjektportalen team (assist.prosjektportalen.no): version,",
                "         channel, language and the number of projects and programs, sent when a hub owner",
                "         opens the hub; only the latest values are kept, with the week they arrived."
            )
        }
        else {
            $Lines += @(
                "[INFO]   Sent from browsers to the Prosjektportalen team (assist.prosjektportalen.no): version,",
                "         channel, language, the number of projects and programs, which parts of",
                "         Prosjektportalen are used and how many different sites, as counts per day$(if ($Effective.Level -eq 3) { ',' } else { '.' })"
            )
            if ($Effective.Level -eq 3) {
                $Lines += "         plus error codes and load times for troubleshooting."
            }
        }
        $Lines += "[INFO]   Never sent: users, names, e-mail addresses, content, or the addresses of project sites."
    }
    $Lines += @(
        "[INFO]   Change it in '$ListTitle' on the hub: UsageStatisticsLevel (0 = off, 1 = basic,",
        "         2 = standard, 3 = extended). A change applies within two hours.",
        "[INFO]   Template catalog events (CatalogTelemetryEnabled): $(if ($Effective.Catalog) { 'on' } else { 'off' })"
    )
    if ($Effective.Assistant) {
        $Lines += "[INFO]   PP Assistenten has its own telemetry; see Sikkerhet i PP Assistenten."
    }
    $Lines += @($Details, $Pingback)
    return $Lines
}

<#
.SYNOPSIS
The rows of Globale innstillinger that usage statistics depend on

.DESCRIPTION
Reads the list's items and keeps the UsageStatisticsLevel, CatalogTelemetryEnabled and UseAssistant
rows (by their key without surrounding whitespace, in any case) and the row with the level row's
id, in the order the list returns them. Errors are not caught.

.PARAMETER List
The list, from Get-PnPList

.OUTPUTS
Rows with Id, SettingsId, Key and Value (both as stored) and Enabled
#>
function Get-UsageStatisticsRows {
    Param(
        [Parameter(Mandatory = $true)]
        $List
    )
    $Keys = @('UsageStatisticsLevel', 'CatalogTelemetryEnabled', 'UseAssistant')
    $Items = Get-PnPListItem -List $List -PageSize 500 -Fields 'GtSettingsId', 'GtSettingsKey', 'GtSettingsValue', 'GtSettingsEnabled' -ErrorAction Stop
    $Rows = foreach ($Item in @($Items | Where-Object { $null -ne $_ })) {
        $Key = $Item['GtSettingsKey']
        $SettingsId = $Item['GtSettingsId']
        if ((Test-SameGuid $SettingsId $UsageStatisticsLevelSettingId) -or ($null -ne $Key -and $Keys -contains "$Key".Trim())) {
            [PSCustomObject]@{
                Id         = $Item.Id
                SettingsId = "$SettingsId"
                Key        = $Key
                Value      = $Item['GtSettingsValue']
                Enabled    = $Item['GtSettingsEnabled'] -eq $true
            }
        }
    }
    return , @($Rows)
}

<#
.SYNOPSIS
The version the site was last installed or upgraded with

.DESCRIPTION
Reads the newest entry of the installation log, as PreInstallUpgrade.ps1 does. Nothing when the
site has no installation log, as a new hub has none, or the log is empty. Errors are not caught.
#>
function Get-LastInstalledVersion {
    $List = Get-PnPList -Identity (Get-Resource -Name "Lists_InstallationLog_Title") -ErrorAction Stop
    if ($null -eq $List) {
        return $null
    }
    $LastInstall = Get-PnPListItem -List $List.Id -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>" -ErrorAction Stop | Select-Object -First 1 -Wait
    if ($null -eq $LastInstall) {
        return $null
    }
    return ParseVersionString -VersionString $LastInstall.FieldValues["InstallVersion"]
}

<#
.SYNOPSIS
Add a missing UsageStatisticsLevel row before the Portfolio template

.DESCRIPTION
The step before the template, for upgrades (PreInstallUpgrade.ps1) and for runs without -Upgrade on
a hub that has the list. It finds Globale innstillinger by its URL, as the template does, and:
- reports NoList when the list does not exist: the template then creates it with the row at 2;
- reports Exists when a row has the key UsageStatisticsLevel or the template's id, and changes it
  not;
- otherwise adds the row, with the template's id and the value Resolve-InitialUsageStatisticsLevel
  gives, and reports Added.
The template's Skip then leaves the row alone. Every read and write stops on an error, and nothing
is caught: a check that fails must never turn into an opt-in.

.PARAMETER ExplicitLevel
-UsageStatisticsLevel, or empty when it was not given

.PARAMETER PreviousVersion
The version the hub was last installed or upgraded with, or nothing when it is not known

.OUTPUTS
Outcome (NoList, Exists or Added), and for Added the Value, Reason and Text of the row it added
#>
function Initialize-UsageStatisticsSetting {
    Param(
        [AllowNull()][AllowEmptyString()][string]$ExplicitLevel,
        [AllowNull()][object]$PreviousVersion
    )
    $List = Get-PnPList -Identity (Get-Resource -Name "Lists_Global_Settings_Url") -ErrorAction Stop
    if ($null -eq $List) {
        return [PSCustomObject]@{ Outcome = 'NoList' }
    }
    $Rows = Get-UsageStatisticsRows -List $List
    $Existing = $Rows | Where-Object {
        (Test-SameGuid $_.SettingsId $UsageStatisticsLevelSettingId) -or "$($_.Key)".Trim() -eq 'UsageStatisticsLevel'
    } | Select-Object -First 1
    if ($null -ne $Existing) {
        return [PSCustomObject]@{ Outcome = 'Exists' }
    }
    $TelemetryUrlDisabled = [string]::IsNullOrWhiteSpace($ExplicitLevel) -and (Test-CatalogTelemetryUrlDisabled)
    $CatalogRows = @($Rows | Where-Object { "$($_.Key)".Trim() -eq 'CatalogTelemetryEnabled' })
    $Resolved = Resolve-InitialUsageStatisticsLevel -ExplicitLevel $ExplicitLevel -TelemetryUrlDisabled $TelemetryUrlDisabled -CatalogRows $CatalogRows -PreviousVersion $PreviousVersion
    Add-PnPListItem -List $List -Values @{
        "GtSettingsId"       = $UsageStatisticsLevelSettingId
        "Title"              = (Get-Resource -Name "Lists_Global_Settings_Category_General_UsageStatisticsLevel_Title")
        "GtSettingsKey"      = "UsageStatisticsLevel"
        "GtSettingsValue"    = "$($Resolved.Value)"
        "GtSettingsEnabled"  = $true
        "GtSettingsCategory" = (Get-Resource -Name "Lists_Global_Settings_Category_General")
    } -ErrorAction Stop | Out-Null
    return [PSCustomObject]@{ Outcome = 'Added'; Value = $Resolved.Value; Reason = $Resolved.Reason; Text = $Resolved.Text }
}

<#
.SYNOPSIS
Write an explicit usage statistics level to the hub

.DESCRIPTION
The write of -UsageStatisticsLevel, after the Portfolio template. It writes the level row found by
the template's id, else the last row with the key UsageStatisticsLevel (the one the browsers read),
and enables it; without either it adds the row with the template's id. Errors are not caught.

.PARAMETER Level
Off, Basic, Standard or Extended

.OUTPUTS
Old, the value the row held (with a note when it was disabled, nothing when there was no row), and
New, the value written
#>
function Set-UsageStatisticsLevel {
    Param(
        [Parameter(Mandatory = $true)]
        [ValidateSet('Off', 'Basic', 'Standard', 'Extended')]
        [string]$Level
    )
    $Value = "$(Convert-UsageStatisticsLevel -Level $Level)"
    $List = Get-PnPList -Identity (Get-Resource -Name "Lists_Global_Settings_Url") -ErrorAction Stop
    if ($null -eq $List) {
        throw "The list '$(Get-Resource -Name "Lists_Global_Settings_Title")' does not exist on the hub"
    }
    $Rows = Get-UsageStatisticsRows -List $List
    $Row = $Rows | Where-Object { Test-SameGuid $_.SettingsId $UsageStatisticsLevelSettingId } | Select-Object -First 1
    if ($null -eq $Row) {
        $Row = $Rows | Where-Object { "$($_.Key)".Trim() -eq 'UsageStatisticsLevel' } | Select-Object -Last 1
    }
    if ($null -eq $Row) {
        Add-PnPListItem -List $List -Values @{
            "GtSettingsId"       = $UsageStatisticsLevelSettingId
            "Title"              = (Get-Resource -Name "Lists_Global_Settings_Category_General_UsageStatisticsLevel_Title")
            "GtSettingsKey"      = "UsageStatisticsLevel"
            "GtSettingsValue"    = $Value
            "GtSettingsEnabled"  = $true
            "GtSettingsCategory" = (Get-Resource -Name "Lists_Global_Settings_Category_General")
        } -ErrorAction Stop | Out-Null
        return [PSCustomObject]@{ Old = $null; New = $Value }
    }
    Set-PnPListItem -List $List -Identity $Row.Id -Values @{
        "GtSettingsValue"   = $Value
        "GtSettingsEnabled" = $true
    } -ErrorAction Stop | Out-Null
    $Old = if ($Row.Enabled) { "$($Row.Value)" } else { "$($Row.Value) (disabled)" }
    return [PSCustomObject]@{ Old = $Old; New = $Value }
}

<#
.SYNOPSIS
Write -UsageStatisticsLevel to the hub, and report how it went

.DESCRIPTION
Calls Set-UsageStatisticsLevel and prints the change. A failed write is printed in red with the
manual step that replaces it, and the run goes on: the row then still holds what it held.

.PARAMETER Level
Off, Basic, Standard or Extended
#>
function Write-ExplicitUsageStatisticsLevel {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Level
    )
    try {
        $Result = Set-UsageStatisticsLevel -Level $Level
        $Old = if ($null -eq $Result.Old) { 'no row' } else { $Result.Old }
        Write-Host "[INFO] Usage statistics: UsageStatisticsLevel $Old -> $($Result.New) (from -UsageStatisticsLevel $Level)" -ForegroundColor Green
    }
    catch {
        $ListTitle = Get-Resource -Name "Lists_Global_Settings_Title"
        Write-Host "[ERROR] Failed to write UsageStatisticsLevel: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "[ERROR] Set UsageStatisticsLevel to $(Convert-UsageStatisticsLevel -Level $Level) in '$ListTitle' on the hub before users open it." -ForegroundColor Red
        Write-ErrorDetails $_
    }
}

<#
.SYNOPSIS
Print the usage statistics summary at the end of an installation or upgrade

.DESCRIPTION
Reads the hub's rows and prints Format-UsageStatisticsSummary. It writes nothing. When the rows
cannot be read, the summary says so and names the list.

.PARAMETER PingbackSent
Whether the run sends the installation pingback (no -SkipPingback)
#>
function Write-UsageStatisticsSummary {
    Param(
        [bool]$PingbackSent
    )
    $ListTitle = Get-Resource -Name "Lists_Global_Settings_Title"
    try {
        $List = Get-PnPList -Identity (Get-Resource -Name "Lists_Global_Settings_Url") -ErrorAction Stop
        if ($null -eq $List) {
            throw "the list does not exist"
        }
        $Effective = Get-EffectiveUsageStatisticsLevel -Rows (Get-UsageStatisticsRows -List $List)
        $Lines = Format-UsageStatisticsSummary -Effective $Effective -ListTitle $ListTitle -PingbackSent $PingbackSent
    }
    catch {
        $Lines = Format-UsageStatisticsSummary -Effective $null -ListTitle $ListTitle -PingbackSent $PingbackSent -ReadError $_.Exception.Message
    }
    foreach ($Line in $Lines) {
        $Color = if ($Line.StartsWith('[WARNING]')) { 'Yellow' } else { 'Cyan' }
        Write-Host $Line -ForegroundColor $Color
    }
}
#endregion
