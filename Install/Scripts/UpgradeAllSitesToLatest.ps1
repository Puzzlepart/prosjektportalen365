Param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [Parameter(Mandatory = $false, HelpMessage = "Used by Continuous Integration")]
    [string]$CI
)


$CI_MODE = (-not ([string]::IsNullOrEmpty($CI)))

$global:__InstalledVersion = $null
$global:__PnPConnection = $null

$ScriptDir = (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)

if ($CI_MODE) {
    Write-Host "[Running in CI mode. Installing module PnP.PowerShell.]" -ForegroundColor Yellow
    Install-Module -Name PnP.PowerShell -Force -Scope CurrentUser -ErrorAction Stop
}

function Connect-SharePoint {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    Try {
        if ($CI_MODE) {
            $DecodedCred = ([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($CI))).Split("|")
            $Password = ConvertTo-SecureString -String $DecodedCred[1] -AsPlainText -Force
            $Credentials = New-Object -TypeName System.Management.Automation.PSCredential -ArgumentList $DecodedCred[0], $Password
            Connect-PnPOnline -Url $Url -Credentials $Credentials -ErrorAction Stop  -WarningAction Ignore
        }
        else {
            if ($null -ne $global:__PnPConnection.ClientId) {
                Connect-PnPOnline -Url $Url -Interactive -ClientId $global:__PnPConnection.ClientId -ErrorAction Stop -WarningAction Ignore
            }
            Connect-PnPOnline -Url $Url -Interactive -ErrorAction Stop -WarningAction Ignore
            $global:__PnPConnection = Get-PnPConnection
        }
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
            Add-PnPPageWebPart -Page "Prosjekttidslinje" -Component "Prosjekttidslinje" -WebPartProperties '{"listName":"Tidslinjeinnhold","showTimeline":true,"showTimelineListCommands":true,"showTimelineList":true,"showProjectDeliveries":false,"projectDeliveriesListName":"Prosjektleveranser","configItemTitle":"Prosjektleveranse"}' >$null 2>&1
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
    if ($global:__InstalledVersion -lt "1.7.2") {
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
}

function EnsureProgramAggregrationWebPart() {
    $BaseDir = "$ScriptDir/EnsureProgramAggregrationWebPart"
    $Pages = Get-Content "$BaseDir/$.json" -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($Page in $Pages.PSObject.Properties.GetEnumerator()) {
        $DeprecatedComponent = Get-PnPPageComponent -Page "$($Page.Name).aspx" -ErrorAction SilentlyContinue | Where-Object { $_.WebPartId -eq $Page.Value } | Select-Object -First 1
        if ($null -ne $DeprecatedComponent) {
            Write-Host "`t`tReplacing deprecated component $($Page.Value) for $($Page.Name).aspx"
            $JsonControlData = Get-Content "$BaseDir/JsonControlData_$($Page.Name).json" -Raw -Encoding UTF8
            $Title = $JsonControlData | ConvertFrom-Json | Select-Object -ExpandProperty title
            Invoke-PnPSiteTemplate -Path "$BaseDir/Template_ProgramAggregationWebPart.xml" -Parameters @{"JsonControlData" = $JsonControlData; "PageName" = "$($Page.Name).aspx"; "Title" = $Title }
        }
    }
}

function EnsureProjectAggregrationWebPart() {
    $BaseDir = "$ScriptDir/EnsureProjectAggregrationWebPart"
    $Pages = Get-Content "$BaseDir/$.json" -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($Page in $Pages.PSObject.Properties.GetEnumerator()) {
        $DeprecatedComponent = Get-PnPPageComponent -Page "$($Page.Name).aspx" -ErrorAction SilentlyContinue | Where-Object { $_.WebPartId -eq $Page.Value } | Select-Object -First 1
        if ($null -ne $DeprecatedComponent) {
            Write-Host "`t`tReplacing deprecated component $($Page.Value) for $($Page.Name).aspx"
            $JsonControlData = Get-Content "$BaseDir/JsonControlData_$($Page.Name).json" -Raw -Encoding UTF8
            $Title = $JsonControlData | ConvertFrom-Json | Select-Object -ExpandProperty title
            Invoke-PnPSiteTemplate -Path "$BaseDir/Template_ProjectAggregationWebPart.xml" -Parameters @{"JsonControlData" = $JsonControlData; "PageName" = "$($Page.Name).aspx"; "Title" = $Title }
        }
    }
}

function EnsureHelpContentExtension() {
    $ClientSideComponentId = "28987406-2a67-48a8-9297-fd2833bf0a09"
    if ($null -eq (Get-PnPCustomAction | Where-Object { $_.ClientSideComponentId -eq $ClientSideComponentId })) {
        Write-Host "`t`tAdding help content extension to site"
        Add-PnPCustomAction -Title "Hjelpeinnhold" -Name "Hjelpeinnhold" -Location "ClientSideExtension.ApplicationCustomizer" -ClientSideComponentId $ClientSideComponentId -ClientSideComponentProperties "{`"listName`":`"Hjelpeinnhold`",`"linkText`":`"Hjelp tilgjengelig`"}"  >$null 2>&1
    }
    else {
        Write-Host "`t`tThe site already has the help content extension" -ForegroundColor Green
    }
}

function EnsureGtTagSiteColumn() {
    if ($global:__InstalledVersion -lt "1.8.0") {
        $ProjectDeliveries = Get-PnPList -Identity "Prosjektleveranser" -ErrorAction SilentlyContinue
        if ($null -ne $ProjectDeliveries) {
            $GtTagSiteColumn = Get-PnPField -Identity "GtTag" -ErrorAction SilentlyContinue
            if ($null -eq $GtTagSiteColumn) {
                Write-Host "`t`t`tAdding GtTag field"
                $SiteColumnXml = '<Field ID="{4d342fb6-a0e0-4064-b794-c1d36c922997}" DisplayName="Etikett" Name="GtTag" Type="Choice" Group="Kolonner for Prosjektportalen (Prosjekt)" Description="Hvilken etikett ønsker du å sette på tidslinje elementet" Format="RadioButtons" FillInChoice="FALSE" StaticName="GtTag"><Default></Default><CHOICES><CHOICE>Overordnet</CHOICE><CHOICE>Underordnet</CHOICE><CHOICE>Test</CHOICE></CHOICES></Field>'
                $SiteColumn = Add-PnPFieldFromXml -FieldXml $SiteColumnXml
                $SiteColumn = Get-PnPField -Identity $SiteColumn.Id
    
                $ProjectDeliveriesContentType = Get-PnPContentType -Identity "Prosjektleveranse" -List "Prosjektleveranser" -ErrorAction SilentlyContinue
                if ($null -ne $ProjectDeliveriesContentType) {
                    Write-Host "`t`t`tAdding GtTag field to contenttype"
                    Add-PnPFieldToContentType -Field "GtTag" -ContentType "Prosjektleveranse" -Hidden -ErrorAction SilentlyContinue
                }
            }
            else {
                Write-Host "`t`tThe site already has the GtTag field" -ForegroundColor Green
            }
        }
    }
}

