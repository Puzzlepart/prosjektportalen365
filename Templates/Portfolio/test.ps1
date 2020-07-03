$unused = Get-Content './unused_resources.txt'

[xml]$xml = Get-Content ./Resources.no-NB.resx

$dataNodes = $xml.root.SelectNodes("data")

foreach($node in $dataNodes) {
    if($unused.Contains($node.name)) {
        Write-Host "Will remove $($node.name)"
        $node.ParentNode.RemoveChild($node)
    }
}

$xml.OuterXml | Out-File res.xml -Encoding utf8 -Force