[xml]$ResourcesXml = Get-Content "$PSScriptRoot/../Resources.$LanguageCode.resx" -Raw
$Resources = $ResourcesXml.root.data

function Get-Resource {
    param (
        [string]$Name
    )
    $Resource = $Resources | Where-Object { $_.name -eq $Name }
    if ($null -eq $Resource) {
        Write-Error "Resource '$Name' not found."
        return $null
    }
    return $Resource.value
}