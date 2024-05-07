Param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [Parameter(Mandatory = $false)]
    [switch]$Force
)

Write-Host "This script will clean up all traces of a Prosjektportalen installation"
Write-Host "The script will perform the following"
Write-Host "`t- Delete all projects under the $Url hub (including M365 group++)"
Write-Host "`t- Unsubscribe $Url as hub-site"
Write-Host "`t- Delete the hub site $Url"
Write-Host "`t- Delete all Project portal apps from the app catalog site"
Write-Host "`t- Delete all taxonomy terms and termsets under the Prosjektportalen-group"
Write-Host "`t- Delete all default Prosjektportalen site designs and site scripts"
Write-Host "`t- Delete all default Prosjektportalen search mappings"
Write-Host "IMPORTANT: This operation cannot be undone. All projects under the hub $Url will be deleted and no other Project portal instance will work after this script has been run." -ForegroundColor Red

if (-not $Force.isPresent) {
    $Input = Read-Host "Are you sure you want to proceed? (y/n)" 

    if ($Input.ToLower() -ne "y") {
        Write-Host "Exiting script"
        exit
    }
}

Write-Host "Starting cleanup process"

[System.Uri]$Uri = $Url
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")

Set-PnPTraceLog -Off

Connect-PnPOnline -Url $AdminSiteUrl -Interactive

Write-Host "Retrieving all sites of the Project Portal hub..."
$ProjectsHub = Get-PnPTenantSite -Identity $Url -ErrorAction SilentlyContinue
if ($null -ne $ProjectsHub -and $ProjectsHub.IsHubSite -eq $true -and $ProjectsHub.HubSiteId.Guid -ne "00000000-0000-0000-0000-000000000000") {
    $ProjectsInHub = Get-PnPTenantSite -Template "GROUP#0" | Where-Object { $_.HubSiteId -eq $ProjectsHub.HubSiteId -and $_.Url -ne $ProjectsHub.Url } | ForEach-Object { return $_.Url }

    $ProjectsInHub | ForEach-Object {
        Write-Host "Deleting project $_"
        $Project = Get-PnPTenantSite -Identity $_ -ErrorAction SilentlyContinue
        Remove-PnPMicrosoft365Group -Identity $Project.GroupId -ErrorAction SilentlyContinue
    }

    Write-Host "Unsubscribing hub site $Url"
    Unregister-PnPHubSite -Site $Url
}

Write-Host "Deleting hub site $Url"
Remove-PnPMicrosoft365Group -Identity $ProjectsHub.GroupId

Write-Host "Deleting all Project portal apps from the app catalog site"
Get-PnPApp -Scope Tenant | Where-Object { $_.Title.Contains("Prosjektportalen 365") } | ForEach-Object {
    Write-Host "`tDeleting app $($_.Title)"
    Remove-PnPApp -Identity $_.Id -Scope Tenant
}

Write-Host "Deleting all taxonomy terms and termsets under the Prosjektportalen-group"
Remove-PnPTermGroup -Identity "Prosjektportalen" -Force -ErrorAction SilentlyContinue

Write-Host "Deleting all default Prosjektportalen site designs and site scripts"
$SiteDesigns = Get-PnPSiteDesign | Where-Object { $_.Title.Contains("Prosjektområde") }

$SiteDesigns | ForEach-Object {
    $SiteScripts = Get-PnPSiteScript -SiteDesign $_ -ErrorAction SilentlyContinue

    $SiteScripts | ForEach-Object {
        Write-Host "`tDeleting site script $($_.Title)"
        Remove-PnPSiteScript -Identity $_.Id -Force
    }

    Write-Host "`tDeleting site design $($_.Title)"
    Remove-PnPSiteDesign -Identity $_.Id -Force
}

Write-Host "Removing search configuration (unable to remove managed metadata mappings)"
Remove-PnPSearchConfiguration -Path ".\..\SearchConfiguration.xml" -Scope Subscription

# TODO: Consider removing managed props via 
# Get-PnPSearchConfiguration -Scope Site -OutputFormat ManagedPropertyMappings
Write-Host "Cleanup complete! Hope you're happy now." -ForegroundColor Green