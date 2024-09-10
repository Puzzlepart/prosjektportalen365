[CmdletBinding()]
param (
    [Parameter( Mandatory = $true, Position = 0 )]
    [string]
    $PortfolioUrl,
    [Parameter( Mandatory = $false, Position = 1 )]
    [switch]
    $GrantPermissions,
    [Parameter( Mandatory = $false, Position = 2 )]
    [switch]
    $GrantPermissionsAndDelete,
    [Parameter(Mandatory = $false, HelpMessage = "Client ID of the Entra Id application used for interactive logins. Defaults to the multi-tenant Prosjektportalen app")]
    [string]$ClientId = "da6c31a6-b557-4ac3-9994-7315da06ea3a"
)

$PortfolioAdminGroupName = "Porteføljeadministratorer"
$PortfolioUri = [System.Uri]$PortfolioUrl
$TenantAdminUrl = (@($PortfolioUri.Scheme, "://", $PortfolioUri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")

function GetPortfolioadminUsers($HubUrl){
    Write-Host "Looking for portfolio admin users in: $HubUrl (using TenantAdminUrl: $TenantAdminUrl)" -ForegroundColor DarkGreen
    Connect-PnPOnline -Url $HubUrl -TenantAdminUrl $TenantAdminUrl -Interactive -ClientId $ClientId
    
    ## Getting security group (Porteføljeadministratorer) and returning its members
    $Group = Get-PnPSiteGroup -Group $PortfolioAdminGroupName
    if($Group -and $Group.Count -gt 0){
        $Members = Get-PnPGroupMember -Group $PortfolioAdminGroupName
        Write-Host "`tFound $($Members.Count) members in $PortfolioAdminGroupName" 
        foreach($Member in $Members){
            Write-Host "`t`t$($Member.Title)" 
        }
        return $Members
    }else{
        Write-Host "Security group ($PortfolioAdminGroupName) does not exist or has 0 members. Exiting script." -ForegroundColor Yellow
    }
    exit 1
}
function GrantPermissions ($Url, $Members) {
    $CurrentUser = Get-PnPProperty -Property CurrentUser -ClientObject (Get-PnPContext).Web
    Write-Host "Granting owner permissions to site collection $Url for current user $($CurrentUser.Email)" -ForegroundColor DarkGreen
    Set-PnPTenantSite -Url $Url -Owners $CurrentUser.Email
    Connect-PnPOnline -Url $Url -TenantAdminUrl $TenantAdminUrl -Interactive -clientId $ClientId
    
    ## Adding security group (if not created)
    $Group = Get-PnPSiteGroup -Site $Url -Group $PortfolioAdminGroupName -ErrorAction SilentlyContinue
    if($null -eq $Group){
        New-PnPSiteGroup -Site $Url -Name $PortfolioAdminGroupName -PermissionLevels "Full Control"
        Write-Host "`tCreated access group: $PortfolioAdminGroupName" -ForegroundColor Green
    }else{
        Set-PnPSiteGroup -Site $Url -Identity $PortfolioAdminGroupName -PermissionLevelsToAdd "Full Control" | Out-Null
        Write-Host "`tAccess group $PortfolioAdminGroupName already exists"
    }
    ## Adding security group members
    foreach($Member in $Members){
        $MemberLoginName = $Member.LoginName
        $MemberName = $Member.Title
        $Member = Get-PnPGroupMember -Group $PortfolioAdminGroupName -User $MemberLoginName
        if($null -eq $Member){
            Add-PnPGroupMember -LoginName $MemberLoginName -Group $PortfolioAdminGroupName
            Write-Host "`tAdded member ($MemberName) with email: $MemberLoginName" -ForegroundColor Green
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

Connect-PnPOnline -TenantAdminUrl $TenantAdminUrl -Url $PortfolioUrl -Interactive -ClientId $ClientId
try{
    $Children = Get-PnPHubSiteChild
}catch{
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
$PortfolioadminUsers = GetPortfolioadminUsers -HubUrl $PortfolioUrl

if($PortfolioadminUsers.Count -eq 0){
    Write-Host "`tNo users added to $PortfolioAdminGroupName on hub site $PortfolioUrl. Exiting script."
    Write-Host "[x] Done" -ForegroundColor Green
    exit 1
}

if ($GrantPermissions) {    
    $Children | ForEach-Object { GrantPermissions -Url $_ -Members $PortfolioadminUsers}
    Write-Host "[x] Done" -ForegroundColor Green
} elseif($GrantPermissionsAndDelete) {
    $Children | ForEach-Object {
        $ChildSiteUrl = $_
        Connect-PnPOnline -Url $ChildSiteUrl -TenantAdminUrl $TenantAdminUrl -Interactive -ClientId $ClientId
        $Group = Get-PnPSiteGroup -Group $PortfolioAdminGroupName
        if($Group -and $Group.Count -gt 0){
            $Members = Get-PnPGroupMember -Group $PortfolioAdminGroupName
            Write-Host "Removing $($Members.Count) $PortfolioAdminGroupName members in $ChildSiteUrl" -ForegroundColor DarkGreen 
            foreach($Member in $Members){
                Remove-PnPGroupMember -LoginName $($Member.LoginName) -Group $PortfolioAdminGroupName
                Write-Host "`tRemoved $($Member.Title) in $ChildSiteUrl" -ForegroundColor Green
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