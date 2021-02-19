$DeprecatedIds = @(
    "d8558017-1e3b-4d13-82fa-2520e845297b", 
    "3ec6bcaf-28bc-4f2e-9e90-77e8cebf0b5f", 
    "57530c94-4fb2-4ca2-9279-16c57881fa19"
)

$Pages = Get-PnPFolder -Url SitePages -Includes Files | Select-Object -ExpandProperty Files

$Pages | ForEach-Object {
    $DeprecatedComponents = Get-PnPClientSideComponent -Page $_.Name | Where-Object { $DeprecatedIds.Contains($_.WebPartId) }
    if($DeprecatedComponents.Count -gt 0) {
        $_.Name
    }
}