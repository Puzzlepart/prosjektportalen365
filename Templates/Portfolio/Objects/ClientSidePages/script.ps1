$resources = @()

Get-ChildItem *.xml | ForEach-Object { 
    $xml = ([xml](Get-Content $_))

    # Set instance
    $instance = $xml.ClientSidePage

    $pageName = $instance.PageName
    $title = $instance.Title

    if ($pageName -notlike "{resource:*") {
        Write-Host "Generating resources for $($pageName)" -ForegroundColor Cyan
        $key = Read-Host "Key for $pageName"
        $pageNameKey = "ClientSidePages_$($key)_PageName"
        $titleKey = "ClientSidePages_$($key)_Title"
        $instance.PageName = "{resource:$pageNameKey}"
        $instance.Title = "{resource:$titleKey}"
        $resources += @"
        <data name="$pageNameKey" xml:space="preserve">
        <value>$pageName</value>
      </data>
"@    
        $resources += @"
<data name="$titleKey" xml:space="preserve">
<value>$title</value>
</data>
"@
        $xml.OuterXml | Out-File $_.FullName -Encoding utf8 -Force
    }
}

Write-Host "Generated $($resources.Length) resources" -ForegroundColor Cyan

$resources -join "" | Out-File resources.xml