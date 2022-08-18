Param(
    [Parameter(Mandatory = $true, HelpMessage = "The url to the project portal portfolio site")]
    [string]$PortfolioUrl,
    [switch]$FixPlannerPlans
)

$ScriptDir = (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)
. $ScriptDir\PP365Functions.ps1

function EnsureProjectTimelinePage($Url) {
    Connect-PnPOnline -Url $Url -UseWebLogin
        
    $existingNodes = Get-PnPNavigationNode -Location QuickLaunch -ErrorAction SilentlyContinue
    if ($null -eq $existingNodes) {
        Write-Host "`t`tCannot connect to site. Do you have access?" -ForegroundColor Red
    }
    else {
        $existingNode = $existingNodes | Where-Object { $_.Title -eq "Prosjekttidslinje" -or $_.Title -eq "Programtidslinje" } -ErrorAction SilentlyContinue
        if ($null -eq $existingNode) {
            Write-Host "`t`tAdding project timeline to site"
            Write-Host "`t`t`tAdding project timeline page"
            $page = Add-PnPClientSidePage -Name "Prosjekttidslinje.aspx" -PromoteAs None -LayoutType SingleWebPartAppPage -CommentsEnabled:$false -Publish
            Write-Host "`t`t`tAdding project timeline app"
            $webpart = Add-PnPClientSideWebPart -Page "Prosjekttidslinje" -Component "Prosjekttidslinje" -WebPartProperties '{"listName":"Tidslinjeinnhold","showFilterButton":true,"showTimeline":true,"showInfoMessage":true,"showCmdTimelineList":true,"showTimelineList":true,"title":"Prosjekttidslinje"}'
            $page = Set-PnPClientSidePage -Identity "Prosjekttidslinje" -LayoutType SingleWebPartAppPage -HeaderType None -Publish 
            Write-Host "`t`t`tAdding project timeline navigation item"
            $node = Add-PnPNavigationNode -Location QuickLaunch -Title "Prosjekttidslinje" -Url "SitePages/Prosjekttidslinje.aspx"
        }
        else {        
            Write-Host "`t`tThe site already has the project timeline page" -ForegroundColor Green
        }

    }
}

function EnsureResourceLoadIsSiteColumn($Url) {
    Connect-PnPOnline -Url $Url -UseWebLogin

    $ResourceAllocation = Get-PnPList -Identity "Ressursallokering" -ErrorAction SilentlyContinue
    if ($null -ne $ResourceAllocation) {
        $ResourceLoadSiteColumn = Get-PnPField -Identity "GtResourceLoad"
        $ResourceLoadListColumn = Get-PnPField -Identity "GtResourceLoad" -List $ResourceAllocation
        if ($null -ne $ResourceLoadSiteColumn) {
            Write-Host "`t`tReplacing GtResourceLoad field"
            $PreviousValues = Get-PnPListItem -List $ResourceAllocation -Fields "ID", "GtResourceLoad" | ForEach-Object {
                @{Id = $_.Id; GtResourceLoad = $_.FieldValues["GtResourceLoad"] }
            }
            
            if ($PreviousValues.length -gt 0) {
                Write-Host "`t`t`t" (ConvertTo-Json $PreviousValues -Compress)
            }
  
            $ResourceAllocationContentType = Get-PnPContentType -Identity "Ressursallokering" -List "Ressursallokering" -ErrorAction SilentlyContinue
            if ($null -ne $ResourceAllocationContentType) {
                Write-Host "`t`t`tRemoving old field"
                $RemovedColumn = Remove-PnPField -Identity $ResourceLoadListColumn -List $ResourceAllocation -Force

                
                Write-Host "`t`t`tAdding the site field"
                $FieldLink = New-Object Microsoft.SharePoint.Client.FieldLinkCreationInformation
                $FieldLink.Field = $ResourceLoadSiteColumn
                $Output = $ResourceAllocationContentType.FieldLinks.Add($FieldLink)
                $ResourceAllocationContentType.Update($false)
                $ResourceAllocationContentType.Context.ExecuteQuery()

                Write-Host "`t`t`tAdding the site field to default view"
                $DefaultView = Get-PnPView -List $ResourceAllocation -Identity "Alle elementer" -ErrorAction SilentlyContinue
                if ($null -ne $DefaultView) {
                    $DefaultView.ViewFields.Add("GtResourceLoad")
                    $DefaultView.Update()
                    $DefaultView.Context.ExecuteQuery()
                }
                
                
                if ($PreviousValues.length -gt 0) {
                    Write-Host "`t`t`tRestoring previous values"
                    $PreviousValues | ForEach-Object {
                        $ResourceLoad = $_.GtResourceLoad

                        if ($ResourceLoad -gt 2 ) {
                            # Assuming that noone had more than 200% previously
                            $ResourceLoad = ($ResourceLoad / 100) # Convert to percentage if it wasn't previously
                        }
                        $NewValue = Set-PnPListItem -List $ResourceAllocation -Identity $_.Id -Values @{"GtResourceLoad" = $ResourceLoad } -SystemUpdate
                    }
                }

                Write-Host "`t`t`tField swap completed" -ForegroundColor Green
            }
        }
        else {
            Write-Host "`t`tThe site already has the correct GtResourceLoad field" -ForegroundColor Green
        }
    }
}

