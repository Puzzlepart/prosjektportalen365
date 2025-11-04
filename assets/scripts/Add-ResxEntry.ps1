Param(
    [Parameter(Mandatory = $true)]
    [string]$Key
)

$RESX_FILES_DIR = "$PSScriptRoot\..\..\Templates\Portfolio"

Get-ChildItem $RESX_FILES_DIR -Filter *.resx | ForEach-Object {
    $LanguageCode = $_.BaseName -replace '.*\.', ''
    $Value = Read-Host "Enter the value for $Key in $($LanguageCode):"
    if (-not $Value) {
        Write-Host "No value provided for $Key in $($LanguageCode). Skipping."
        return
    }
    $Xml = [xml](Get-Content $_.FullName)
    $LastNode = $Xml.root.data | Select-Object -Last 1
    $NewNode = $LastNode.Clone()
    $NewNode.name = $Key
    $NewNode.value = $Value
    $Xml.root.AppendChild($NewNode) | Out-Null
    $Xml.Save($_.FullName)
    Write-Host "Added $Key with value '$Value' to $($LanguageCode) resource file." -ForegroundColor Green
}