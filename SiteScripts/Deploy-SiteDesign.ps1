Param(    
    [Parameter(Mandatory = $false)]
    [string]$RootSiteUrl,
    [Parameter(Mandatory = $false)]
    [string]$Credentials,
    [Parameter(Mandatory = $true)]
    $Name,
    [Parameter(Mandatory = $false)]
    $Description = "Prosjektportalen 3.0",
    [Parameter(Mandatory = $false)]
    $Folder,
    [Parameter(Mandatory = $false)]
    [int]$First = 300
)

Try {
    $env_settings = Get-Content .\config\env.json -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
    $RootSiteUrl = $env_settings.RootSiteUrl
    $Credentials = $env_settings.Credentials
}
Catch {
    exit 0
}


Write-Host "[INFO] Connecting to $RootSiteUrl"
$SiteConnection = Connect-PnPOnline -Url $RootSiteUrl -Credentials $Credentials -ReturnConnection


# $SiteScripts = Get-PnPSiteScript -Connection $SiteConnection | Remove-PnPSiteScript -Connection $SiteConnection -Force
$SiteScripts = Get-PnPSiteScript -Connection $SiteConnection
$SiteScriptSrc = Get-ChildItem "$($Folder)/*.txt" | Select-Object -First $First
$SiteScriptIds = @()
$TotalActionsCount = 0

foreach ($s in $SiteScriptSrc) {
    $ActionsCount = 0
    $Title = $s.BaseName.Substring(9)
    $Content = (Get-Content -Path $s.FullName -Raw | Out-String)
    $ContentJson = ConvertFrom-Json $Content
    foreach ($action in $ContentJson.actions) {
        $ActionsCount++
        $ActionsCount += $action.subactions.length
    }    
    $SiteScript = $SiteScripts | Where-Object { $_.Title -eq $Title }
    if ($null -ne $SiteScript) {
        Write-Host "[INFO] Updating existing site script [$Title] with [$ActionsCount] actions from file [$($s.Name)]"
        Set-PnPSiteScript -Identity $SiteScript -Content $Content -Connection $SiteConnection  >$null 2>&1
    }
    else {
        Write-Host "[INFO] Adding site script [$Title] with [$ActionsCount] actions from file [$($s.Name)]"
        $SiteScript = Add-PnPSiteScript -Title $Title -Content $Content -Connection $SiteConnection
    }
    $SiteScriptIds += $SiteScript.Id.Guid
    $TotalActionsCount += $ActionsCount
}

$SiteDesign = Get-PnPSiteDesign -Identity $Name

if ($null -ne $SiteDesign) {
    Write-Host "[INFO] Updating existing site design [$Name] with [$TotalActionsCount] actions"
    $Version = $SiteDesign.Version
    $Version++
    $SiteDesign = Set-PnPSiteDesign -Identity $SiteDesign -SiteScriptIds $SiteScriptIds -Description $Description -Version $Version -Connection $SiteConnection
}
else {
    Write-Host "[INFO] Creating new site design [$Name] with [$TotalActionsCount] actions"
    $SiteDesign = Add-PnPSiteDesign -Title $Name -SiteScriptIds $SiteScriptIds -Description $Description -WebTemplate TeamSite -Connection $SiteConnection
}