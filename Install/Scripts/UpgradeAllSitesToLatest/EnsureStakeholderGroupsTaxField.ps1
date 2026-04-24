$TargetVersion = [version]"1.14.0"

if ($global:__PreviousVersion -ge $TargetVersion) {
    return
}

$listName = "Interessentregister"
$newFieldId = "ba8e9bcd-d8af-41e2-a24c-d279e07f1b56"
$termGroupName = "Prosjektportalen"
$termSetName = "Interessentgrupper"
$termSetPath = "$termGroupName|$termSetName"
$contentTypeName = "Interessent"
$oldFieldNames = @("GtStakeholderGroup", "GtBAStakeholderGroup")

$list = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue
if ($null -eq $list) {
    return
}

Write-Host "`t`tMigrating stakeholder group field on list '$listName'"

# 1. Add the new site column (taxonomy) and bind to the list/content type if missing.
$existingField = Get-PnPField -List $listName -Identity $newFieldId -ErrorAction SilentlyContinue
if ($null -eq $existingField) {
    try {
        $siteField = Get-PnPField -Identity $newFieldId -ErrorAction SilentlyContinue
        if ($null -eq $siteField) {
            Write-Host "`t`t`tAdding site column GtStakeholderGroups (TermSet: $termSetPath)"
            Add-PnPTaxonomyField `
                -DisplayName "Interessentgrupper" `
                -InternalName "GtStakeholderGroups" `
                -Group "Kolonner for Prosjektportalen (Prosjekt)" `
                -TermSetPath $termSetPath `
                -MultiValue `
                -Id $newFieldId | Out-Null
        }

        Write-Host "`t`t`tAdding GtStakeholderGroups to list '$listName'"
        Add-PnPField -List $listName -Field "GtStakeholderGroups" -ErrorAction SilentlyContinue | Out-Null

        $contentType = Get-PnPContentType -List $listName -Identity $contentTypeName -ErrorAction SilentlyContinue
        if ($null -ne $contentType) {
            Add-PnPFieldToContentType -Field "GtStakeholderGroups" -ContentType $contentType.Name -ErrorAction SilentlyContinue | Out-Null
        }
    }
    catch {
        Write-Host "`t`t[ERROR] Could not add GtStakeholderGroups field: $($_.Exception.Message)" -ForegroundColor Yellow
        return
    }
}

# 2. Migrate existing data from the old Choice fields to the new taxonomy field.
$termCache = @{}
$hasOldField = @{}
foreach ($oldName in $oldFieldNames) {
    $hasOldField[$oldName] = $null -ne (Get-PnPField -List $listName -Identity $oldName -ErrorAction SilentlyContinue)
}

if ($hasOldField.Values -contains $true) {
    $items = Get-PnPListItem -List $listName -PageSize 500
    foreach ($item in $items) {
        try {
            $existingNew = $item["GtStakeholderGroups"]
            if ($null -ne $existingNew -and $existingNew.Count -gt 0) { continue }

            $labels = @()
            foreach ($oldName in $oldFieldNames) {
                if (-not $hasOldField[$oldName]) { continue }
                $val = $item[$oldName]
                if ([string]::IsNullOrWhiteSpace($val)) { continue }
                # Choice fields normally store a single string; be defensive about ';#' separators too.
                foreach ($part in ([string]$val).Split(@(";#", ";"), [StringSplitOptions]::RemoveEmptyEntries)) {
                    $clean = $part.Trim()
                    if (-not [string]::IsNullOrWhiteSpace($clean)) { $labels += $clean }
                }
            }
            $labels = $labels | Where-Object { $_ } | Select-Object -Unique
            if ($labels.Count -eq 0) { continue }

            $termRefs = @()
            foreach ($label in $labels) {
                if (-not $termCache.ContainsKey($label)) {
                    $term = Get-PnPTerm -TermSet $termSetName -TermGroup $termGroupName -Identity $label -ErrorAction SilentlyContinue
                    if ($null -eq $term) {
                        Write-Host "`t`t`tCreating new term '$label' in $termSetPath"
                        $term = New-PnPTerm -TermSet $termSetName -TermGroup $termGroupName -Name $label -ErrorAction Stop
                    }
                    $termCache[$label] = $term.Id
                }
                $termRefs += "-1;#$label|$($termCache[$label])"
            }

            $taxValue = ($termRefs -join ";#")
            Set-PnPListItem -List $listName -Identity $item.Id -Values @{ "GtStakeholderGroups" = $taxValue } -UpdateType SystemUpdate -ErrorAction Stop | Out-Null
        }
        catch {
            Write-Host "`t`t[WARN] Could not migrate item $($item.Id): $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# 3. Hide the legacy Choice fields on the list, without deleting data.
foreach ($oldName in $oldFieldNames) {
    $f = Get-PnPField -List $listName -Identity $oldName -ErrorAction SilentlyContinue
    if ($null -ne $f -and -not $f.Hidden) {
        try {
            Set-PnPField -List $listName -Identity $oldName -Values @{ Hidden = $true } | Out-Null
            Write-Host "`t`t`tHidden legacy field '$oldName'"
        }
        catch {
            Write-Host "`t`t[WARN] Could not hide field '$oldName': $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# 4. Swap legacy fields for the new field in the default AllItems view.
try {
    $view = Get-PnPView -List $listName -Identity "AllItems" -ErrorAction SilentlyContinue
    if ($null -ne $view) {
        $viewFields = @($view.ViewFields)
        $updated = $false
        $newList = New-Object System.Collections.Generic.List[string]
        $alreadyHasNew = $viewFields -contains "GtStakeholderGroups"
        foreach ($vf in $viewFields) {
            if ($oldFieldNames -contains $vf) {
                if (-not $alreadyHasNew -and -not $newList.Contains("GtStakeholderGroups")) {
                    $newList.Add("GtStakeholderGroups")
                    $alreadyHasNew = $true
                }
                $updated = $true
                continue
            }
            $newList.Add($vf)
        }
        if ($updated) {
            Set-PnPView -List $listName -Identity "AllItems" -Fields $newList.ToArray() | Out-Null
            Write-Host "`t`t`tUpdated AllItems view to use GtStakeholderGroups"
        }
    }
}
catch {
    Write-Host "`t`t[WARN] Could not update AllItems view: $($_.Exception.Message)" -ForegroundColor Yellow
}