function UpgradeSite($Url) {
    Connect-SharePoint -Url $Url
    EnsureProjectTimelinePage
    EnsureResourceLoadIsSiteColumn
    EnsureProgramAggregrationWebPart
    EnsureProjectAggregrationWebPart
    EnsureHelpContentExtension
    EnsureGtTagSiteColumn
}

Write-Host "This script will update all existing sites in a Prosjektportalen installation. This requires you to have the SharePoint admin role"

Set-PnPTraceLog -Off
Start-Transcript -Path "$PSScriptRoot/UpgradeSites_Log-$((Get-Date).ToString('yyyy-MM-dd-HH-mm')).txt"

Connect-SharePoint -Url $Url
$global:__InstalledVersion = (Get-PnPListItem -List "Installasjonslogg" -Query "<View><Query><OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy></Query></View>" | Select-Object -First 1).FieldValues["InstallVersion"] 

[System.Uri]$Uri = $Url
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")

Connect-SharePoint -Url $AdminSiteUrl

# Get current logged in user
$Context = Get-PnPContext
$Context.Load($Context.Web.CurrentUser)
$Context.ExecuteQuery()
$UserName = $Context.Web.CurrentUser.LoginName

Write-Host "Retrieving all sites of the Project Portal hub..."
$ProjectsHub = Get-PnPTenantSite -Identity $Url
$ProjectsInHub = Get-PnPTenantSite | Where-Object { $_.HubSiteId -eq $ProjectsHub.HubSiteId -and $_.Url -ne $ProjectsHub.Url } | ForEach-Object { return $_.Url }

Write-Host "The following sites were found to be part of the Project Portal hub:"
$ProjectsInHub | ForEach-Object { Write-Host "`t$_" }

if (-not $CI_MODE) {
    Write-Host "We can grant $UserName admin access to existing projects. This will ensure that all project will be upgraded. If you select no, the script will only upgrade the sites you are already an owner of."
    do {
        $YesOrNo = Read-Host "Do you want to grant $UserName access to all sites in the hub (listed above)? (y/n)"
    } 
    while ("y", "n" -notcontains $YesOrNo)
}

if ($YesOrNo -eq "y" -or $CI_MODE) {
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

if (-not $CI_MODE) {
    Write-Host "We can remove $UserName's admin access from existing projects."
    do {
        $YesOrNo = Read-Host "Do you want to remove $UserName's admin access from all sites in the hub? (y/n)"
    } 
    while ("y", "n" -notcontains $YesOrNo)
}

if ($YesOrNo -eq "y" -or $CI_MODE) {
    $ProjectsInHub | ForEach-Object {
        Write-Host "`tRemoving access to $_"
        Connect-SharePoint -Url $_
        Remove-PnPSiteCollectionAdmin -Owners $UserName
    }
}


Stop-Transcript
$global:__PnPConnection = $null