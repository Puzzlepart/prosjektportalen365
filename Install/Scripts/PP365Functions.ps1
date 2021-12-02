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

    $ViewXml =
@"
<Query><Where><And><Eq><FieldRef Name='HubSiteId' /><Value Type='Guid'>{0}</Value></Eq><And><Neq><FieldRef Name='SiteId' /><Value Type='Guid'>{0}</Value></Neq><IsNull><FieldRef Name='TimeDeleted'/></IsNull></And></And></Where></Query>
"@ -f $filterId

    $items = Get-PnPListItem -List "DO_NOT_DELETE_SPLIST_TENANTADMIN_AGGREGATED_SITECOLLECTIONS" -PageSize 500 -Query $ViewXml
    return $items.FieldValues.SiteUrl
}