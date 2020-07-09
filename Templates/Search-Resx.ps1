# Search-Resx.ps1

Param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceFile
)

$xmlFiles = Get-ChildItem *.xml -Recurse

$usedRes = @()

$xmlFiles | ForEach-Object {
    $content = Get-Content $_.FullName | Out-String
    [regex]::Matches($content, "{resource:(?<key>[A-Za-z0-9_]*)}", [System.Text.RegularExpressions.RegexOptions]::Multiline) | ForEach-Object {
        $resKey = $_.Groups | Where-Object { $_.Name -eq "key" } | Select-Object -ExpandProperty value
        $usedRes += $resKey
    }
}

$content = Get-Content $ResourceFile | Out-String

$availableRes = @()

[regex]::Matches($content, 'data name="(?<key>[A-Za-z_]*)"', [System.Text.RegularExpressions.RegexOptions]::Multiline) | ForEach-Object {
    $resKey = $_.Groups | Where-Object { $_.Name -eq "key" } | Select-Object -ExpandProperty value
    $availableRes += $resKey
}

$unusedRes = Compare-Object $usedRes $availableRes | Where-Object { $_.SideIndicator -eq "=>" } | Select-Object -ExpandProperty InputObject 

Write-Host "Found $($unusedRes.Length) unusued resources" -ForegroundColor Cyan

$unusedRes | Out-File unused_resources.txt -Encoding utf8 -Force
