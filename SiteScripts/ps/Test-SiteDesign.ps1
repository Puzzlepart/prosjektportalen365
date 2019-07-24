Param(
    [Parameter(Mandatory = $false)]
    [string]$RootSiteUrl,
    [Parameter(Mandatory = $false)]
    [string]$Credentials,
    [Parameter(Mandatory = $false)]
    $SiteUrlTemplate = "Prosjektportalen-03-03-{0}",
    [Parameter(Mandatory = $false)]
    $StartIndex = 1,
    [Parameter(Mandatory = $false)]
    $SiteDesignTitle = "Prosjektportalen",
    [Parameter(Mandatory = $false)]
    [switch]$Invoke,
    [Parameter(Mandatory = $false)]
    [string]$AdminSiteUrl,
    [Parameter(Mandatory = $false)]
    [string]$UserName,
    [Parameter(Mandatory = $false)]
    [SecureString]$Password
)

Try {
    $env_settings = Get-Content .\config\env.json -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
    $RootSiteUrl = $env_settings.RootSiteUrl
    $Credentials = $env_settings.Credentials
    $AdminSiteUrl = $env_settings.AdminSiteUrl
    $UserName = $env_settings.UserName
    $Password = ConvertTo-SecureString $env_settings.Password -AsPlainText -Force
}
Catch {
    exit 0
}

Write-Host "[INFO] Connecting to $RootSiteUrl"
$SiteConnection = Connect-PnPOnline -Url $RootSiteUrl -Credentials $Credentials -ReturnConnection

$idx = $StartIndex

$CreatedSiteUrl = $null

while (-not $CreatedSiteUrl) {
    Try {
        $Title = $SiteUrlTemplate -f $idx
        # Write-Host "[VERBOSE] Attempting to create site $Title"
        $CreatedSiteUrl = New-PnPSite -Type TeamSite -Title $Title -Alias $Title -IsPublic:$true -Connection $SiteConnection -ErrorAction Stop 
        Write-Host "[INFO] Successfully created site $CreatedSiteUrl"
        Disconnect-PnPOnline -Connection $SiteConnection
    }
    Catch {
        $idx++
    }
}


Write-Host "[INFO] Connecting to $CreatedSiteUrl"
$CreatedSiteConnection = Connect-PnPOnline -Url $CreatedSiteUrl -Credentials $Credentials -ReturnConnection
Try {
    if ($Invoke.IsPresent) {
        Write-Host "[INFO] Invoking Site Design $SiteDesignTitle using Invoke-PnPSiteDesign"
        Invoke-PnPSiteDesign -Identity $SiteDesignTitle -Connection $CreatedSiteConnection -ErrorAction Stop
    }
    else {
        if (-not [string]::IsNullOrWhiteSpace($AdminSiteUrl)) {
            Write-Host "[INFO] Connecting to $AdminSiteUrl"
            Connect-SPOService -Url $AdminSiteUrl -Credential (New-Object System.Management.Automation.PSCredential $UserName, $Password)
            $SiteDesign = Get-SPOSiteDesign | Where-Object { $_.Title -eq $SiteDesignTitle }
            Write-Host "[INFO] Invoking Site Design $SiteDesignTitle using Add-SPOSiteDesignTask"
            Add-SPOSiteDesignTask -SiteDesignId $SiteDesign.Id.Guid -WebUrl $CreatedSiteUrl
            Start-Process "chrome.exe" $CreatedSiteUrl
        }
    }
}
Catch [Exception] {
    Write-Host $_.Exception.Message
}
Disconnect-PnPOnline -Connection $CreatedSiteConnection
