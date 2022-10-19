[CmdletBinding()]
param (
    [Parameter( Mandatory = $true, Position = 0 )]
    [string]
    $PortfolioUrl,
    [Parameter( Mandatory = $true, Position = 1 )]
    [string]
    $TenantAdminUrl,
    [Parameter( Mandatory = $true, Position = 2 )]
    [string]
    $CurrentUser,
    [Parameter( Mandatory = $false, Position = 3 )]
    [switch]
    $GrantPermissions
)

$groupsWhereAdded = [System.Collections.ArrayList]@()
function GrantPermissions ($Url) {
    Write-Host "`tGranting owner permissions to site collection $Url"
    Set-PnPTenantSite -Url $Url -Owners $CurrentUser
    Connect-PnPOnline -Url $Url -TenantAdminUrl $TenantAdminUrl -Interactive
    $groupId = (Get-PnPSite -Includes GroupId -ErrorAction Ignore).GroupId.toString()
    Write-Host "`tGranting owner permissions to group $groupId"
    Set-PnPMicrosoft365Group -Identity $groupId -Owners $CurrentUser -Members $CurrentUser
    $groupsWhereAdded.Add($groupId) | out-null
}

function CleanupPermissions {
    $groupsWhereAdded | ForEach-Object { Write-Host "`tRemoving $CurrentUser from $_"; Remove-PnPMicrosoft365GroupOwner -Identity $_ -Users $CurrentUser }
}


if(Get-Module | Where-Object{$_.Name -like "*SharePointPnPPowerShellOnline*"}){
    Remove-Module -Name SharePointPnPPowerShellOnline -Force
}

if (-not (Get-Module | Where-Object{$_.Name -like "PnP.PowerShell"}) ) {
    Install-Module PnP.PowerShell -Scope CurrentUser
    Import-Module PnP.PowerShell
}



Connect-PnPOnline -TenantAdminUrl $TenantAdminUrl -Url $PortfolioUrl -Interactive

$children = Get-PnPHubSiteChild

if($GrantPermissions) {
    Write-Host "Granting permissions to $CurrentUser" -ForegroundColor Green
    $children | ForEach-Object { GrantPermissions $_ }
    Write-Host "[x] Done" -ForegroundColor Green
} else {

    $children | ForEach-Object {
        $childSiteUrl = $_
    
        Connect-PnPOnline -Url $childSiteUrl -TenantAdminUrl $TenantAdminUrl -Interactive;
        $groupId = (Get-PnPSite -Includes GroupId -ErrorAction Ignore).GroupId.toString()
      
        $plannerPlan = Get-PnPPlannerPlan -Group $groupId 
        
        
        if ($null -eq $plannerPlan) { 
             Write-Host "[ ] Gruppen $childSiteUrl ($groupId) har IKKE Planner plan" -ForegroundColor Yellow
             try {
                New-PnPPlannerPlan -Group $groupId -Title (Get-PnPWeb).Title -ErrorAction SilentlyContinue | out-null
                Write-Host "`t[x] Planner plan opprettet" -ForegroundColor Green
             }
             catch {
                Write-Host "`t[ ] Planner plan ble IKKE opprettet" -ForegroundColor Red
             }

        } else {
            Write-Host "[x] Gruppen $childSiteUrl ($groupId) har plannerPlan" -ForegroundColor Green
        }
    }
}


