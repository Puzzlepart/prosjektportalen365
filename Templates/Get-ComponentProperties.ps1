# Get-ComponentProperties.ps1

Param(
    [Parameter(Mandatory = $false)]
    [string]$Path = "./Portfolio/Objects/ClientSidePages/*.xml"
)

$XmlFiles = Get-ChildItem $Path -Exclude "*@.xml"

$XmlFiles | ForEach-Object {
    [xml]$xml = (Get-Content $_.FullName | Out-String)
    $xml.ClientSidePage.Sections.Section.Controls.CanvasControl.JsonControlData | Out-File "Component-$($_.BaseName).json"
}