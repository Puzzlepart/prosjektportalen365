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
    [switch]
    $GrantPermissionsAndDelete
)

$PortfolioAdminGroupName = "Porteføljeadministratorer"

function GetPortfolioadminUsers($HubUrl){
    Write-Host "Looking for portfolio admin users in: $HubUrl" -ForegroundColor Green
    Connect-PnPOnline -Url $HubUrl -TenantAdminUrl $TenantAdminUrl -Interactive
    
    ## Getting security group (Porteføljeadministratorer) and returning its members
    $Group = Get-PnPSiteGroup -Group $PortfolioAdminGroupName
    if($Group -and $Group.Count -gt 0){
        $Members = Get-PnPGroupMember -Group $PortfolioAdminGroupName
        Write-Host "`tFound $($Members.Count) members in $PortfolioAdminGroupName" 
        foreach($Member in $Members){
            Write-Host "`t`t$($Members.Title)" 
        }
        return $Members
    }else{
        Write-Host "Security group ($PortfolioAdminGroupName) does not exist or has 0 members. Exiting script." -ForegroundColor Yellow
    }
    exit 1
}
function GrantPermissions ($Url, $Members) {
    Write-Host "Granting owner permissions to site collection $Url" -ForegroundColor Green
    Set-PnPTenantSite -Url $Url -Owners $CurrentUser
    Connect-PnPOnline -Url $Url -TenantAdminUrl $TenantAdminUrl -Interactive
    
    ## Adding security group (if not created)
    $Group = Get-PnPSiteGroup -Site $Url -Group $PortfolioAdminGroupName
    if($null -eq $Group){
        Write-Host "`tCreating access group: $PortfolioAdminGroupName" -ForegroundColor Green
        New-PnPSiteGroup -Site $Url -Name $PortfolioAdminGroupName -PermissionLevels "Full Control"
    }else{
        Write-Host "`tAccess group $PortfolioAdminGroupName already exists"
    }
    ## Adding security group members
    foreach($Member in $Members){
        $MemberLoginName = $Member.LoginName
        $MemberName = $Member.Title
        $Member = Get-PnPGroupMember -Group $PortfolioAdminGroupName -User $MemberLoginName
        if($null -eq $Member){
            Write-Host "`tAdding member ($MemberName) with email: $MemberLoginName" -ForegroundColor Green
            Add-PnPGroupMember -LoginName $MemberLoginName -Group $PortfolioAdminGroupName
        }else{
            Write-Host "`tMember ($MemberName) with email: $MemberLoginName already exists"
        }
    }
}


if (Get-Module | Where-Object { $_.Name -like "*SharePointPnPPowerShellOnline*" }) {
    Remove-Module -Name SharePointPnPPowerShellOnline -Force
}

if (-not (Get-Module | Where-Object { $_.Name -like "PnP.PowerShell" }) ) {
    Install-Module PnP.PowerShell -Scope CurrentUser
    Import-Module PnP.PowerShell
}

Connect-PnPOnline -TenantAdminUrl $TenantAdminUrl -Url $PortfolioUrl -Interactive
$Children = Get-PnPHubSiteChild
$PortfolioadminUsers = GetPortfolioadminUsers -HubUrl $PortfolioUrl

if ($GrantPermissions) {    
    $Children | ForEach-Object { GrantPermissions -Url $_ -Members $PortfolioadminUsers}
    Write-Host "[x] Done" -ForegroundColor Green
} elseif($GrantPermissionsAndDelete) {
    $Children | ForEach-Object {
        $ChildSiteUrl = $_
        $ChildSiteUrl
        Connect-PnPOnline -Url $ChildSiteUrl -TenantAdminUrl $TenantAdminUrl -Interactive;
        $Group = Get-PnPSiteGroup -Group $PortfolioAdminGroupName
        if($Group -and $Group.Count -gt 0){
            $Members = Get-PnPGroupMember -Group $PortfolioAdminGroupName
            Write-Host "`tFound $($Members.Count) members in $ChildSiteUrl" 
            foreach($Member in $Members){
                Write-Host "`tRemoving $($Member.Title) in $ChildSiteUrl" -ForegroundColor Green
                Remove-PnPGroupMember -LoginName $($Member.LoginName) -Group $PortfolioAdminGroupName
            }
        }
    }
    $Children | ForEach-Object { GrantPermissions -Url $_ -Members $PortfolioadminUsers}
    Write-Host "[x] Done" -ForegroundColor Green
} else {
    Write-Host "Script is missing input switch:" -ForegroundColor Yellow
    Write-Host "`t-GrantPermissions will add all users found in Porteføljeadministratorer with Full Control" 
    Write-Host "`t-GrantPermissionsAndDelete will add all users found in Porteføljeadministratorer with Full Control and delete previously added users that are not found in Porteføljeadministratorer"
}