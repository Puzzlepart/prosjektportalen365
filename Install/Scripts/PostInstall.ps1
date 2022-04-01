Connect-PnPOnline -Url "https://puzzlepart.sharepoint.com/sites/pp365" -UseWebLogin

$TemplateSetups = Get-PnPListItem -List "Maloppsett"
$TemplateFiles = Get-PnPListItem -List "Prosjektmaler"

$TemplatesMap = @{
    "Standardmal" = "Standardmal.txt";
    "Programmal" = "Programmal.txt";
    "Overordnet mal" = "Overordnet.txt";
}

foreach ($tmpl in $TemplatesMap.GetEnumerator()) {
    $TemplateSetup = $TemplateSetups | Where-Object { $_["Title"] -eq $tmpl.Name }
    $TemplateFileId = $TemplateFiles | Where-Object { $_["FileLeafRef"] -eq $tmpl.Value } | Select-Object -ExpandProperty Id
    if ($null -ne $TemplateFileId -and $null -ne $TemplateSetup) {
        $TemplateSetup["GtProjectTemplate"] = $TemplateFileId
        $TemplateSetup.SystemUpdate()
        $TemplateSetup.Context.ExecuteQuery()
    }
    else {
        Write-Host "[WARNING] Cannot find template $($tmpl.Name) or template file $($tmpl.Value). Ensure template associations manually in Lists/Maloppsett" -ForegroundColor Yellow
    }
}

Write-Host "[SUCCESS] Post-install action: Ensured default project templates"