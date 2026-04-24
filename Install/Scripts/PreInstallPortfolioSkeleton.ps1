<#
.SYNOPSIS
Bootstraps a minimal skeleton for the IdeaProcessing list before the main Portfolio.pnp template is applied.

.DESCRIPTION
Fresh installs fail when Portfolio.pnp tries to attach the calculated field GtIdeaStrategicNumber
(and its 4 siblings) to the IdeaProcessing list. SharePoint re-validates the calculated formula
against the list's columns at the moment the FieldRef is attached, and the source Choice column
may not yet be attached to the list. This script pre-provisions the 5 Choice source fields as site
columns and creates a minimal IdeaProcessing list with those columns attached. The full Portfolio.pnp
template then updates the existing list, and the calc fields validate successfully.

Dot-sourced from Install.ps1 in the fresh-install branch only. Assumes an active PnP connection
to the target site, and that Initialize-Resources has been called.
#>

function Resolve-PreInstallTokens {
    param (
        [Parameter(Mandatory = $true)][string]$Text
    )
    $Pattern = [regex]'\{resource:([^}]+)\}'
    return $Pattern.Replace($Text, {
        param($Match)
        $Key = $Match.Groups[1].Value
        $Value = Get-Resource -Name $Key
        if ($null -eq $Value) { return $Match.Value }
        return [System.Security.SecurityElement]::Escape($Value)
    })
}

$PreInstallFieldsPath = "$PSScriptRoot/../PreInstallFields"
$ChoiceFieldFiles = @(
    'GtIdeaStrategicValue.xml',
    'GtIdeaQualityBenefit.xml',
    'GtIdeaEconomicBenefit.xml',
    'GtIdeaOperationalNeed.xml',
    'GtIdeaRisk.xml'
)

foreach ($FieldFile in $ChoiceFieldFiles) {
    $FieldFilePath = Join-Path $PreInstallFieldsPath $FieldFile
    if (-not (Test-Path $FieldFilePath)) {
        Write-Host "`t[WARNING] Pre-install field file not found at $FieldFilePath. Skipping." -ForegroundColor Yellow
        continue
    }
    $FieldXmlRaw = Get-Content $FieldFilePath -Raw
    [xml]$ParsedFieldXml = $FieldXmlRaw
    $InternalName = $ParsedFieldXml.Field.Name
    $ExistingField = Get-PnPField -Identity $InternalName -ErrorAction SilentlyContinue
    if ($null -ne $ExistingField) {
        continue
    }
    $ResolvedXml = Resolve-PreInstallTokens -Text $FieldXmlRaw
    try {
        $null = Add-PnPFieldFromXml -FieldXml $ResolvedXml -ErrorAction Stop
        Write-Host "`t[INFO] Pre-provisioned site field $InternalName" -ForegroundColor Gray
    }
    catch {
        Write-Host "`t[WARNING] Failed to pre-provision site field $InternalName : $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

$ListTitle = Get-Resource -Name 'Lists_IdeaProcessing_Title'
$ListUrl = Get-Resource -Name 'Lists_IdeaProcessing_Url'
$ExistingList = Get-PnPList -Identity $ListUrl -ErrorAction SilentlyContinue
if ($null -eq $ExistingList) {
    try {
        $null = New-PnPList -Title $ListTitle -Url $ListUrl -Template GenericList -OnQuickLaunch:$false -ErrorAction Stop
        Write-Host "`t[INFO] Pre-provisioned list $ListTitle" -ForegroundColor Gray
    }
    catch {
        Write-Host "`t[WARNING] Failed to pre-provision list $ListTitle : $($_.Exception.Message)" -ForegroundColor Yellow
        return
    }
}

$ChoiceFieldInternalNames = @(
    'GtIdeaStrategicValue',
    'GtIdeaQualityBenefit',
    'GtIdeaEconomicBenefit',
    'GtIdeaOperationalNeed',
    'GtIdeaRisk'
)
foreach ($InternalName in $ChoiceFieldInternalNames) {
    $ExistingListField = Get-PnPField -List $ListUrl -Identity $InternalName -ErrorAction SilentlyContinue
    if ($null -ne $ExistingListField) {
        continue
    }
    try {
        $null = Add-PnPField -List $ListUrl -Field $InternalName -ErrorAction Stop
        Write-Host "`t[INFO] Attached field $InternalName to list $ListTitle" -ForegroundColor Gray
    }
    catch {
        Write-Host "`t[WARNING] Failed to attach field $InternalName to list $ListTitle : $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
