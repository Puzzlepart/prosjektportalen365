Param(
    [Parameter(Mandatory = $true, HelpMessage = "The url to the project portal portfolio site")]
    [string]$PortfolioUrl
)

function EnsureProjectTimelinePage($Url) {
    Connect-PnPOnline -Url $Url -UseWebLogin
        
    $existingNodes = Get-PnPNavigationNode -Location QuickLaunch -ErrorAction SilentlyContinue
    if ($null -eq $existingNodes) {
        Write-Host "`t`tCannot connect to site. Do you have access?" -ForegroundColor Red
    }
    else {
        $existingNode = $existingNodes | Where-Object { $_.Title -eq "Prosjekttidslinje" } -ErrorAction SilentlyContinue
        if ($null -eq $existingNode) {
            Write-Host "`t`tAdding project timeline page"
            $page = Add-PnPClientSidePage -Name "Prosjekttidslinje.aspx" -LayoutType SingleWebPartAppPage -CommentsEnabled:$false
            Write-Host "`t`tAdding project timeline app"
            $webpart = Add-PnPClientSideWebPart -Page "Prosjekttidslinje" -Component "Prosjekttidslinje" -WebPartProperties '{"listName":"Tidslinjeinnhold","showFilterButton":true,"showTimeline":true,"showInfoMessage":true,"showCmdTimelineList":true,"showTimelineList":true,"title":"Prosjekttidslinje"}'
            $page = Set-PnPClientSidePage -Identity $page -Publish
            Write-Host "`t`tAdding project timeline navigation item"
            $node = Add-PnPNavigationNode -Location QuickLaunch -Title "Prosjekttidslinje" -Url "SitePages/Prosjekttidslinje.aspx"
        }
        else {        
            Write-Host "`t`tThe project already has the project timeline page. " -ForegroundColor Yellow
        }

    }
}

function UpgradeSite($Url) {
    EnsureProjectTimelinePage -Url $Url
}

Write-Host "This script will update all existing sites in a Prosjektportalen installation. This requires you to have the SharePoint admin role"

[System.Uri]$Uri = $PortfolioUrl
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")

Connect-PnPOnline -Url $AdminSiteUrl -UseWebLogin

$PPHubSite = Get-PnPHubSite -Identity $PortfolioUrl
$ProjectsInHub = Get-PnPHubSiteChild -Identity $PPHubSite

# Get current logged in user
$ctx = Get-PnPContext
$ctx.Load($ctx.Web.CurrentUser)
$ctx.ExecuteQuery()
$UserName = $ctx.Web.CurrentUser.Email

Write-Host "The following sites were found to be part of the Project Portal hub:"
$ProjectsInHub | ForEach-Object { Write-Host "`t$_" }

Write-Host "We can grant $UserName admin access to existing projects. This will ensure that all project will be upgraded. If you select no, the script will only upgrade the sites you are already an owner of."
do {
    $YesOrNo = Read-Host "Do you want to grant $UserName access to all sites in the hub (listed above)? (y/n)"
} 
while ("y","n" -notcontains $YesOrNo)

if ($YesOrNo -eq "y") {
    $ProjectsInHub | ForEach-Object {
        Write-Host "`tGranting access to $_"
        Set-PnPTenantSite -Url $_ -Owners $UserName
    }
}

Write-Host "Upgrading existing sites"
$ProjectsInHub | ForEach-Object {
    Write-Host "`tUpgrading site $_"
    UpgradeSite -Url $_
    Write-Host "`t`tDone processing $_" -ForegroundColor Green
}

Write-Host "We can remove $UserName's admin access from existing projects."
do {
    $YesOrNo = Read-Host "Do you want to remove $UserName's admin access from all sites in the hub? (y/n)"
} 
while ("y","n" -notcontains $YesOrNo)

if ($YesOrNo -eq "y") {
    $ProjectsInHub | ForEach-Object {
        Write-Host "`tRemoving access to $_"
        Connect-PnPOnline -Url $_ -UseWebLogin
        Remove-PnPSiteCollectionAdmin -Owners $UserName
    }
}




