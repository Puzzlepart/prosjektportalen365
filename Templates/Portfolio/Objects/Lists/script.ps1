$resources = @()

Get-ChildItem *.xml | ForEach-Object { 
    $xml = ([xml](Get-Content $_))
    $instance = $xml.ListInstance 
    $title = $instance.Title
    $url = $instance.Url
    if ($instance.Title -notlike "{resource:*") {
        $key = Read-Host "Key for $($instance.Title)"
        $titleKey = " {resource:Lists_$($key)_Title}"
        $urlKey = "{resource:Lists_$($key)_Url}"
        $instance.Title = $titleKey
        $instance.Url = $urlKey        
        $resources += @"
        <data name="$titleKey" xml:space="preserve">
        <value>$title</value>
      </data>
"@    
        $resources += @"
<data name="$urlKey" xml:space="preserve">
<value>$url</value>
</data>
"@
        $xml.OuterXml | Out-File $_.FullName -Encoding utf8 -Force
    }
}

$resources -join "" | Out-File resources.xml