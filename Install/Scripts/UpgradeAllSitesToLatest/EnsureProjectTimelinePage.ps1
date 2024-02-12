$TargetVersion = "1.8.2"

if ($global:__PreviousVersion -lt $TargetVersion) {
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