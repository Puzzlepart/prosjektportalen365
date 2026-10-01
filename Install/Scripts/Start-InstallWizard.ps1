<#
.SYNOPSIS
Guided start of an installation or upgrade of Prosjektportalen 365

.DESCRIPTION
Asks for the installation options, shows the equivalent PowerShell command and runs Install.ps1
or Scripts/UpgradeAllSitesToLatest.ps1 with them. All installation logic stays in those scripts.

Started by Start-Install.cmd, which checks the environment first, but it can also be run directly in PowerShell 7.
#>
Param()

# Must stay parseable by Windows PowerShell 5.1 so users get guidance instead of a syntax error.
if ($PSVersionTable.PSVersion -lt [version]"7.4") {
    Write-Host "[ERROR] The installation wizard requires PowerShell 7.4 or newer. You are running PowerShell $($PSVersionTable.PSVersion)." -ForegroundColor Red
    Write-Host "        Double-click Start-Install.cmd in the release folder; it tells you how to get PowerShell 7." -ForegroundColor Red
    exit 1
}
if ($ExecutionContext.SessionState.LanguageMode -ne "FullLanguage") {
    Write-Host "[ERROR] PowerShell is running in $($ExecutionContext.SessionState.LanguageMode) mode, usually enforced by AppLocker or WDAC. The installation requires FullLanguage mode. Contact your IT department." -ForegroundColor Red
    exit 1
}
if ([Console]::IsInputRedirected) {
    Write-Host "[ERROR] The installation wizard needs an interactive console. For unattended runs, call Install.ps1 with parameters instead." -ForegroundColor Red
    exit 1
}

$ErrorActionPreference = "Stop"
. "$PSScriptRoot/SharedFunctions.ps1"

$ReleaseRoot = Split-Path -Path $PSScriptRoot -Parent
$DefaultTitles = @{
    "Norwegian" = "Prosjektportalen"
    "English"   = "Project Portal"
}

<#
.SYNOPSIS
Ask the user to pick one of several options

.OUTPUTS
The zero-based index of the selected option.
#>
function Read-Choice {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Question,
        [Parameter(Mandatory = $true)]
        [string[]]$Options,
        [int]$Default = 0
    )
    $Choices = [System.Collections.ObjectModel.Collection[System.Management.Automation.Host.ChoiceDescription]]::new()
    $Options | ForEach-Object { $Choices.Add([System.Management.Automation.Host.ChoiceDescription]::new($_)) }
    return $Host.UI.PromptForChoice("", $Question, $Choices, $Default)
}

<#
.SYNOPSIS
Ask for a text value, repeating until it is valid

.PARAMETER Validate
Script block that receives the value and returns an error message, or nothing if the value is valid

.PARAMETER Optional
Allow an empty answer (returns an empty string)
#>
function Read-Value {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Prompt,
        [string]$Default,
        [scriptblock]$Validate,
        [switch]$Optional
    )
    while ($true) {
        $Suffix = if ($Default) { " [$Default]" } elseif ($Optional.IsPresent) { " (optional, press Enter to skip)" } else { "" }
        $Value = ([string](Read-Host "$Prompt$Suffix")).Trim()
        if (-not $Value) {
            $Value = $Default
        }
        if (-not $Value) {
            if ($Optional.IsPresent) {
                return ""
            }
            continue
        }
        if ($null -ne $Validate) {
            $ValidationError = & $Validate $Value
            if ($ValidationError) {
                Write-Host "  $ValidationError" -ForegroundColor Yellow
                continue
            }
        }
        return $Value
    }
}

function Read-YesNo {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Question,
        [bool]$Default = $false
    )
    $DefaultIndex = if ($Default) { 0 } else { 1 }
    return (Read-Choice -Question $Question -Options @("&Yes", "&No") -Default $DefaultIndex) -eq 0
}

function Test-GuidValue($Value) {
    $Guid = [guid]::Empty
    if (-not [guid]::TryParse($Value, [ref]$Guid)) {
        return "'$Value' is not a valid GUID (e.g. 00000000-0000-0000-0000-000000000000)."
    }
}

