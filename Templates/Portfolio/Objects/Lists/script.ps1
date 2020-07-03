

Get-ChildItem *.xml | ForEach-Object { 
    $xml = ([xml](Get-Content $_))
    $instance = $xml.ListInstance 
    if($instance.Title -notlike "{resource:*") {
        $key = Read-Host "Key for $($instance.Title)"
        $titleKey =" {resource:Lists_$($key)_Title}"
        $urlKey =  "{resource:Lists_$($key)_Url}"
        $instance.Title = $titleKey
        $instance.Url = $urlKey
        
    }
    $xml.OuterXml | Out-File $_.FullName -Encoding utf8 -Force
}