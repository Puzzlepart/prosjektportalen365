Param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$ListName,
    [Parameter(Mandatory = $true, Position = 1)]
    [string]$ResourceTokenPattern,
    [Parameter(Mandatory = $false)]
    [string]$ResxPath,
    [Parameter(Mandatory = $false)]
    [switch]$Save
)

# Example usage:
# ./Set-ListFields.ps1 Maloppsett -ResourceTokenPattern "Lists_TemplateOptions_Fields_{0}_{1}" -ResxPath ../../Templates/Portfolio/Resources.no-NB.resx

$File = Get-ChildItem -Path "$PSScriptRoot\..\..\Templates\**\$($ListName).xml" -Recurse 
$Content = Get-Content -Path $File.FullName
[xml]$Xml = $Content

$ResxValues = @()

$Xml.ListInstance.Fields.Field | ForEach-Object {
    $Field = $_

    if($Field.DisplayName -notlike "{resource:*") {
        $DisplayNameToken = ($ResourceTokenPattern -f $Field.Name, "DisplayName")
        $DescriptionToken = ($ResourceTokenPattern -f $Field.Name, "Description")

        $ResxValues += [PSCustomObject]@{
            Key        = $DisplayNameToken
            Value      = $Field.DisplayName
        }
        $ResxValues += [PSCustomObject]@{
            Key        = $DescriptionToken
            Value      = $Field.Description
        }

        $_.DisplayName = "{resource:$($DisplayNameToken)}"
        try {
            $_.Description = "{resource:$($DescriptionToken)}"
        }
        catch {
            Write-Host "Error setting description for field $($Field.Name)." -ForegroundColor Red
        }
    }
}

if($Save.IsPresent) {
    # Save the modified XML back to the file
    $Xml.Save($File.FullName)
    Write-Host "Field names for $ListName have been set." -ForegroundColor Green
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