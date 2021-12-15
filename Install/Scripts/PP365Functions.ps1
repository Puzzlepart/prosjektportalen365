function Get-PP365HubSiteChild {
    [CmdletBinding()]
    param(
        $Identity    
    )

    if( -not (Get-PnPWeb | select Url) -like ("*admin.sharepoint.com*") ){
        Write-Host "Not connected to an admin site, cannot get hubsite children"
        throw
    }

    if($Identity.GetType().Name -eq "HubSiteProperties"){
        $filterId = $Identity.SiteId.ToString()
    } else {
        $filterId = $Identity
    }

    $items = Get-PnPListItem -List "DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECOLLECTIONS" -PageSize 500
    $filteredItems = $items | Where-Object {$_["HubSiteId"] -eq $filterId -and $_["SiteId"] -ne $filterId}
    return $filteredItems.FieldValues.SiteUrl
}