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

$File = Get-ChildItem -Path "$PSScriptRoot\..\..\Templates\Portfolio\Objects\Lists\**\$($ListName).xml" -Recurse | Select-Object -First 1
$Content = Get-Content -Path $File.FullName
[xml]$Xml = $Content

$ResxValues = @()

$Xml.ListInstance.DataRows.DataRow | ForEach-Object {
    foreach($Value in $_.DataValue) {
        $Regex = '^(.*?)(\{resource:([^}]+)\})'
        $RegexMatches = [regex]::Matches($Value.InnerText, $Regex)
        if($RegexMatches.Groups.length -eq 4) {
            $ResourceKey = $RegexMatches.Groups[3].Value
            $ResourceValue = $RegexMatches.Groups[1].Value.Trim()
            $ResourceToken = $RegexMatches.Groups[2].Value.Trim()

            if($null -eq $ResourceValue -or $ResourceValue -eq "") {
              continue
            }

            $ExistingResxValue = $ResxValues | Where-Object { $_.Key -eq $ResourceKey }
            if($null -eq $ExistingResxValue) {
                $ResxValues += [PSCustomObject]@{
                    Key = $ResourceKey
                    Value = $ResourceValue
                }
            }
            $Value.InnerText = $ResourceToken
        }
    }
}

if($Save.IsPresent) {
    # Save the modified XML back to the file
    $Xml.Save($File.FullName)
    Write-Host "Data rows in $($File.FullName) have been updated." -ForegroundColor Green
} 

if($ResxPath -ne $null -and $ResxPath -ne "") {
    $ResxValues | Format-Table -AutoSize

    [xml]$ResxXml = Get-Content -Path $ResxPath
    $LastNode = $ResxXml.root.data | Select-Object -Last 1
    $NewResxValues = $ResxValues | Where-object { $_.Key -notin $ResxXml.root.data.name }
    if($NewResxValues.Count -eq 0) {
        Write-Host "No new resources to add to $ResxPath." -ForegroundColor Yellow
        return
    }
    $NewResxValues | ForEach-Object {
        $newNode = $LastNode.Clone()
        $newNode.name = $_.Key
        $newNode.value = $_.Value
        $ResxXml.root.AppendChild($newNode) | Out-Null
    }
    $ResxXml.Save($ResxPath)
    Write-Host "Resx file $ResxPath has been updated." -ForegroundColor Green
}