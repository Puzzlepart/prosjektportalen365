
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
            } else {
                throw "Missing certificate or tenant for CI mode"
            }

        }
        else {
            Connect-PnPOnline -Url $Url -Interactive -ClientId $ConnectionInfo.ClientId -ErrorAction Stop -WarningAction Ignore
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
Loaa PnP.PowerShell from bundle and return version.
#>
function LoadBundle() {
    Import-Module "$PWD/PnP.PowerShell/PnP.PowerShell.psd1" -ErrorAction SilentlyContinue -WarningAction SilentlyContinue
    return (Get-Command Connect-PnPOnline).Version
}

<#
.SYNOPSIS
Parse version string

.DESCRIPTION
Parse version string and return version object.

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