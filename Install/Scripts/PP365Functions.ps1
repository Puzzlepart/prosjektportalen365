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

    $items = Invoke-PnPSPRestMethod -Method Get ("/_api/web/lists/getbytitle('DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECOLLECTIONS')/items?`$filter=HubSiteId eq '{0}'" -f $filterId)
    return $items.value.SiteUrl
}