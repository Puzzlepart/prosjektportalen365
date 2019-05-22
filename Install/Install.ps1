Param(
    [Parameter(Mandatory = $true, HelpMessage = "N/A")]
    [string]$Url,
    [Parameter(Mandatory = $false, HelpMessage = "N/A")]
    [string]$Title = "Prosjektportalen",
    [Parameter(Mandatory = $false, HelpMessage = "Stored credential from Windows Credential Manager")]
    [string]$GenericCredential,
    [Parameter(Mandatory = $false, HelpMessage = "Use Web Login")]
    [switch]$UseWebLogin,
    [Parameter(Mandatory = $false, HelpMessage = "Skip PnP template")]
    [switch]$SkipTemplate,
    [Parameter(Mandatory = $false, HelpMessage = "Skip Site Design")]
    [switch]$SkipSiteDesign,
    [Parameter(Mandatory = $false, HelpMessage = "Skip app packages")]
    [switch]$SkipAppPackages,
    [Parameter(Mandatory = $false, HelpMessage = "Skip site creation")]
    [switch]$SkipSiteCreation,
    [Parameter(Mandatory = $false, HelpMessage = "Site design name")]
    [string]$SiteDesignName = "Prosjektområde",
    [Parameter(Mandatory = $false, HelpMessage = "Security group to give View access to site design")]
    [string]$SiteDesignSecurityGroupId
)

$sw = [Diagnostics.Stopwatch]::StartNew()

function Connect-SharePoint {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    $Connection = $null
    Try {
        if($UseWebLogin.IsPresent) {
            Write-Host "[INFO] Connecting to [$Url] using Web Login"
            $Connection = Connect-PnPOnline -Url $Url -UseWebLogin -ReturnConnection -ErrorAction Stop
        } else {
            Write-Host "[INFO] Connecting to [$Url] using Windows Credentials Manager"
            $Connection = Connect-PnPOnline -Url $Url -Credentials $GenericCredential -ReturnConnection -ErrorAction Stop
        }
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
    $AdminSiteConnection = Connect-SharePoint -Url $AdminSiteUrl -ErrorAction Stop
}
Catch {
    Write-Host "[INFO] Failed to connect to [$AdminSiteUrl]: $($_.Exception.Message)"
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
        Write-Host "[ERROR] Failed to create site and promote to hub site: $($_.Exception.Message)"
        exit 0
    }
}

Write-Host "[INFO] Setting permissions for associated member group"
Set-PnPGroupPermissions -Identity (Get-PnPGroup -AssociatedMemberGroup) -RemoveRole Rediger
Set-PnPGroupPermissions -Identity (Get-PnPGroup -AssociatedMemberGroup) -AddRole Lese

Try {
    $SiteConnection = Connect-SharePoint -Url $Url -ErrorAction Stop
}
Catch {
    Write-Host "[INFO] Failed to connect to [$Url]: $($_.Exception.Message)"
    exit 0
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
        Write-Host "[INFO] Successfully installed site scripts" -ForegroundColor Green
    }
    Catch {
        Write-Host "[INFO] Failed to install site scripts: $($_.Exception.Message)"
        exit 0
    }

    Try {
        Write-Host "[INFO] Installing site design [$SiteDesignName]"
    
        $SiteDesign = Get-PnPSiteDesign -Identity $SiteDesignName -Connection $AdminSiteConnection

        if ($null -ne $SiteDesign) {
            Write-Host "[INFO] Updating existing site design [$SiteDesignName]"
            $SiteDesign = Set-PnPSiteDesign -Identity $SiteDesign -SiteScriptIds $SiteScriptIds -Description "" -Version "1" -Connection $AdminSiteConnection
        }
        else {
            Write-Host "[INFO] Creating new site design [$SiteDesignName]"
            $SiteDesign = Add-PnPSiteDesign -Title $SiteDesignName -SiteScriptIds $SiteScriptIds -Description "" -WebTemplate TeamSite -Connection $AdminSiteConnection
        }
        if ([string]::IsNullOrEmpty($SiteDesignSecurityGroupId)) {
            Write-Host "[INFO] You have not specified -SiteDesignSecurityGroupId. Everyone will have View access to site design [$SiteDesignName]" -ForegroundColor Yellow
        }
        else {            
            Write-Host "[INFO] Granting group $SiteDesignSecurityGroupId View access to site design [$SiteDesignName]"
            Grant-PnPSiteDesignRights -Identity $SiteDesign.Id.Guid -Principals @("c:0t.c|tenant|$SiteDesignSecurityGroupId")
        }
        Write-Host "[INFO] Successfully installed site design [$SiteDesignName]" -ForegroundColor Green
    }
    Catch {
        Write-Host "[INFO] Failed to install site design: $($_.Exception.Message)"
        exit 0
    }
}

