Param(
    [Parameter(Mandatory = $true, HelpMessage = "N/A")]
    [string]$AppCatalogUrl,
    [Parameter(Mandatory = $true, HelpMessage = "N/A")]
    [string]$Title,
    [Parameter(Mandatory = $true, HelpMessage = "N/A")]
    [string]$Alias,
    [Parameter(Mandatory = $true, HelpMessage = "Stored credential from Windows Credential Manager")]
    [string]$GenericCredential,
    [Parameter(Mandatory = $true, HelpMessage = "Application Id")]
    [string]$AppId,
    [Parameter(Mandatory = $true, HelpMessage = "Application Secret")]
    [string]$AppSecret,
    [Parameter(Mandatory = $false, HelpMessage = "Skip PnP template")]
    [switch]$SkipTemplate,
    [Parameter(Mandatory = $false, HelpMessage = "Skip Site Design")]
    [switch]$SkipSiteDesign,
    [Parameter(Mandatory = $false, HelpMessage = "Skip app packages")]
    [switch]$SkipAppPackages,
    [Parameter(Mandatory = $false, HelpMessage = "Skip site creation")]
    [switch]$SkipSiteCreation
    
)


function Connect-SharePoint {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Url,
        [Parameter(Mandatory = $false)]
        [switch]$App
    )

    $Connection = $null
    Try {
        if ($GenericCredential -and -not $App.IsPresent) {
            Write-Host "[INFO] Connecting to [$Url] using Windows Credentials Manager"
            $Connection = Connect-PnPOnline -Url $Url -Credentials $GenericCredential -ReturnConnection -ErrorAction Stop
        }
        elseif (-not [string]::IsNullOrEmpty($AppId) -and -not [string]::IsNullOrEmpty($AppSecret)) {
            Write-Host "[INFO] Connecting to [$Url] using App-Only"
            $Connection = Connect-PnPOnline -Url $Url -AppId $AppId -AppSecret $AppSecret -ReturnConnection -ErrorAction Stop
        }
    }
    Catch {
    
    }
    return $Connection
}

