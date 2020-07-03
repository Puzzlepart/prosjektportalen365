$resources = @()

Get-ChildItem *.xml | ForEach-Object { 
    $xml = ([xml](Get-Content $_))
    $instance = $xml.ContentType 
    $name = $instance.Name
    $description = $instance.Description
    if ($instance.Name -notlike "{resource:*") {
        $key = Read-Host "Key for $($name)"
        $nameKey = "ContentTypes_$($key)_Name}"
        $descKey = "ContentTypes_$($key)_Description"
        $instance.Name = "{resource:$nameKey}"
        $instance.Description = "{resource:$descKey}"     
        #instan  
        $resources += @"
        <data name="$nameKey" xml:space="preserve">
        <value>$name</value>
      </data>
"@    
        $resources += @"
<data name="$descKey" xml:space="preserve">
<value>$description</value>
</data>
"@
        $xml.OuterXml | Out-File $_.FullName -Encoding utf8 -Force
    }
}

$resources -join "" | Out-File resources.xml