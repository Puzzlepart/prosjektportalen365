Param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$FieldName,
    [Parameter(Mandatory = $false, Position = 1)]
    [string]$Out
)

$File = Get-ChildItem -Path "$PSScriptRoot\..\..\Templates\**\$($FieldName).xml" -Recurse 
$Content = Get-Content -Path $File.FullName
[xml]$Xml = $Content

if($null -ne $Out) {
    $Xml.Field.CustomFormatter | Out-File -FilePath $Out -Encoding utf8
} else {
    $Xml.Field.CustomFormatter
}