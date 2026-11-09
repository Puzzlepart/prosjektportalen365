# Runs on every upgrade, regardless of the previous version: the checks are cheap, and a program
# site an upgrade skipped (not yet in the hub, or the upgrading user had no access) is fixed by the
# next one.
#
# Until 1.15.0, Programmal (en-US ProgramTemplate) declared the lookup column
# GtProjectLogProductLookup in Prosjektlogg with List="{listid:Prosjektleveranser}", a list program
# sites do not have. sp-js-provisioning up to 1.4.0 sent the unresolved token as it was, SharePoint refused the
# column, and the engine logged that at info level only, so program sites from before 1.15.0 have no
# such column (all five program sites on the test channel, 2026-11-06). Since 1.15.0 the template
# points it at the program's own Programleveranser, and this step does the same on existing
# program sites (GtIsProgram on the site's properties item):
#
# - the column is missing: it is added, pointing at Programleveranser;
# - it points at a list the site does not have, or at Prosjektleveranser: it is re-pointed at
#   Programleveranser, but only while no item has a value in it. SharePoint keeps the stored item
#   ids when a lookup is re-pointed, so each would show whichever Programleveranser item has the
#   same id. A column with values is left as it is, with a warning, for an administrator to decide.
#   A lookup to a missing list offers nothing to choose in SharePoint's forms, so a value in one
#   was written by a script, and only its author knows what it meant;
# - it points at Programleveranser, or at another list of the site: it is left as it is. A column
#   pointing at Programleveranser that still has its internal name as title (an earlier add whose
#   titling failed) gets the release's title.
#
# Nothing is deleted. Without Programleveranser the step says so and changes nothing. Names come
# from the release's resources, so English program sites are handled too.
function Repair-ProgramProjectLogProductLookup {
  $FieldId = "022cc93f-13df-4420-bd47-55e4fdae5d18"
  $FieldName = "GtProjectLogProductLookup"
  $PropertiesTitle = Get-Resource -Name "Lists_ProjectProperties_Title"
  $ProjectLogTitle = Get-Resource -Name "Lists_ProjectLog_Title"
  $ProgramDeliveriesTitle = Get-Resource -Name "Lists_ProgramDeliveries_Title"
  $ProjectDeliveriesTitle = Get-Resource -Name "Lists_ProjectDeliveries_Title"

  # The flag the setup wizard writes from the chosen template (Maloppsett's GtIsProgram), read as
  # the web parts read it: the first item of the properties list.
  $PropertiesItem = Get-PnPListItem -List $PropertiesTitle -Query "<View><RowLimit>1</RowLimit></View>" | Select-Object -First 1
  if ($null -eq $PropertiesItem -or $PropertiesItem.FieldValues["GtIsProgram"] -ne $true) {
    return
  }

  $WebLists = @(Get-PnPList)
  $ProjectLog = $WebLists | Where-Object { $_.Title -eq $ProjectLogTitle } | Select-Object -First 1
  if ($null -eq $ProjectLog) {
    Write-Host "`t`tThe program has no $ProjectLogTitle list: nothing to do for $FieldName" -ForegroundColor Green
    return
  }
  $ProgramDeliveries = $WebLists | Where-Object { $_.Title -eq $ProgramDeliveriesTitle } | Select-Object -First 1
  if ($null -eq $ProgramDeliveries) {
    Write-Host "`t`t[WARN] The program has no $ProgramDeliveriesTitle list, so $FieldName in $ProjectLogTitle cannot point at it: leaving the list as it is" -ForegroundColor Yellow
    return
  }
  $ProjectDeliveries = $WebLists | Where-Object { $_.Title -eq $ProjectDeliveriesTitle } | Select-Object -First 1
  $FieldTitle = Get-Resource -Name "ListFields_ProjectLogProductLookup_DisplayName"

  $Field = Get-PnPField -List $ProjectLog -Identity $FieldId -ErrorAction SilentlyContinue
  if ($null -eq $Field) {
    $SameName = Get-PnPField -List $ProjectLog -Identity $FieldName -ErrorAction SilentlyContinue
    if ($null -ne $SameName) {
      Write-Host "`t`t[WARN] $ProjectLogTitle has a column $FieldName with another id ($($SameName.Id)): leaving it" -ForegroundColor Yellow
      return
    }
    # As the setup does (sp-js-provisioning): created with the internal name as display name, so
    # SharePoint derives the internal name from it, added to the list's default content type and
    # not to the default view, then titled.
    $Description = [System.Security.SecurityElement]::Escape((Get-Resource -Name "ListFields_ProjectLogProductLookup_Description"))
    $FieldXml = "<Field Type=`"Lookup`" DisplayName=`"$FieldName`" List=`"$($ProgramDeliveries.Id)`" ShowField=`"Title`" ID=`"{$FieldId}`" Description=`"$Description`" StaticName=`"$FieldName`" Name=`"$FieldName`" />"
    Write-Host "`t`tAdding $FieldName to $ProjectLogTitle, looking up $ProgramDeliveriesTitle"
    $ProjectLog.Fields.AddFieldAsXml($FieldXml, $false, [Microsoft.SharePoint.Client.AddFieldOptions]::AddToDefaultContentType) | Out-Null
    Invoke-PnPQuery
    Set-PnPField -List $ProjectLog -Identity $FieldId -Values @{ Title = $FieldTitle } | Out-Null
    $Added = Get-PnPField -List $ProjectLog -Identity $FieldId -ErrorAction SilentlyContinue
    if ($null -eq $Added) {
      Write-Host "`t`t[ERROR] SharePoint did not add $FieldName to $ProjectLogTitle" -ForegroundColor Yellow
      return
    }
    # Read back: the list it looks up and its title, not only that it exists.
    $Added.Context.Load($Added)
    Invoke-PnPQuery
    [xml]$AddedSchema = $Added.SchemaXml
    $AddedListId = [guid]::Empty
    if (-not ([guid]::TryParse($AddedSchema.DocumentElement.GetAttribute("List"), [ref]$AddedListId) -and $AddedListId -eq $ProgramDeliveries.Id)) {
      Write-Host "`t`t[ERROR] SharePoint added $FieldName to $ProjectLogTitle, but it does not look up $ProgramDeliveriesTitle" -ForegroundColor Yellow
    }
    elseif ($Added.Title -ne $FieldTitle) {
      Write-Host "`t`t[ERROR] SharePoint added $FieldName to $ProjectLogTitle, but its title is '$($Added.Title)', not '$FieldTitle'" -ForegroundColor Yellow
    }
    else {
      Write-Host "`t`tAdded $FieldName to $ProjectLogTitle" -ForegroundColor Green
    }
    return
  }

  $Field.Context.Load($Field)
  Invoke-PnPQuery
  if (@("Lookup", "LookupMulti") -notcontains $Field.TypeAsString) {
    Write-Host "`t`t[WARN] $FieldName in $ProjectLogTitle is a $($Field.TypeAsString) column, not a lookup: leaving it" -ForegroundColor Yellow
    return
  }
  [xml]$Schema = $Field.SchemaXml
  $StoredList = $Schema.DocumentElement.GetAttribute("List")
  $StoredListId = [guid]::Empty
  $Target = $null
  if ([guid]::TryParse($StoredList, [ref]$StoredListId)) {
    $Target = $WebLists | Where-Object { $_.Id -eq $StoredListId } | Select-Object -First 1
  }
  if ($null -ne $Target -and $Target.Id -eq $ProgramDeliveries.Id) {
    # An earlier add whose titling failed left the internal name as title; an administrator's own
    # title is kept.
    if ($Field.Title -eq $FieldName) {
      Set-PnPField -List $ProjectLog -Identity $FieldId -Values @{ Title = $FieldTitle } | Out-Null
      Write-Host "`t`t$FieldName in $ProjectLogTitle already looks up $ProgramDeliveriesTitle; titled '$FieldTitle'" -ForegroundColor Green
      return
    }
    Write-Host "`t`t$FieldName in $ProjectLogTitle already looks up $ProgramDeliveriesTitle" -ForegroundColor Green
    return
  }
  if ($null -ne $Target -and ($null -eq $ProjectDeliveries -or $Target.Id -ne $ProjectDeliveries.Id)) {
    Write-Host "`t`t$FieldName in $ProjectLogTitle looks up the site's list '$($Target.Title)': leaving it" -ForegroundColor Green
    return
  }
  $Reason = if ($null -eq $Target) { "a list the site does not have ($StoredList)" } else { $ProjectDeliveriesTitle }

  # Items with a value in the column. A list without items has none; a read that fails counts as
  # values, so the column is left rather than re-pointed blind.
  $ItemCount = Get-PnPProperty -ClientObject $ProjectLog -Property ItemCount
  $WithValue = 0
  if ($ItemCount -gt 0) {
    try {
      $WithValue = @(Get-PnPListItem -List $ProjectLog -Fields "ID", $FieldName -PageSize 2000 | Where-Object {
          $Value = $_.FieldValues[$FieldName]
          $null -ne $Value -and @($Value).Count -gt 0
        }).Count
    }
    catch {
      Write-Host "`t`t[WARN] Could not read the values of $FieldName in ${ProjectLogTitle}: $($_.Exception.Message)" -ForegroundColor Yellow
      $WithValue = -1
    }
  }
  if ($WithValue -ne 0) {
    $Items = if ($WithValue -gt 0) { "$WithValue item(s) have a value in it" } else { "its values could not be read" }
    Write-Host "`t`t[WARN] $FieldName in $ProjectLogTitle looks up $Reason, and $Items. Re-pointed at $ProgramDeliveriesTitle, each stored id would show the $ProgramDeliveriesTitle item with that id: leaving the column for an administrator" -ForegroundColor Yellow
    return
  }

  Write-Host "`t`tRe-pointing $FieldName in $ProjectLogTitle from $Reason to $ProgramDeliveriesTitle"
  $Schema.DocumentElement.SetAttribute("List", "$($ProgramDeliveries.Id)")
  if ($Schema.DocumentElement.HasAttribute("WebId")) {
    $Schema.DocumentElement.SetAttribute("WebId", "$((Get-PnPWeb).Id)")
  }
  if (-not $Schema.DocumentElement.GetAttribute("ShowField")) {
    $Schema.DocumentElement.SetAttribute("ShowField", "Title")
  }
  $Field.SchemaXml = $Schema.DocumentElement.OuterXml
  $Field.Update()
  Invoke-PnPQuery

  $Field.Context.Load($Field)
  Invoke-PnPQuery
  [xml]$Updated = $Field.SchemaXml
  $UpdatedListId = [guid]::Empty
  if ([guid]::TryParse($Updated.DocumentElement.GetAttribute("List"), [ref]$UpdatedListId) -and $UpdatedListId -eq $ProgramDeliveries.Id) {
    Write-Host "`t`t$FieldName in $ProjectLogTitle now looks up $ProgramDeliveriesTitle" -ForegroundColor Green
  }
  else {
    Write-Host "`t`t[ERROR] SharePoint did not re-point $FieldName in $ProjectLogTitle" -ForegroundColor Yellow
  }
}

try {
  Repair-ProgramProjectLogProductLookup
}
catch {
  # Logged, not thrown: a throw would end the run for every site after this one.
  Write-Host "`t`t[ERROR] Could not check or fix GtProjectLogProductLookup in the project log: $($_.Exception.Message)" -ForegroundColor Yellow
}
