Param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$ListName,
    [Parameter(Mandatory = $false)]
    [string]$ResxPath,
    [Parameter(Mandatory = $false)]
    [switch]$Save
)

# Example usage:
# ./Set-ListDataRows.ps1 "Globale innstillinger" -ResxPath ../../Templates/Portfolio/Resources.no-NB.resx

$File = Get-ChildItem -Path "$PSScriptRoot\..\..\Templates\**\$($ListName).xml" -Recurse 
$Content = Get-Content -Path $File.FullName
[xml]$Xml = $Content

$ResxValues = @()

$Xml.ListInstance.DataRows.DataRow | ForEach-Object {
    foreach($Value in $_.DataValue) {
        $Regex = '^(.*?)(\{resource:([^}]+)\})'
        $Matches = [regex]::Matches($Value.InnerText, $Regex)
        if($Matches.Groups.length -eq 4) {
            $ResourceKey = $Matches.Groups[3].Value
            $ResourceValue = $Matches.Groups[1].Value
            $ResxValues += [PSCustomObject]@{
                Key = $ResourceKey
                Value = $ResourceValue
            }
        }
    }
}

$ResxValues

if($Save.IsPresent) {
    # Save the modified XML back to the file
    $Xml.Save($File.FullName)
    Write-Host "Data rows in $($File.FullName) have been updated." -ForegroundColor Green
} 

if($ResxPath -ne $null -and $ResxPath -ne "") {
    [xml]$ResxXml = Get-Content -Path $ResxPath
    $lastNode = $ResxXml.root.data | Select-Object -Last 1
    $ResxValues | ForEach-Object {
        $newNode = $lastNode.Clone()
        $newNode.name = $_.Key
        $newNode.value = $_.Value
        $ResxXml.root.AppendChild($newNode) | Out-Null
    }
    $ResxXml.Save($ResxPath)
    Write-Host "Resx file $ResxPath has been updated." -ForegroundColor Green
}