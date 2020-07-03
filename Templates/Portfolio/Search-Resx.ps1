
$xmlFiles = Get-ChildItem *.xml -Recurse


$usedRes = @()

$xmlFiles | ForEach-Object {
    $content = Get-Content $_.FullName | Out-String
    [regex]::Matches($content, "{resource:(?<key>[A-Za-z0-9_]*)}", [System.Text.RegularExpressions.RegexOptions]::Multiline) | ForEach-Object {
        $resKey = $_.Groups | Where-Object { $_.Name -eq "key" } | Select-Object -ExpandProperty value
        $usedRes += $resKey
    }
}

$usedRes | Select-Object -Unique | Out-File used_resources.txt -Encoding utf8 -Force

$content = Get-Content ./Resources.no-NB.resx | Out-String

$availableRes = @()

[regex]::Matches($content, 'data name="(?<key>[A-Za-z_]*)"', [System.Text.RegularExpressions.RegexOptions]::Multiline) | ForEach-Object {
    $resKey = $_.Groups | Where-Object { $_.Name -eq "key" } | Select-Object -ExpandProperty value
    $availableRes += $resKey
}

$availableRes | Select-Object -Unique | Out-File available_resources.txt -Encoding utf8 -Force

$unusedRes = Compare-Object $usedRes $availableRes | Where-Object { $_.SideIndicator -eq "=>" } | Select-Object -ExpandProperty InputObject 

Write-Host "Found $($unusedRes.Length) unusued resources" -ForegroundColor Cyan

$unusedRes | Out-File unused_resources.txt -Encoding utf8 -Force
