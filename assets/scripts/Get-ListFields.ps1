Param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$ListName,
    [Parameter(Mandatory = $false)]
    [string]$Out
)

$File = Get-ChildItem -Path "$PSScriptRoot\..\..\Templates\**\$($ListName).xml" -Recurse 
$Content = Get-Content -Path $File.FullName
[xml]$Xml = $Content

# Check if $Out is provided and is not empty
if($Out -ne $null -and $Out -ne "") {
    $Fields = @()
    $Xml.ListInstance.Fields.Field | ForEach-Object {
        $Field = $_
        $Fields += [PSCustomObject]@{
            ID          = $Field.ID    
            Name        = $Field.Name
            Type        = $Field.Type
            DisplayName = $Field.DisplayName
        }
    }
    $Fields | ConvertTo-Json -Depth 10 | Out-File -FilePath $Out -Encoding utf8
} else {
    $Xml.ListInstance.Fields.Field
}