if (-not $SkipAppPackages.IsPresent) {
    Try {
        $TenantAppCatalogUrl = Get-PnPTenantAppCatalogUrl -Connection $AdminSiteConnection
        $AppCatalogSiteConnection = Connect-SharePoint -Url $TenantAppCatalogUrl -ErrorAction Stop
    }
    Catch {
        Write-Host "[INFO] Failed to connect to [$TenantAppCatalogUrl]: $($_.Exception.Message)"
        exit 0 
    }
    Try {
        Write-Host "[INFO] Installing SharePoint Framework app packages to [$TenantAppCatalogUrl]"
        $AppPackages = @(
            "pp-portfolio-web-parts",
            "pp-project-extensions",
            "pp-project-web-parts"
        )
        foreach($AppPkg in $AppPackages) {
            Add-PnPApp -Path ".\Apps\$($AppPkg).sppkg" -Scope Tenant -Publish -Overwrite -SkipFeatureDeployment -ErrorAction Stop -Connection $AppCatalogSiteConnection >$null 2>&1
        }
        Write-Host "[INFO] SharePoint Framework app packages successfully installed to [$TenantAppCatalogUrl]" -ForegroundColor Green
    }
    Catch {
        Write-Host "[INFO] Failed to install app packages to [$TenantAppCatalogUrl]: $($_.Exception.Message)"
        exit 0
    }
}

if (-not $SkipTemplate.IsPresent) {
    Try {
        Write-Host "[INFO] Applying PnP template [Portal] to [$Url]"
        $DenyAddAndCustomizePagesStatusEnum = [Microsoft.Online.SharePoint.TenantAdministration.DenyAddAndCustomizePagesStatus]
        $Site = Get-PnPTenantSite -Detailed -Url $Url -Connection $AdminSiteConnection
        $Site.DenyAddAndCustomizePages = $DenyAddAndCustomizePagesStatusEnum::Disabled 
        $Site.Update() >$null 2>&1
        $Site.Context.ExecuteQuery()
        Apply-PnPProvisioningTemplate .\Templates\Portal.pnp -Connection $SiteConnection -ErrorAction Stop
        $Site.DenyAddAndCustomizePages = $DenyAddAndCustomizePagesStatusEnum::Enabled 
        $Site.Update() >$null 2>&1
        $Site.Context.ExecuteQuery()
        Write-Host "[INFO] Successfully applied PnP template [Portal] to [$Url]" -ForegroundColor Green
    }
    Catch {
        Write-Host "[ERROR] Failed to apply PnP template [Portal] to [$Url]: $($_.Exception.Message)"
        exit 0
    }
}

Try {
    Write-Host "[INFO] Clearing QuickLaunch"    
    Get-PnPNavigationNode -Location QuickLaunch -Connection $SiteConnection | Remove-PnPNavigationNode -Connection $SiteConnection -Force 
    Write-Host "[INFO] Successfully cleared QuickLaunch" -ForegroundColor Green
}
Catch {
    Write-Host "[WARNING] Failed to clear QuickLaunch: $($_.Exception.Message)"
}

$sw.Stop()

Write-Host "[INFO] Installation completed in $($sw.Elapsed)" -ForegroundColor Green

Disconnect-PnPOnline -Connection $AppCatalogSiteConnection
Disconnect-PnPOnline -Connection $AdminSiteConnection
Disconnect-PnPOnline -Connection $SiteConnection