function Initialize-Resources {
    param (
        [Parameter(Mandatory = $true, HelpMessage = "Language code")]
        [ValidateSet('no-NB', 'en-US')]
        [string]$LanguageCode
    )
    [xml]$ResourcesXml = Get-Content "$PSScriptRoot/../Resources.$LanguageCode.resx" -Raw
    $global:Resources = $ResourcesXml.root.data
}

function Get-Resource {
    param (
        [string]$Name
    )
    if ($null -eq $global:Resources) {
        Write-Error "Resources not initialized. Call Initialize-Resources first."
        return $null
    }
    $Resource = $global:Resources | Where-Object { $_.name -eq $Name }
    if ($null -eq $Resource) {
        Write-Error "Resource '$Name' not found."
        return $null
    }
    return $Resource.value
}