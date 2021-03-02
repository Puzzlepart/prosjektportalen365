# Encode-JSON.ps1

Param(
    [Parameter(Mandatory = $true)]
    [string]$Path 
)

$File = Get-ChildItem $Path

$Content = Get-Content $Path -Raw | ConvertFrom-Json | ConvertTo-Json -Compress -Depth 10
[System.Web.HttpUtility]::HtmlEncode($Content) | Out-File "$($File.BaseName)_Encoded.txt"