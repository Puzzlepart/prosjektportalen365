$items = Get-ChildItem ./Objects/ClientSidePages/*.xml -Exclude "*@.xml"

$items | ForEach-Object {
    [xml]$xml = (Get-Content $_.FullName | Out-String)
    $xml.ClientSidePage.Sections.Section.Controls.CanvasControl.JsonControlData | Out-File "$($_.BaseName).json"
}