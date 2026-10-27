# Runs on every upgrade, regardless of the previous version. This step used to run only when
# upgrading from 1.9.0 or older, so a project site skipped by that upgrade (not yet in the hub, or
# the upgrading user had no access) never got the field later. The exists check makes it idempotent
# and cheap, so there is no reason to gate it. Names come from the release's resources, so an
# English site gets the English list title, display name and choices.
$listName = Get-Resource -Name "Lists_ProjectProperties_Title"
$fieldId = "{664ddf9a-a415-4b0b-a34f-0653547f03f0}"
$fieldName = "GtProjectAdminRoles"

$ProjectProperties = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue
if ($null -eq $ProjectProperties) {
  return
}

$field = Get-PnPField -List $listName -Identity $fieldId -ErrorAction SilentlyContinue
if ($null -ne $field) {
  Write-Host "`t`tThe site already has the $fieldName field" -ForegroundColor Green
  return
}

$displayName = [System.Security.SecurityElement]::Escape((Get-Resource -Name "SiteFields_GtProjectAdminRoles_DisplayName"))
$description = [System.Security.SecurityElement]::Escape((Get-Resource -Name "SiteFields_GtProjectAdminRoles_Description"))
$defaultChoice = [System.Security.SecurityElement]::Escape((Get-Resource -Name "Lists_ProjectAdminRoles_SPAdmin"))
$choices = @(
  "Lists_ProjectAdminRoles_ProjectOwner",
  "Lists_ProjectAdminRoles_ProjectManager",
  "Lists_ProjectAdminRoles_ProjectSupport",
  "Lists_ProjectAdminRoles_ProjectOffice",
  "Lists_ProjectAdminRoles_SPAdmin"
) | ForEach-Object { "<CHOICE>$([System.Security.SecurityElement]::Escape((Get-Resource -Name $_)))</CHOICE>" }

$fieldXml = @"
<Field Type="MultiChoice" DisplayName="$displayName" Description="$description" Format="Dropdown" FillInChoice="FALSE" ID="$fieldId" StaticName="$fieldName" Name="$fieldName">
  <Default>$defaultChoice</Default><CHOICES>$($choices -join '')</CHOICES>
</Field>
"@

Write-Host "`t`tAdding field $fieldName to list $listName"
$newfield = Add-PnPFieldFromXml -List $listName -FieldXml $fieldXml

$field = Get-PnPField -List $listName -Identity $fieldId -ErrorAction SilentlyContinue
if ($null -eq $field) {
  Write-Host "`t`tFailed to add field $fieldName to list $listName" -ForegroundColor Yellow
  return
}

# The list's item content type is "Element" on a Norwegian site and "Item" on an English one, so
# pick it by its id (0x0100 is Item) instead of its name.
Get-PnPContentType -List $listName -ErrorAction SilentlyContinue | Where-Object { $_.Id.StringValue -like "0x0100*" } | ForEach-Object {
  $newfieldct = Add-PnPFieldToContentType -Field $field -ContentType $_ -ErrorAction SilentlyContinue
}

$defaultValue = Get-Resource -Name "Lists_ProjectAdminRoles_SPAdmin"
$items = Get-PnPListItem -List $listName
foreach ($item in $items) {
  $item[$fieldName] = $defaultValue
  $item.Update()
  Invoke-PnPQuery
}