[System.Uri]$AppCatalogUri = $AppCatalogUrl
$AdminSiteUrl = (@($AppCatalogUri.Scheme, "://", $AppCatalogUri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")
$PortfolioSiteUrl = @($AppCatalogUri.Scheme, "://", $AppCatalogUri.Authority, "/sites/", $Alias) -join ""
$AppCatalogSiteConnection = $null
$AdminSiteConnection = $null
$PortfolioSiteConnection = $null

Try {
    $AppCatalogSiteConnection = Connect-SharePoint -Url $AppCatalogUrl -ErrorAction Stop
}
Catch {
    Write-Host "[INFO] Failed to connect to [$AppCatalogUrl]: $($_.Exception.Message)"
    exit 0
}

Try {
    $AdminSiteConnection = Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
}
Catch {
    Write-Host "[INFO] Failed to connect to [$AdminSiteUrl]: $($_.Exception.Message)"
    exit 0
}

if(-not $SkipSiteCreation.IsPresent) {
    Try {
        $PortfolioSite = Get-PnPTenantSite -Url $PortfolioSiteUrl -Connection $AdminSiteConnection -ErrorAction SilentlyContinue
        if ($null -eq $PortfolioSite) {
            Write-Host "[INFO] Creating portfolio site at [$PortfolioSiteUrl]"
            $PortfolioSiteUrl = New-PnPSite -Type TeamSite  -Title $Title -Alias $Alias -IsPublic:$true -ErrorAction Stop -Connection $AppCatalogSiteConnection -Lcid 1044
            Write-Host "[INFO] Portfolio site created at [$PortfolioSiteUrl]" -ForegroundColor Green
        }
        Register-PnPHubSite -Site $PortfolioSiteUrl -ErrorAction SilentlyContinue -Connection $AdminSiteConnection 
        Write-Host "[INFO] Portfolio site [$PortfolioSiteUrl] promoted to hub site" -ForegroundColor Green
    }
    Catch {
        Write-Host "[INFO] Failed to create site and promote to hub site: $($_.Exception.Message)"
        exit 0
    }
}

Try {
    $PortfolioSiteConnection = Connect-SharePoint -Url $PortfolioSiteUrl -App -ErrorAction Stop
}
Catch {
    Write-Host "[INFO] Failed to connect to [$PortfolioSiteUrl]: $($_.Exception.Message)"
    exit 0
}

if(-not $SkipTemplate.IsPresent) {
    Try {
        Set-PnPTraceLog -Level Debug -On
        Write-Host "[INFO] Applying PnP template [Portal] to [$PortfolioSiteUrl]"
        Apply-PnPProvisioningTemplate ..\Templates\Portal\Portal.xml -Connection $PortfolioSiteConnection -ErrorAction Stop
    }
    Catch {
        Write-Host "[INFO] Failed to apply PnP template [Portal] to [$PortfolioSiteUrl]: $($_.Exception.Message)"
        exit 0
    }
    Set-PnPTraceLog -Off
}


if(-not $SkipSiteDesign.IsPresent) {
    $SiteScriptIds = @()

    Try {
        Write-Host "[INFO] Installing site scripts"
        $SiteScripts = Get-PnPSiteScript -Connection $AdminSiteConnection
        $SiteScriptSrc = Get-ChildItem "../SiteScripts/Src/*.txt"
        foreach ($s in $SiteScriptSrc) {
            $Title = $s.BaseName.Substring(9)
            $Content = (Get-Content -Path $s.FullName -Raw | Out-String)
            $SiteScript = $SiteScripts | Where-Object { $_.Title -eq $Title }
            if ($null -ne $SiteScript) {
                Set-PnPSiteScript -Identity $SiteScript -Content $Content -Connection $AdminSiteConnection  >$null 2>&1
            }
            else {
                $SiteScript = Add-PnPSiteScript -Title $Title -Content $Content -Connection $AdminSiteConnection
            }
            $SiteScriptIds += $SiteScript.Id.Guid
        }
    }
    Catch {
        Write-Host "[INFO] Failed to install site scripts: $($_.Exception.Message)"
        exit 0
    }

    Try {
        Write-Host "[INFO] Installing site design"
    
        $SiteDesign = Get-PnPSiteDesign -Identity "Prosjektportalen" -Connection $AdminSiteConnection

        if ($null -ne $SiteDesign) {
            Write-Host "[INFO] Updating existing site design [Prosjektportalen]"
            $SiteDesign = Set-PnPSiteDesign -Identity $SiteDesign -SiteScriptIds $SiteScriptIds -Description "" -Version "1" -Connection $AdminSiteConnection
        }
        else {
            Write-Host "[INFO] Creating new site design [Prosjektportalen]"
            $SiteDesign = Add-PnPSiteDesign -Title "Prosjektportalen" -SiteScriptIds $SiteScriptIds -Description "" -WebTemplate TeamSite -Connection $AdminSiteConnection
        }
    }
    Catch {
        Write-Host "[INFO] Failed to install site design: $($_.Exception.Message)"
        exit 0
    }
}

if(-not $SkipAppPackages.IsPresent) {
    Try {
        Write-Host "[INFO] Installing SharePoint Framework app packages to [$AppCatalogUrl]"
        $AppPackages = @(
            "..\SharePointFramework\PortfolioWebParts\sharepoint\solution\pp-portfolio-web-parts.sppkg",
            "..\SharePointFramework\ProjectExtensions\sharepoint\solution\pp-project-extensions.sppkg",
            "..\SharePointFramework\ProjectWebParts\sharepoint\solution\pp-project-web-parts.sppkg"
        )
        $AppPackages | ForEach-Object {
            $AppPackage = Get-ChildItem $_.
            Add-PnPApp -Path $AppPackage.FullName -Scope Tenant -Publish -Overwrite -SkipFeatureDeployment -ErrorAction Stop -Connection $AppCatalogSiteConnection
        }
        Write-Host "[INFO] SharePoint Framework app packages successfully installed to [$AppCatalogUrl]" -ForegroundColor Green
    }
    Catch {
        Write-Host "[INFO] Failed to install app packages to [$AppCatalogUrl]: $($_.Exception.Message)"
        exit 0
    }
}

Write-Host "[INFO] Installation done" -ForegroundColor Green

Disconnect-PnPOnline -Connection $AppCatalogSiteConnection
Disconnect-PnPOnline -Connection $AdminSiteConnection
Disconnect-PnPOnline -Connection $PortfolioSiteConnection