function Test-HttpsUrlValue($Value) {
    $Uri = $null
    if (-not [System.Uri]::TryCreate($Value, [System.UriKind]::Absolute, [ref]$Uri) -or $Uri.Scheme -ne "https") {
        return "'$Value' is not a valid https URL."
    }
}

Write-Host ""
Write-Host "Prosjektportalen 365 - installation wizard" -ForegroundColor Cyan
Write-Host "Answer the questions below. The wizard shows the equivalent PowerShell command before anything is changed." -ForegroundColor Cyan
Write-Host ""

$Mode = Read-Choice -Question "What do you want to do?" -Options @(
    "&New installation",
    "&Upgrade an existing installation",
    "Upgrade &all project sites to the latest version (UpgradeAllSitesToLatest)",
    "E&xit"
)
if ($Mode -eq 3) {
    exit 0
}

$Parameters = [ordered]@{}
$Parameters.Url = Read-Value -Prompt "Portfolio site URL (e.g. https://contoso.sharepoint.com/sites/prosjektportalen)" -Validate { Get-PortfolioUrlError -Url $args[0] }
$Language = @("Norwegian", "English")[(Read-Choice -Question "Language of the portfolio site" -Options @("&Norwegian", "&English"))]
$Parameters.Language = $Language

if ($Mode -eq 2) {
    $ScriptName = "./Scripts/UpgradeAllSitesToLatest.ps1"
    Write-Host "Prosjektveiviseren v6 can rename display names on the project sites from gevinst- to nytte-terminology. Internal field names, URLs and list data are never changed."
    if (Read-YesNo -Question "Update the terminology on the project sites (-GevinstTilNytte)?") {
        $Parameters.GevinstTilNytte = $true
    }
}
else {
    $ScriptName = "./Install.ps1"
    if ($Mode -eq 0) {
        $Title = Read-Value -Prompt "Title of the portfolio site" -Default $DefaultTitles[$Language]
        if ($Title -ne $DefaultTitles[$Language]) {
            $Parameters.Title = $Title
        }
    }
    else {
        $Parameters.Upgrade = $true
    }
    if (Read-YesNo -Question "Configure advanced options (app catalog URL, site design access, custom Entra ID app)?") {
        $TenantAppCatalogUrl = Read-Value -Prompt "Tenant app catalog URL" -Optional -Validate { Test-HttpsUrlValue $args[0] }
        if ($TenantAppCatalogUrl) {
            $Parameters.TenantAppCatalogUrl = $TenantAppCatalogUrl
        }
        $SiteDesignSecurityGroupId = Read-Value -Prompt "ID of the security group that should see the project site design" -Optional -Validate { Test-GuidValue $args[0] }
        if ($SiteDesignSecurityGroupId) {
            $Parameters.SiteDesignSecurityGroupId = $SiteDesignSecurityGroupId
        }
        $ClientId = Read-Value -Prompt "Client ID of your own Entra ID app for sign-in" -Optional -Validate { Test-GuidValue $args[0] }
        if ($ClientId) {
            $Parameters.ClientId = $ClientId
        }
    }
}

$Command = Format-ScriptCommand -ScriptName $ScriptName -Parameters $Parameters
Write-Host ""
Write-Host "The wizard will run this command from $($ReleaseRoot):" -ForegroundColor Cyan
Write-Host ""
Write-Host "    $Command"
Write-Host ""

if ((Read-Choice -Question "Run it now?" -Options @("&Run now", "E&xit without running")) -ne 0) {
    Write-Host "Nothing was changed. To run it later, open PowerShell 7 (pwsh) in $ReleaseRoot and run the command above."
    exit 0
}

$ScriptPath = Join-Path $ReleaseRoot $ScriptName
$global:LASTEXITCODE = 0
try {
    & $ScriptPath @Parameters
}
catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-ErrorDetails $_
    exit 1
}
exit $LASTEXITCODE
