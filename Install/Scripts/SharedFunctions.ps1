
<#
.SYNOPSIS
Connect to SharePoint Online

.DESCRIPTION
Connect to SharePoint Online with the specified URL using PnP PowerShell

.PARAMETER Url
The URL to the SharePoint site

.EXAMPLE
Connect-SharePoint -Url https://contoso.sharepoint.com/sites/pp365
#>
function Connect-SharePoint {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    Try {
        if ($null -ne $global:__InteractiveCachedAccessTokens[$Url]) {
            Connect-PnPOnline -Url $Url -AccessToken $global:__InteractiveCachedAccessTokens[$Url]
        }
        if (-not [string]::IsNullOrEmpty($CI)) {
            $DecodedCred = ([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($CI))).Split("|")
            $Password = ConvertTo-SecureString -String $DecodedCred[1] -AsPlainText -Force
            $Credentials = New-Object -TypeName System.Management.Automation.PSCredential -ArgumentList $DecodedCred[0], $Password
            Connect-PnPOnline -Url $Url -Credentials $Credentials -ErrorAction Stop  -WarningAction Ignore
        }
        elseif ($Interactive.IsPresent) {
            Connect-PnPOnline -Url $Url -Interactive -ClientId $ClientId -ErrorAction Stop -WarningAction Ignore
            $global:__InteractiveCachedAccessTokens[$Url] = Get-PnPAppAuthAccessToken
        }
        elseif ($null -ne $PSCredential) {
            Connect-PnPOnline -Url $Url -Credentials $PSCredential -ErrorAction Stop  -WarningAction Ignore
        }
        elseif ($null -ne $GenericCredential -and $GenericCredential -ne "") {
            Connect-PnPOnline -Url $Url -Credentials $GenericCredential -ErrorAction Stop  -WarningAction Ignore
        }
        else {
            Connect-PnPOnline -Url $Url -Interactive -ClientId $ClientId -ErrorAction Stop -WarningAction Ignore
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
    Import-Module "$PSScriptRoot/PnP.PowerShell/PnP.PowerShell.psd1" -ErrorAction SilentlyContinue -WarningAction SilentlyContinue
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
        Write-Host "[ERROR] You can check out the list at $($Url)/Lists/Installasjonslogg."
        Write-Host "[ERROR] Make sure that the field 'Versjonsnummer' has a valid version number value."
        
        $Input = Read-Host "Do you still want to continue? [Y/N]"
        if ($Input -ne "Y" -and $Input -ne "y") {
            exit 0
        }
        return [Version]"999.99.99"
    }
}