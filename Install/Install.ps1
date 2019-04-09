Param(
    [Parameter(Mandatory = $true, HelpMessage = "N/A")]
    [string]$Url,
    [Parameter(Mandatory = $false, HelpMessage = "N/A")]
    [string]$Title = "Prosjektportalen",
    [Parameter(Mandatory = $false, HelpMessage = "Stored credential from Windows Credential Manager")]
    [string]$GenericCredential,
    [Parameter(Mandatory = $false, HelpMessage = "Skip PnP template")]
    [switch]$SkipTemplate,
    [Parameter(Mandatory = $false, HelpMessage = "Skip Site Design")]
    [switch]$SkipSiteDesign,
    [Parameter(Mandatory = $false, HelpMessage = "Skip app packages")]
    [switch]$SkipAppPackages,
    [Parameter(Mandatory = $false, HelpMessage = "Skip site creation")]
    [switch]$SkipSiteCreation,
    [Parameter(Mandatory = $false, HelpMessage = "Skip site creation")]
    [string]$SiteDesignName = "Prosjektområde"
)

$sw = [Diagnostics.Stopwatch]::StartNew()

function Connect-SharePoint {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    $Connection = $null
    Try {
        Write-Host "[INFO] Connecting to [$Url] using Windows Credentials Manager"
        $Connection = Connect-PnPOnline -Url $Url -Credentials $GenericCredential -ReturnConnection -ErrorAction Stop
    }
    Catch {
    
    }
    return $Connection
}

[System.Uri]$Uri = $Url
$Alias = $Uri.Segments[$Uri.Segments.Segments.Length - 1]
$AdminSiteConnection = $null
$AppCatalogSiteConnection = $null
$SiteConnection = $null
$AdminSiteUrl = (@($Uri.Scheme, "://", $Uri.Authority) -join "").Replace(".sharepoint.com", "-admin.sharepoint.com")
$TenantAppCatalogUrl = $null

Set-PnPTraceLog -On -Level Debug -LogFile InstallLog.txt


Try {
    $TenantAppCatalogUrl = Get-PnPTenantAppCatalogUrl -Connection $AdminSiteConnection
}
Catch {
    
}

Try {
    $AppCatalogSiteConnection = Connect-SharePoint -Url $TenantAppCatalogUrl -ErrorAction Stop
}
Catch {
    Write-Host "[INFO] Failed to connect to [$TenantAppCatalogUrl]: $($_.Exception.Message)"
    exit 0
}

if (-not $SkipSiteCreation.IsPresent) {
    Try {
        $PortfolioSite = Get-PnPTenantSite -Url $Url -Connection $AdminSiteConnection -ErrorAction SilentlyContinue
        if ($null -eq $PortfolioSite) {
            Write-Host "[INFO] Creating portfolio site at [$Url]"
            New-PnPSite -Type TeamSite  -Title $Title -Alias $Alias -IsPublic:$true -ErrorAction Stop -Connection $AppCatalogSiteConnection -Lcid 1044 >$null 2>&1
            Write-Host "[INFO] Portfolio site created at [$Url]" -ForegroundColor Green
        }
        Register-PnPHubSite -Site $Url -ErrorAction SilentlyContinue -Connection $AdminSiteConnection 
        Write-Host "[INFO] Portfolio site [$Url] promoted to hub site" -ForegroundColor Green
    }
    Catch {
        Write-Host "[INFO] Failed to create site and promote to hub site: $($_.Exception.Message)"
        exit 0
    }
}

Try {
    Write-Host "[INFO] Clearing QuickLaunch"    
    Get-PnPNavigationNode -Location QuickLaunch | ForEach-Object { Remove-PnPNavigationNode -Identity $_.Id -Location QuickLaunch -Force }
}
Catch {
    Write-Host "[INFO] Failed to clear QuickLaunch: $($_.Exception.Message)"
    exit 0
}

Try {
    $SiteConnection = Connect-SharePoint -Url $Url -ErrorAction Stop
}
Catch {
    Write-Host "[INFO] Failed to connect to [$Url]: $($_.Exception.Message)"
    exit 0
}

if (-not $SkipTemplate.IsPresent) {
    Try {
        Write-Host "[INFO] Applying PnP template [Portal] to [$Url]"
        Apply-PnPProvisioningTemplate .\Templates\Portal.pnp -Connection $SiteConnection -ErrorAction Stop
    }
    Catch {
        Write-Host "[INFO] Failed to apply PnP template [Portal] to [$Url]: $($_.Exception.Message)"
        exit 0
    }
}


if (-not $SkipSiteDesign.IsPresent) {
    $SiteScriptIds = @()

    Try {
        Write-Host "[INFO] Installing site scripts"
        $SiteScripts = Get-PnPSiteScript -Connection $AdminSiteConnection
        $SiteScriptSrc = Get-ChildItem "./SiteScripts/*.txt"
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
    
        $SiteDesign = Get-PnPSiteDesign -Identity $SiteDesignName -Connection $AdminSiteConnection

        if ($null -ne $SiteDesign) {
            Write-Host "[INFO] Updating existing site design [$SiteDesignName]"
            $SiteDesign = Set-PnPSiteDesign -Identity $SiteDesign -SiteScriptIds $SiteScriptIds -Description "" -Version "1" -Connection $AdminSiteConnection
        }
        else {
            Write-Host "[INFO] Creating new site design [$SiteDesignName]"
            $SiteDesign = Add-PnPSiteDesign -Title $SiteDesignName -SiteScriptIds $SiteScriptIds -Description "" -WebTemplate TeamSite -Connection $AdminSiteConnection
        }
    }
    Catch {
        Write-Host "[INFO] Failed to install site design: $($_.Exception.Message)"
        exit 0
    }
}

if (-not $SkipAppPackages.IsPresent) {
    Try {
        $TenantAppCatalogUrl = Get-PnPTenantAppCatalogUrl -Connection $AdminSiteConnection
    }
    Catch {
        
    }    
    Try {
        $AppCatalogSiteConnection = Connect-SharePoint -Url $TenantAppCatalogUrl -ErrorAction Stop
    }
    Catch {
        Write-Host "[INFO] Failed to connect to [$TenantAppCatalogUrl]: $($_.Exception.Message)"
        exit 0
    }
    Try {
        Write-Host "[INFO] Installing SharePoint Framework app packages to [$AppCatalogUrl]"
        $AppPackages = @(
            ".\Apps\pp-portfolio-web-parts.sppkg",
            ".\Apps\pp-project-extensions.sppkg",
            ".\Apps\pp-project-web-parts.sppkg"
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

$sw.Stop()

Write-Host "[INFO] Installation completed in $($sw.Elapsed)" -ForegroundColor Green

Disconnect-PnPOnline -Connection $AppCatalogSiteConnection
Disconnect-PnPOnline -Connection $AdminSiteConnection
Disconnect-PnPOnline -Connection $SiteConnection