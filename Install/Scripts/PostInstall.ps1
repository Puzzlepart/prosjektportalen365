Param(
    [Parameter(Mandatory = $true)]
    $Connection
)

Set-PnPList -Identity Prosjektstatus -EnableContentTypes:$false -Connection $Connection
Set-PnPList -Identity Prosjektkolonnekonfigurasjon -EnableContentTypes:$false -Connection $Connection
Set-PnPList -Identity Fasesjekkliste -EnableContentTypes:$false -Connection $Connection
Set-PnPList -Identity Konfigurasjon -EnableContentTypes:$false -Connection $Connection
Set-PnPList -Identity Listeinnhold -EnableContentTypes:$false -Connection $Connection
Set-PnPList -Identity Porteføljevisninger -EnableContentTypes:$false -Connection $Connection
Set-PnPList -Identity Prosjektkolonner -EnableContentTypes:$false -Connection $Connection
Set-PnPList -Identity Ressursallokering -EnableContentTypes:$false -Connection $Connection