function EnsurePlannerPlan([string]$Url){

    Connect-PnPOnline -Url $_ -UseWebLogin
    $groupId = (Get-PnPSite -Includes GroupId).GroupId.toString()
    $plannerPlan = Get-PnPPlannerPlan -Group $groupId 
    
    Write-Host "Gruppen $_ har plannerPlan: $($null -ne $plannerPlan)"
    
    if ($null -eq $plannerPlan) { 
        New-PnPPlannerPlan -Group $groupId -Title (Get-PnPWeb).Title | Out-Null
        Write-Host "`t Opprettet planner plan for gruppen"
    }

}


function UpgradeSite($Url) {
    if($FixPlannerPlans){
        EnsurePlannerPlan -Url $Url
        
    } else {
        EnsureProjectTimelinePage -Url $Url
        EnsureResourceLoadIsSiteColumn -Url $Url
    }
}

Write-Host "This script will update all existing sites in a Prosjektportalen installation. This requires you to have the SharePoint admin role"

Set-PnPTraceLog -Off
Start-Transcript -Path "$PSScriptRoot\UpgradeSites_Log-$((Get-Date).ToString('yyyy-MM-dd-HH-mm')).txt"

[System.Uri]$Uri = $PortfolioUrl
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")

Connect-PnPOnline -Url $AdminSiteUrl -UseWebLogin -WarningAction Ignore

# Get current logged in user
$ctx = Get-PnPContext
$ctx.Load($ctx.Web.CurrentUser)
$ctx.ExecuteQuery()
$UserName = $ctx.Web.CurrentUser.LoginName

$PPHubSite = Get-PnPHubSite -Identity $PortfolioUrl
$ProjectsInHub = Get-PP365HubSiteChild -Identity $PPHubSite

Write-Host "The following sites were found to be part of the Project Portal hub:"
$ProjectsInHub | ForEach-Object { Write-Host "`t$_" }

Write-Host "We can grant $UserName admin access to existing projects. This will ensure that all project will be upgraded. If you select no, the script will only upgrade the sites you are already an owner of."
do {
    $YesOrNo = Read-Host "Do you want to grant $UserName access to all sites in the hub (listed above)? (y/n)"
} 
while ("y", "n" -notcontains $YesOrNo)

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
while ("y", "n" -notcontains $YesOrNo)

if ($YesOrNo -eq "y") {
    $ProjectsInHub | ForEach-Object {
        Write-Host "`tRemoving access to $_"
        Connect-PnPOnline -Url $_ -UseWebLogin
        Remove-PnPSiteCollectionAdmin -Owners $UserName
    }
}


Stop-Transcript
