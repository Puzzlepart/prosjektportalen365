Param(
    [Parameter(Mandatory = $false)]
    [string]$RootSiteUrl,
    [Parameter(Mandatory = $false)]
    [string]$ProjectWebUrl,
    [Parameter(Mandatory = $false)]
    $Credentials,
    [Parameter(Mandatory = $false)]
    [switch]$ConfirmSiteFields,
    [Parameter(Mandatory = $false)]
    [switch]$ConfirmContentTypes,
    [Parameter(Mandatory = $false)]
    [switch]$ConfirmLists,
    [Parameter(Mandatory = $false)]
    [switch]$SkipNavigationNodes,   
    [Parameter(Mandatory = $true)]
    [string]$Folder
)

Try {
    $env_settings = Get-Content .\config\env.json -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
    $RootSiteUrl = $env_settings.RootSiteUrl
    $ProjectWebUrl = $env_settings.ProjectWebUrl
    $Credentials = $env_settings.Credentials
}
Catch {
    exit 0
}

Write-Host "[INFO] Connecting to $RootSiteUrl"
$SiteConnection = Connect-PnPOnline -Url $RootSiteUrl -Credentials $Credentials -ReturnConnection

Write-Host "[INFO] Connecting to $ProjectWebUrl"
$ProjectWebConnection = Connect-PnPOnline -Url $ProjectWebUrl -Credentials $Credentials -ReturnConnection

$SiteFields = Get-PnPField -Connection $SiteConnection | Where-Object { $_.Group -eq "Prosjektportalenkolonner" -and $_.InternalName -notlike "GtChr*" -and $_.InternalName -notlike "GtLcc**" -and $_.InternalName -notlike "GtDp*" -and $_.InternalName -notlike "GtSec*" -and $_.InternalName -notlike "GtPc*" -and $_.InternalName -notlike "GtFeedback*" } | Sort-Object -Property Title
$ContentTypes = Get-PnPContentType -Connection $SiteConnection | Where-Object { $_.Group -eq "Prosjektportalen innholdstyper" } | Sort-Object -Property Id
$Lists = Get-PnPList -Connection $ProjectWebConnection | Where-Object { ($_.BaseTemplate -eq 100 -or $_.BaseTemplate -eq 101 -or $_.BaseTemplate -eq 106 -or $_.BaseTemplate -eq 171) -and $_.RootFolder.ServerRelativeUrl -notlike "*SiteAssets" }
$NavigationNodes = Get-PnPNavigationNode -Location QuickLaunch -Connection $ProjectWebConnection 

$ActionsCount = 0

$index = 10

$CreateSiteScript = "y"
if ($ConfirmSiteFields.IsPresent) {
    $CreateSiteScript = Read-Host "Create site script for site fields? (y/n)"
}
if ($CreateSiteScript.ToLower() -eq "y") {
    $ActionsCount += (.\Build-SiteScript.ps1 -SiteFields $SiteFields -Index $index -SiteConnection $SiteConnection -ProjectWebConnection $ProjectWebConnection -Folder $Folder)
    $index += 10
}

foreach ($ct in $ContentTypes) {
    $CreateSiteScript = "y"
    if ($ConfirmContentTypes.IsPresent) {
        $CreateSiteScript = Read-Host "Create site script for content type $($ct.Name)? (y/n)"
    }
    if ($CreateSiteScript.ToLower() -eq "y") {
        $ActionsCount += (.\Build-SiteScript.ps1 -ContentTypeName $ct.Name -Index $index -SiteConnection $SiteConnection -ProjectWebConnection $ProjectWebConnection -Folder $Folder)
        $index += 10
    }
}

foreach ($lst in $Lists) {
    $CreateSiteScript = "y"
    if ($ConfirmLists.IsPresent) {
        $CreateSiteScript = Read-Host "Create site script for list $($lst.Title)? (y/n)"
    }
    if ($CreateSiteScript.ToLower() -eq "y") {
        $ActionsCount += (.\Build-SiteScript.ps1 -ListName $lst.Title -Index $index -SiteConnection $SiteConnection -ProjectWebConnection $ProjectWebConnection -Folder $Folder)
        $index += 10
    }
}

if (-not $SkipNavigationNodes.IsPresent) {
    $CreateSiteScript = "y"
    if ($ConfirmLists.IsPresent) {
        $CreateSiteScript = Read-Host "Create site script for navigation nodes? (y/n)"
    }
    if ($CreateSiteScript.ToLower() -eq "y") {
        $ActionsCount += (.\Build-SiteScript.ps1 -NavigationNodes $NavigationNodes -Index $index -SiteConnection $SiteConnection -ProjectWebConnection $ProjectWebConnection -Folder $Folder)
        $index += 10
    }
}

Write-Host "ActionsCount: $ActionsCount"
