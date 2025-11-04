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
    $GrantPermissions,
    [Parameter(Mandatory = $false, HelpMessage = "Client ID of the Entra Id application used for interactive logins. Defaults to the multi-tenant Prosjektportalen app")]
    [string]$ClientId = "da6c31a6-b557-4ac3-9994-7315da06ea3a"
)

$GroupsWhereAdded = [System.Collections.ArrayList]@()

function GrantPermissions ($Url) {
    Write-Host "`tGranting owner permissions to site collection $Url"
    Set-PnPTenantSite -Url $Url -Owners $CurrentUser
    Connect-PnPOnline -Url $Url -TenantAdminUrl $TenantAdminUrl -ClientId $ClientId
    $GroupId = (Get-PnPSite -Includes GroupId -ErrorAction Ignore).GroupId.toString()
    Write-Host "`tGranting owner permissions to group $GroupId"
    Add-PnPMicrosoft365GroupOwner -Identity -Users $CurrentUser
    Add-PnPMicrosoft365GroupMember -Identity -Users $CurrentUser
    $GroupsWhereAdded.Add($GroupId) | out-null
}

function CleanupPermissions {
    $GroupsWhereAdded | ForEach-Object { 
        Write-Host "`tRemoving $CurrentUser from $_" 
        Remove-PnPMicrosoft365GroupOwner -Identity $_ -Users $CurrentUser
        Remove-PnPMicrosoft365GroupMember -Identity $_ -Users $CurrentUser 
    }
}

if (Get-Module | Where-Object { $_.Name -like "*SharePointPnPPowerShellOnline*" }) {
    Remove-Module -Name SharePointPnPPowerShellOnline -Force
}

if (-not (Get-Module | Where-Object { $_.Name -like "PnP.PowerShell" }) ) {
    Install-Module PnP.PowerShell -Scope CurrentUser
    Import-Module PnP.PowerShell
}

Connect-PnPOnline -TenantAdminUrl $TenantAdminUrl -Url $PortfolioUrl -clientId $ClientId

$Children = Get-PnPHubSiteChild

if ($GrantPermissions) {
    Write-Host "Granting permissions to $CurrentUser" -ForegroundColor Green
    $Children | ForEach-Object { GrantPermissions $_ }
    Write-Host "[x] Done" -ForegroundColor Green
}
else {

    $Children | ForEach-Object {
        $ChildSiteUrl = $_
    
        Connect-PnPOnline -Url $ChildSiteUrl -TenantAdminUrl $TenantAdminUrl -clientId $ClientId
        $GroupId = (Get-PnPSite -Includes GroupId -ErrorAction Ignore).GroupId.toString()
        $PlannerPlan = Get-PnPPlannerPlan -Group $GroupId 
        
        
        if ($null -eq $PlannerPlan) { 
            Write-Host "[ ] Gruppen $ChildSiteUrl ($GroupId) har IKKE Planner plan" -ForegroundColor Yellow
            try {
                New-PnPPlannerPlan -Group $GroupId -Title (Get-PnPWeb).Title -ErrorAction SilentlyContinue | out-null
                Write-Host "`t[x] Planner plan opprettet" -ForegroundColor Green
            }
            catch {
                Write-Host "`t[ ] Planner plan ble IKKE opprettet" -ForegroundColor Red
            }

        }
        else {
            Write-Host "[x] Gruppen $ChildSiteUrl ($GroupId) har Planner plan" -ForegroundColor Green
        }
    }
}


