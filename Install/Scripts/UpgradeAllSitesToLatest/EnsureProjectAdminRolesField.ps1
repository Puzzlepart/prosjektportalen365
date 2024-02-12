$TargetVersion = "1.9.0"

if ($global:__PreviousVersion -le $TargetVersion) {
  $fieldXml = @"
  <Field Type="MultiChoice" DisplayName="Prosjektadministrasjonsroller" Description="Velg hvilke roller som skal kunne administrere prosjektet. Dette inkluderer handlinger som å redigere prosjektegenskaper og fase." Format="Dropdown" FillInChoice="FALSE" ID="{664ddf9a-a415-4b0b-a34f-0653547f03f0}" StaticName="GtProjectAdminRoles" Name="GtProjectAdminRoles">
    <Default>SP områdeadministrator</Default><CHOICES><CHOICE>Prosjekteier</CHOICE><CHOICE>Prosjektleder</CHOICE><CHOICE>Prosjektstøtte</CHOICE><CHOICE>Prosjektkontor</CHOICE><CHOICE>SP områdeadministrator</CHOICE></CHOICES>
  </Field>
"@

  $listName = "Prosjektegenskaper"
  $fieldId = "{664ddf9a-a415-4b0b-a34f-0653547f03f0}"

  $ProjectProperties = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue
  if ($null -ne $ProjectProperties) {
    $field = Get-PnPField -List $listName -Identity $fieldId -ErrorAction SilentlyContinue
    if ($null -eq $field) {
      Write-Host "`t`tAdding field GtProjectAdminRoles to list $listName"
      $newfield = Add-PnPFieldFromXml -List $listName -FieldXml $fieldXml

      $field = Get-PnPField -List $listName -Identity $fieldId -ErrorAction SilentlyContinue
      if ($null -ne $field) {
        $contentType = Get-PnPContentType -List $listName -Identity "Element" -ErrorAction SilentlyContinue
        if ($null -ne $contentType) {
          Write-Host "`t`t`tAdding GtProjectAdminRoles field to contenttype"
          $newfieldct = Add-PnPFieldToContentType -Field "GtProjectAdminRoles" -ContentType $contentType.Name -ErrorAction SilentlyContinue
        }

        $items = Get-PnPListItem -List $listName
        foreach ($item in $items) {
          Write-Host "`t`t`tSetting default value for GtProjectAdminRoles field"
          $item["GtProjectAdminRoles"] = [System.Uri]::UnescapeDataString("SP omr%C3%A5deadministrator")
          $item.Update()
          Invoke-PnPQuery
        }
      }
    }
    else {
      Write-Host "`t`tThe site already has the GtProjectAdminRoles field" -ForegroundColor Green
    }
  }
}
