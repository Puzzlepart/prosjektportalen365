[CmdletBinding()]
param (
    [Parameter( Mandatory = $false, Position = 0 )]
    [string]
    $PortfolioUrl,
    [Parameter( Mandatory = $false, Position = 1 )]
    [string]
    $TenantAdminUrl,
    [Parameter( Mandatory = $false, Position = 2 )]
    [string]
    $CurrentUser
)

$DemoSite1Url = "https://prosjektportalen.sharepoint.com/sites/Bibliotekslftet2023/"
Connect-PnPOnline -Url $DemoSite1Url -Interactive
$GroupId = (Get-PnPSite -Includes GroupId -ErrorAction Ignore).GroupId.toString()
$PlannerPlan = Get-PnPPlannerPlan -Group $GroupId 

if ($null -eq $PlannerPlan) { 
    try {
        New-PnPPlannerPlan -Group $GroupId -Title (Get-PnPWeb).Title -ErrorAction SilentlyContinue | out-null
        Write-Host "Planner plan opprettet" -ForegroundColor Green
    }
    catch {
        Write-Host "Planner plan ble IKKE opprettet" -ForegroundColor Red
    }

}