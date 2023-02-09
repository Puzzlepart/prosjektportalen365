function Get-PP365HubSiteChild {
    [CmdletBinding()]
    param(
        $Identity    
    )

    if ( -not (Get-PnPWeb | Select-Object Url) -like ("*admin.sharepoint.com*") ) {
        Write-Host "Not connected to an admin site, cannot get hubsite children"
        throw
    }

    if ($Identity.GetType().Name -eq "HubSiteProperties") {
        $FilterSiteId = $Identity.SiteId.ToString()
    }
    else {
        $FilterSiteId = $Identity
    }

    $Items = Get-PnPListItem -List "DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECOLLECTIONS" -PageSize 500
    $FilteredItems = $Items | Where-Object { $_["HubSiteId"] -eq $FilterSiteId -and $_["SiteId"] -ne $FilterSiteId }
    return $FilteredItems.FieldValues.SiteUrl
}