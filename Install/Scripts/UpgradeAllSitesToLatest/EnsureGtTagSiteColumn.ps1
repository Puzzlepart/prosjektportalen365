$TargetVersion = [version]"1.8.0"

if ($global:__PreviousVersion -lt $TargetVersion) {
    $ProjectDeliveries = Get-PnPList -Identity "Prosjektleveranser" -ErrorAction SilentlyContinue
    if ($null -ne $ProjectDeliveries) {
        $GtTagSiteColumn = Get-PnPField -Identity "GtTag" -ErrorAction SilentlyContinue
        if ($null -eq $GtTagSiteColumn) {
            Write-Host "`t`tAdding GtTag field to site"
            $SiteColumnXml = '<Field ID="{4d342fb6-a0e0-4064-b794-c1d36c922997}" DisplayName="Etikett" Name="GtTag" Type="Choice" Group="Kolonner for Prosjektportalen (Prosjekt)" Description="Hvilken etikett ønsker du å sette på tidslinje elementet" Format="RadioButtons" FillInChoice="FALSE" StaticName="GtTag"><Default></Default><CHOICES><CHOICE>Overordnet</CHOICE><CHOICE>Underordnet</CHOICE><CHOICE>Test</CHOICE></CHOICES></Field>'
            $SiteColumn = Add-PnPFieldFromXml -FieldXml $SiteColumnXml
            $SiteColumn = Get-PnPField -Identity $SiteColumn.Id

            $ProjectDeliveriesContentType = Get-PnPContentType -Identity "Prosjektleveranse" -List "Prosjektleveranser" -ErrorAction SilentlyContinue
            if ($null -ne $ProjectDeliveriesContentType) {
                Add-PnPFieldToContentType -Field "GtTag" -ContentType "Prosjektleveranse" -Hidden -ErrorAction SilentlyContinue
            }
        }
        else {
            Write-Host "`t`tThe site already has the GtTag field" -ForegroundColor Green
        }
    }
}