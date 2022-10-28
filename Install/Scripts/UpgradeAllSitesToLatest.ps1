Param(
    [Parameter(Mandatory = $true)]
    [string]$Url
)

$global:__PnPConnection = $null

$ScriptDir = (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)
. $ScriptDir/PP365Functions.ps1

function Connect-SharePoint {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    Try {
        if ($null -ne $global:__PnPConnection.ClientId) {
            Connect-PnPOnline -Url $Url -Interactive -ClientId $global:__PnPConnection.ClientId -ErrorAction Stop -WarningAction Ignore
        }
        Connect-PnPOnline -Url $Url -Interactive -ErrorAction Stop -WarningAction Ignore
        $global:__PnPConnection = Get-PnPConnection
    }
    Catch {
        Write-Host "[INFO] Failed to connect to [$Url]: $($_.Exception.Message)"
        throw $_.Exception.Message
    }
}

function EnsureProjectTimelinePage() {
    $ExistingNodes = Get-PnPNavigationNode -Location QuickLaunch -ErrorAction SilentlyContinue
    if ($null -eq $ExistingNodes) {
        Write-Host "`t`tCannot connect to site. Do you have access?" -ForegroundColor Red
    }
    else {
        $ExistingNode = $ExistingNodes | Where-Object { $_.Title -eq "Prosjekttidslinje" -or $_.Title -eq "Programtidslinje" } -ErrorAction SilentlyContinue
        if ($null -eq $ExistingNode) {
            Write-Host "`t`tAdding project timeline to site"
            Write-Host "`t`t`tAdding project timeline page"
            Add-PnPPage -Name "Prosjekttidslinje.aspx" -PromoteAs None -LayoutType SingleWebPartAppPage -CommentsEnabled:$false -Publish >$null 2>&1
            Write-Host "`t`t`tAdding project timeline app"
            Add-PnPPageWebPart -Page "Prosjekttidslinje" -Component "Prosjekttidslinje" -WebPartProperties '{"listName":"Tidslinjeinnhold","showFilterButton":true,"showTimeline":true,"showInfoMessage":true,"showCmdTimelineList":true,"showTimelineList":true,"title":"Prosjekttidslinje"}' >$null 2>&1
            Set-PnPClientSidePage -Identity "Prosjekttidslinje" -LayoutType SingleWebPartAppPage -HeaderType None -Publish >$null 2>&1
            Write-Host "`t`t`tAdding project timeline navigation item"
            Add-PnPNavigationNode -Location QuickLaunch -Title "Prosjekttidslinje" -Url "SitePages/Prosjekttidslinje.aspx" >$null 2>&1
        }
        else {        
            Write-Host "`t`tThe site already has the project timeline page" -ForegroundColor Green
        }

    }
}

function EnsureResourceLoadIsSiteColumn() {
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
                Remove-PnPField -Identity $ResourceLoadListColumn -List $ResourceAllocation -Force >$null 2>&1

                
                Write-Host "`t`t`tAdding the site field"
                $FieldLink = New-Object Microsoft.SharePoint.Client.FieldLinkCreationInformation
                $FieldLink.Field = $ResourceLoadSiteColumn
                $ResourceAllocationContentType.FieldLinks.Add($FieldLink) >$null 2>&1
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
                        Set-PnPListItem -List $ResourceAllocation -Identity $_.Id -Values @{"GtResourceLoad" = $ResourceLoad } -UpdateType SystemUpdate >$null 2>&1
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

function EnsureProgramAggregrationWebPart() {
    $Pages = Get-Content "./EnsureProgramAggregrationWebPart/$.json" -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($Page in $Pages.PSObject.Properties.GetEnumerator()) {
        $DeprecatedComponent = Get-PnPPageComponent -Page "$($Page.Name).aspx" -ErrorAction SilentlyContinue | Where-Object { $_.WebPartId -eq $Page.Value } | Select-Object -First 1
        if ($null -ne $DeprecatedComponent) {
            Write-Host "`t`tReplacing deprecated component $($Page.Value) for $($Page.Name).aspx"
            $JsonControlData = Get-Content "./EnsureProgramAggregrationWebPart/JsonControlData_$($Page.Name).json" -Raw -Encoding UTF8
            $Title = $JsonControlData | ConvertFrom-Json | Select-Object -ExpandProperty title
            Invoke-PnPSiteTemplate -Path ./EnsureProgramAggregrationWebPart/Template_ProgramAggregationWebPart.xml -Parameters @{"JsonControlData" = $JsonControlData; "PageName" = "$($Page.Name).aspx"; "Title" = $Title }
        }
    }
}

function EnsureHelpContentExtension() {
    $ClientSideComponentId = "28987406-2a67-48a8-9297-fd2833bf0a09"
    if($null -eq (Get-PnPCustomAction | Where-Object { $_.ClientSideComponentId -eq $ClientSideComponentId })) {
        Write-Host "`t`tAdding help content extension"
        #Add-PnPCustomAction -Title "Hjelpeinnhold" -Name "Hjelpeinnhold" -Location "ClientSideExtension.ApplicationCustomizer" -ClientSideComponentId $ClientSideComponentId -ClientSideComponentProperties "{`"listName`":`"Hjelpeinnhold`",`"linkText`":`"Hjelp tilgjengelig`"}"
    }
}

function UpgradeSite($Url) {
    Connect-SharePoint -Url $Url
    EnsureProjectTimelinePage
    EnsureResourceLoadIsSiteColumn
    EnsureProgramAggregrationWebPart
    EnsureHelpContentExtension
}

Write-Host "This script will update all existing sites in a Prosjektportalen installation. This requires you to have the SharePoint admin role"

Set-PnPTraceLog -Off
Start-Transcript -Path "$PSScriptRoot/UpgradeSites_Log-$((Get-Date).ToString('yyyy-MM-dd-HH-mm')).txt"

[System.Uri]$Uri = $Url
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")

Connect-SharePoint -Url $AdminSiteUrl

# Get current logged in user
$Context = Get-PnPContext
$Context.Load($Context.Web.CurrentUser)
$Context.ExecuteQuery()
$UserName = $Context.Web.CurrentUser.LoginName

$PPHubSite = Get-PnPHubSite -Identity $Url
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
        Connect-SharePoint -Url $_
        Remove-PnPSiteCollectionAdmin -Owners $UserName
    }
}


Stop-Transcript
$global:PnPConnection = $null
