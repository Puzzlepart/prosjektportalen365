Param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$FieldName,
    [Parameter(Mandatory = $true, Position = 1)]
    [string]$InputPath
)

$File = Get-ChildItem -Path "$PSScriptRoot\..\..\Templates\**\$($FieldName).xml" -Recurse 
$Content = Get-Content -Path $File.FullName
[xml]$Xml = $Content

$CustomFormatter = Get-Content -Path $InputPath

$xml.Field.CustomFormatter = $CustomFormatter

# Save the modified XML back to the file
$xml.Save($File.FullName)
Write-Host "Custom formatter for $FieldName has been set." -ForegroundColor Green