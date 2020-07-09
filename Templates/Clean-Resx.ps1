$unused = Get-Content './unused_resources.txt'

[xml]$xml = Get-Content ./Portfolio/Resources.no-NB.resx

$dataNodes = $xml.root.SelectNodes("data")

foreach($node in $dataNodes) {
    if($unused.Contains($node.name)) {
        $node.ParentNode.RemoveChild($node)
        Write-Host "Removed resource $($node.Name)" -ForegroundColor Cyan
    }
}

$xml.OuterXml | Out-File ./Portfolio/Resources.no-NB.resx -Encoding utf8 -Force