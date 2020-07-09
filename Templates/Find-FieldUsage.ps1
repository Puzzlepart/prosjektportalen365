# Find-FieldUsage.ps1

$siteFields = Get-ChildItem ./Portfolio/Objects/SiteFields/*.xml | Select-Object -ExpandProperty BaseName

$xmlFiles = Get-ChildItem ./Portfolio/Objects/ContentTypes/*.xml,./Portfolio/Objects/Lists/*.xml -Recurse

$fields = @()

foreach ($field in $siteFields) {
    $object = [PSCustomObject]@{
        Name     = $field
        UsedIn = @()
    }
    $xmlFiles | ForEach-Object {
        $content = Get-Content $_.FullName | Out-String
        if($content -like "*$($field)*") {
            $object.UsedIn += ($_.FullName | Resolve-Path -Relative)
        }
    }
    $fields += $object
}

$fields | Format-Table