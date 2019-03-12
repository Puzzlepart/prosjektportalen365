Param(
    [Parameter(Mandatory = $false)]
    [string]$Folder = "./src",
    [Parameter(Mandatory = $false)]
    [string]$SortProperty = "Order"
)

$SiteScriptInfo = @()
$SiteScripts = Get-ChildItem "$($Folder)/*.txt"
$SiteScriptIds = @()
$TotalActionsCount = 0

foreach ($s in $SiteScripts) {
    $ActionsCount = 0
    $Content = (Get-Content -Path $s.FullName -Raw | Out-String)
    $ContentJson = ConvertFrom-Json $Content
    foreach ($action in $ContentJson.actions) {
        $ActionsCount++
        $ActionsCount += $action.subactions.length
    }    
    $TotalActionsCount += $ActionsCount
    $SiteScriptInfo +=  new-object psobject -property @{
        Filename = $s.BaseName;
        Order = [int]$s.BaseName.Substring(0,7);
        Title =  $s.BaseName.Substring(9);
        ActionsCount = $ActionsCount;
    }
}

$SiteScriptInfo | Sort-Object -property $SortProperty | Format-Table

.\ConvertTo-Markdown.ps1 -collection $SiteScriptInfo