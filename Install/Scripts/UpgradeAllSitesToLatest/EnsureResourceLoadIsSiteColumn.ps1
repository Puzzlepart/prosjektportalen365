$TargetVersion = "1.7.2"

if ($global:__InstalledVersion -lt $TargetVersion) {
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