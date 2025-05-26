Param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [Parameter(Mandatory = $false)]
    [switch]$Force,
    [Parameter(Mandatory = $false, HelpMessage = "Client ID of the Entra Id application used for interactive logins. Defaults to the multi-tenant Prosjektportalen app")]
    [string]$ClientId = "da6c31a6-b557-4ac3-9994-7315da06ea3a"
)

Write-Host "This script will clean up traces of a Prosjektportalen installation"
Write-Host "The script will perform the following"
Write-Host "`t- Delete all projects under the $Url hub (including M365 group++)"
Write-Host "`t- Unsubscribe $Url as hub-site"
Write-Host "`t- Delete the hub site $Url"
Write-Host "`t- Delete all Prosjektportalen apps from the app catalog site"
Write-Host "`t- Delete all taxonomy terms and termsets under the Prosjektportalen-group"
Write-Host "`t- Delete all default Prosjektportalen site designs and site scripts"
Write-Host "`t- Delete all default Prosjektportalen search mappings"
Write-Host ""
Write-Host "IMPORTANT: This operation cannot be undone. All projects under the hub $Url will be deleted." -ForegroundColor Red
Write-Host "No other Project portal instance will work after this script has been run." -ForegroundColor Red
Write-Host ""

if (-not $Force.isPresent) {
    $Input = Read-Host "Are you sure you want to proceed? (y/n)" 

    if ($Input.ToLower() -ne "y") {
        Write-Host "Exiting script"
        exit
    }
}

Write-Host "🧼 Starting cleanup process"

[System.Uri]$Uri = $Url
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")

# Set-PnPTraceLog -Off

Connect-PnPOnline -Url $AdminSiteUrl -Interactive -ClientId $ClientId

Write-Host "🗃️ Retrieving all sites of the Project Portal hub..."
$ProjectsHub = Get-PnPTenantSite -Identity $Url -ErrorAction SilentlyContinue
if ($null -ne $ProjectsHub -and $ProjectsHub.IsHubSite -eq $true -and $ProjectsHub.HubSiteId.Guid -ne "00000000-0000-0000-0000-000000000000") {
    $ProjectsInHub = Get-PnPTenantSite -Template "GROUP#0" | Where-Object { $_.HubSiteId -eq $ProjectsHub.HubSiteId -and $_.Url -ne $ProjectsHub.Url }

    $ProjectsInHub | ForEach-Object {
        $Project = $_
        if ($Project.GroupId -ne "00000000-0000-0000-0000-000000000000" -and $null -ne $ProjectsHub.GroupId) {
            $Group = Get-PnPMicrosoft365Group -Identity $Project.GroupId -ErrorAction SilentlyContinue
            if ($null -ne $Group) {
                Write-Host "`tDeleting M365 group associated with project '$($Project.Title)'"
                Write-Host "`tThe SharePoint site at $Url will be automatically deleted within 60 minutes"
                Remove-PnPMicrosoft365Group -Identity $Project.GroupId
                Remove-PnPDeletedMicrosoft365Group -Identity $Project.GroupId
            }
        }
    }

    Write-Host "🌘 Unsubscribing hub site $Url"
    Unregister-PnPHubSite -Site $Url -ErrorAction SilentlyContinue
}

if ($null -ne $ProjectsHub) {
    if ($ProjectsHub.GroupId -ne "00000000-0000-0000-0000-000000000000" -and $null -ne $ProjectsHub.GroupId) {
        $Group = Get-PnPMicrosoft365Group -Identity $ProjectsHub.GroupId -ErrorAction SilentlyContinue
        if ($null -ne $Group) {
            Write-Host "🗑️ Deleting M365 group associated with '$($ProjectsHub.Title)'"
            Write-Host "🗃️ The SharePoint site at $Url will be automatically deleted within 60 minutes"
            Remove-PnPMicrosoft365Group -Identity $ProjectsHub.GroupId
            Remove-PnPDeletedMicrosoft365Group -Identity $ProjectsHub.GroupId
        }
    }
}

Write-Host "📦 Retrieving all Project portal apps from the app catalog site"
Get-PnPApp -Scope Tenant | Where-Object { $_.Title.Contains("Prosjektportalen 365") } | ForEach-Object {
    Write-Host "`tDeleting app $($_.Title)"
    Remove-PnPApp -Identity $_.Id -Scope Tenant
}

Write-Host "🌲 Deleting all taxonomy terms and termsets under the Prosjektportalen-group"
Remove-PnPTermGroup -Identity "Prosjektportalen" -Force -ErrorAction SilentlyContinue

Write-Host "📜 Retrieving all default Prosjektportalen site designs and site scripts"
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

Write-Host "🔎 Removing search configuration (unable to remove managed metadata mappings)"
Remove-PnPSearchConfiguration -Path "$PSScriptRoot\..\SearchConfiguration.xml" -Scope Subscription

# TODO: Consider removing managed props via 
# Get-PnPSearchConfiguration -Scope Site -OutputFormat ManagedPropertyMappings
Write-Host "🥳 Cleanup complete! Hope you're happy now." -ForegroundColor Green