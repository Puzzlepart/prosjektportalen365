$resources = @()

Get-ChildItem *.xml | ForEach-Object { 
    $xml = ([xml](Get-Content $_))

    # Set instance
    $instance = $xml.Field

    $name = $instance.DisplayName
    $description = $instance.Description
    $internalName = $instance.Name

    if ($name -notlike "{resource:*") {
        Write-Host "Generating resources for $($internalName)" -ForegroundColor Cyan
        $nameKey = "SiteFields_$($internalName)_DisplayName"
        $descKey = "SiteFields_$($internalName)_Description"
        $instance.DisplayName = "{resource:$nameKey}"
        $instance.Description = "{resource:$descKey}"    
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

Write-Host "Generated $($resources.Length) resources" -ForegroundColor Cyan

$resources -join "" | Out-File resources.xml