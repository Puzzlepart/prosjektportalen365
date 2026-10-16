#Requires -Version 7.0
<#
.SYNOPSIS
  Setter opp Prosjektportalen Assistenten i DIN tenant: Key Vault-secrets, tilgang for assistent-appen,
  admin-consent og ferdig konfigurasjon til Prosjektportalen.

.DESCRIPTION
  Kilde: https://github.com/Puzzlepart/prosjektportalen365 (Install/Scripts/Setup-PPAssistant.ps1). Versjon 1.2.
  Siste versjon: https://raw.githubusercontent.com/Puzzlepart/prosjektportalen365/main/Install/Scripts/Setup-PPAssistant.ps1

  Prosjektportalen Assistenten driftes av Prosjektportalen-teamet. Du tar med deg egne Azure AI Foundry-
  modeller (BYO) og egen Key Vault (eksisterende eller ny). Skriptet:
    1. validerer Foundry-endepunktet og tester chat-deploymenten (ett lite kall)
    2. finner tenant-id fra hub-URL-en (via <navn>.onmicrosoft.com - aldri e-postdomenet)
    3. gir admin-consent for «Prosjektportalen Assistent» (åpner nettleseren ved behov). Samme godkjenning
       dekker API-appens SharePoint-tilgang og Graph-tillatelsen Tasks.Read (Planner-oppgaver i prosjektet);
       mangler Tasks.Read-grantet hos en tidligere onboardet tenant, ber skriptet om consent på nytt
    4. skriver secretene apiKey/apiBase/modelName (+ *Images) til Key Vault - kun ved endring
    5. gir assistent-appen rollen Key Vault Secrets User på vaulten
    6. rapporterer SharePoint-tilgangen. «Sett som prosjektlogo» krever AllSites.FullControl, som
       IKKE deles ut som standard - bruk -GrantSharePointFullControl om dere vil ha funksjonen.
    7. skriver ut AssistantConfig-JSON du limer inn i «Globale innstillinger», og informasjonen
       Prosjektportalen-teamet trenger for å registrere tenanten din. Skrives ut i begge moduser.

  Uten AI-parametrene kjører skriptet KUN steg 3, 6 og 7. Det er modusen for en virksomhet som
  allerede er satt opp og bare trenger fornyet godkjenning - typisk Graph Tasks.Read for
  Planner-oppgaver - eller vil slå logo-funksjonen av og på.

  Skriptet oppretter IKKE Foundry-ressurser/deployments med mindre du eksplisitt ber om det med
  -ProvisionFoundry, og det skriver IKKE til SharePoint. Trygt å kjøre flere ganger (idempotent).
  Skriver aldri ut nøkler.

  Med -ProvisionFoundry (opt-in) oppretter skriptet en Microsoft Foundry-ressurs (AIServices, S0) med
  deployments for de anbefalte modellene, i stedet for at du oppgir -ChatApiBase/-ChatApiKey/-ChatDeployment.
  Standard er chatmodellen gpt-5.6-terra og bildemodellen gpt-image-1.5 i swedencentral, som Data Zone
  Standard - forespørslene behandles da innenfor EU-datasonen. Forhåndssjekken kontrollerer at modellene
  finnes i regionen og at det er ledig kvote, før noe opprettes. Kan ikke bildemodellen settes opp som
  Data Zone (ikke tilgjengelig eller ikke kvote), settes den opp som Global Standard i stedet, og
  forhåndssjekken og oppsummeringen sier det. Chatmodellen faller aldri tilbake til Global Standard.
  Finnes ressursen eller deploymenten fra før, gjenbrukes den.
  Endepunkt og nøkkel hentes fra ressursen og skrives til Key Vault som ellers - du ser dem aldri.

  Før noe skrives kjører en forhåndssjekk, og deretter vises en oppsummering med de
  OPPLØSTE verdiene: hvilken tenant hub-URL-en peker på, hvilken konto du er logget inn som,
  hvilket abonnement, hvilken Key Vault og hvilke modeller. Det er stedet du oppdager at du er
  logget inn i feil tenant, eller er i ferd med å skrive secrets til feil kundes vault.
  Ingenting er endret før du har svart ja.

.PARAMETER HubUrl
  URL til porteføljeområdet (hub-siten) i Prosjektportalen, f.eks. https://kontoso.sharepoint.com/sites/pp365
.PARAMETER KeyVaultName
  Navn på Key Vault (eksisterende eller ny). Standard: pp365-<tenantnavn>-kv. Opprettes automatisk hvis den
  mangler (i -ResourceGroupName, standard rg-prosjektportalen, som også opprettes ved behov). Bruk -NoCreate for å
  nekte opprettelse.
.PARAMETER ChatApiBase
  Ressurs-roten til Azure AI Foundry/OpenAI, f.eks. https://<ressurs>.services.ai.azure.com (UTEN /openai/v1).
  Utelates denne (sammen med -ChatApiKey og -ChatDeployment), kjører skriptet KUN godkjenninger
  og tilgangsomfang - Key Vault, secrets og modelltest hoppes over. Det er modusen en virksomhet
  som allerede er satt opp trenger.
.PARAMETER ChatApiKey
  API-nøkkel (SecureString). Bruk: (Read-Host -AsSecureString "Chat-nøkkel")
.PARAMETER ChatDeployment
  Deployment-navn for chatmodellen (gpt-5-familien anbefales; navnet må inneholde «gpt-5» for filvedlegg).
.PARAMETER GrantSharePointFullControl
  Gir appen AllSites.FullControl, som slår på «sett som prosjektlogo». Opt-in: uten den endres
  ingen SharePoint-tilgang, den bare rapporteres.
.PARAMETER RemoveSharePointFullControl
  Fjerner AllSites.FullControl igjen.
.PARAMETER Preflight
  Kjør kun forhåndssjekken og skriv ut sjekklista og oppsummeringen av hva som ville blitt gjort.
  Endrer ingenting og spør ikke. Avslutningskode 1 hvis noe mangler.
.PARAMETER SkipConfirmation
  Hopp over oppsummeringen og bekreftelsen. For uovervåkede kjøringer.
.PARAMETER ImagesApiBase
  Valgfritt: ressurs-rot for bildemodellen (gpt-image). Alle tre Images-parametre må gis sammen.
.PARAMETER ProvisionFoundry
  Opt-in: opprett Microsoft Foundry-ressurs og deployments med anbefalte modeller. Kan ikke kombineres
  med -ChatApi*/-ChatDeployment/-Images*. Krever Contributor på ressursgruppen (eller abonnementet).
.PARAMETER FoundryName
  Navn på Foundry-ressursen (også subdomenet i endepunktet, globalt unikt). Standard: pp365-<tenantnavn>-ai.
  Finnes en ressurs med navnet i abonnementet fra før, gjenbrukes den.
.PARAMETER FoundryLocation
  Region for Foundry-ressursen. Standard: swedencentral, som har både chat- og bildemodellene.
.PARAMETER FoundryDeploymentType
  DataZoneStandard (standard: behandling innenfor regionens datasone, EU for swedencentral),
  GlobalStandard (størst kvote, men forespørslene kan behandles i alle Azure-regioner, også utenfor EU)
  eller Standard (behandling i regionen).
.PARAMETER FoundryChatModel
  Chatmodell. Standard: gpt-5.6-terra. Deploymenten får samme navn som modellen.
.PARAMETER FoundryChatCapacity
  Kapasitet for chat-deploymenten, i tusen tokens per minutt. Standard: 100.
.PARAMETER FoundryImagesModel
  Bildemodell (brukes til logoforslag). Standard: gpt-image-1.5. Kan den ikke settes opp i det hele
  tatt, hoppes den over med en advarsel - eller stopper forhåndssjekken, hvis den er oppgitt eksplisitt.
.PARAMETER NoFoundryImages
  Ikke sett opp bildemodell. Logoforslag blir da utilgjengelig; alt annet virker.
.PARAMETER FoundryImagesLocation
  Valgfritt: egen region for bildemodellen. Da opprettes en egen ressurs, <FoundryName>-img.
  Standard: samme som -FoundryLocation.
.PARAMETER FoundryImagesCapacity
  Kapasitet for bilde-deploymenten. Standard: 1.
.PARAMETER FoundryImagesDeploymentType
  Deploymenttype for bildemodellen. Standard: samme som -FoundryDeploymentType, med fallback til
  GlobalStandard om den ikke kan settes opp slik. Oppgis den, brukes den uten fallback - f.eks.
  -FoundryImagesDeploymentType DataZoneStandard for å kreve at også bildene behandles i EU.

.EXAMPLE
  ./Setup-PPAssistant.ps1 -HubUrl https://kontoso.sharepoint.com/sites/pp365 -KeyVaultName kv-kontoso-pp365 `
    -ChatApiBase https://kontoso-ai.services.ai.azure.com -ChatApiKey (Read-Host -AsSecureString "Chat-nøkkel") `
    -ChatDeployment gpt-5.6 -ImagesApiBase https://kontoso-img.services.ai.azure.com `
    -ImagesApiKey (Read-Host -AsSecureString "Bilde-nøkkel") -ImagesDeployment gpt-image-1.5 -CustomerName "Kontoso AS"

.EXAMPLE
  ./Setup-PPAssistant.ps1 -HubUrl https://kontoso.sharepoint.com/sites/pp365 -ProvisionFoundry -CustomerName "Kontoso AS"
  # Oppretter Foundry-ressursen pp365-kontoso-ai i swedencentral med gpt-5.6-terra og gpt-image-1.5
  # (Data Zone Standard, behandling i EU), og fortsetter med Key Vault, secrets og godkjenninger som
  # vanlig. Legg til -Preflight for å se om modellene finnes i regionen og om det er kvote, uten å
  # endre noe.

.EXAMPLE
  ./Setup-PPAssistant.ps1 -HubUrl https://kontoso.sharepoint.com/sites/pp365
  # Kun godkjenninger: fornyer admin-consent om noe mangler og rapporterer SharePoint-tilgangen.
  # Rører ikke Key Vault eller secrets. Bruk denne når assistenten allerede er satt opp.

.EXAMPLE
  ./Setup-PPAssistant.ps1 -HubUrl https://kontoso.sharepoint.com/sites/pp365 -Preflight
  # Kun forhåndssjekk: kontrollerer tenant, innlogging, Key Vault og godkjenninger, skriver ut
  # sjekklista og oppsummeringen av hva som ville blitt gjort, og avslutter. Endrer ingenting.

.EXAMPLE
  ./Setup-PPAssistant.ps1 -HubUrl https://kontoso.sharepoint.com/sites/pp365 -GrantSharePointFullControl
  # Slår på «sett som prosjektlogo». -RemoveSharePointFullControl slår den av igjen.

.EXAMPLE
  ./Setup-PPAssistant.ps1 -HubUrl ... -ResourceGroupName rg-pp365 -Location swedencentral ... -WhatIf   # oppretter vault + RG ved behov
#>
[CmdletBinding(SupportsShouldProcess)]
param(
  [Parameter(Mandatory)] [ValidatePattern('^https://[^/]+\.sharepoint\.com/sites/[^/?#]+/?$')] [string] $HubUrl,
  [ValidatePattern('^[A-Za-z][A-Za-z0-9-]{1,22}[A-Za-z0-9]$')] [string] $KeyVaultName,   # default: pp365-<tenant>-kv
  [string] $ResourceGroupName = 'rg-prosjektportalen',
  [string] $Location = 'norwayeast',
  [switch] $NoCreate,                      # ikke opprett vault/ressursgruppe som mangler
  [string] $SubscriptionId,

  # AI-parametrene er valgfrie, men må gis sammen. Utelates de, kjører skriptet i
  # CONSENT-MODUS: kun godkjenninger og tilgangsomfang, ingen Key Vault og ingen secrets.
  # Det er det en virksomhet som allerede er satt opp trenger - da skal den ikke måtte grave
  # fram API-nøkkelen sin bare for å fornye en godkjenning.
  [string] $ChatApiBase,
  [securestring] $ChatApiKey,
  [string] $ChatDeployment,

  [string] $ImagesApiBase,
  [securestring] $ImagesApiKey,
  [string] $ImagesDeployment,

  # Opt-in: opprett Foundry-ressurs og deployments i stedet for å oppgi -ChatApi*/-Images*.
  # Uten bryteren opprettes aldri noe i Foundry.
  [switch] $ProvisionFoundry,
  [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9-]{0,58}[A-Za-z0-9]$')] [string] $FoundryName,   # default: pp365-<tenant>-ai
  [ValidatePattern('^[a-z0-9]+$')] [string] $FoundryLocation = 'swedencentral',
  # Data Zone som standard: Global Standard kan behandle forespørslene utenfor EU, og det skal
  # være et bevisst valg - ikke noe kunden arver fra skriptet.
  [ValidateSet('GlobalStandard', 'DataZoneStandard', 'Standard')] [string] $FoundryDeploymentType = 'DataZoneStandard',
  [string] $FoundryChatModel = 'gpt-5.6-terra',
  [ValidateRange(1, 10000)] [int] $FoundryChatCapacity = 100,
  [string] $FoundryImagesModel = 'gpt-image-1.5',
  [switch] $NoFoundryImages,
  [ValidatePattern('^[a-z0-9]+$')] [string] $FoundryImagesLocation,
  [ValidateRange(1, 1000)] [int] $FoundryImagesCapacity = 1,
  [ValidateSet('GlobalStandard', 'DataZoneStandard', 'Standard')] [string] $FoundryImagesDeploymentType,   # default: -FoundryDeploymentType

  [string] $TenantId,
  [string] $CustomerName,
  [switch] $SkipConsent,
  [switch] $ForceConsent,
  # Opt-in. Uten denne bryteren endres ingen SharePoint-tilgang, og «sett som prosjektlogo»
  # er utilgjengelig. Alt annet i assistenten virker.
  [switch] $GrantSharePointFullControl,
  # Utgått: å hoppe over er nå standard. Beholdt slik at eksisterende onboarding-skript ikke
  # feiler på en ukjent parameter. Settes den, vinner den over -GrantSharePointFullControl.
  [Alias('SkipSharePointManage')]
  [switch] $SkipSharePointFullControl,
  # Fjerner AllSites.FullControl igjen. Slår av «sett som prosjektlogo»; alt annet virker.
  [switch] $RemoveSharePointFullControl,
  [switch] $SkipModelTest,
  # Kjør kun forhåndssjekken, skriv ut sjekklista og avslutt. Endrer ingenting.
  # Avslutningskoden er 1 hvis noe mangler, 0 ellers - brukbart i en pipeline.
  [switch] $Preflight,
  # Hopp over oppsummeringen og bekreftelsesspørsmålet. For uovervåkede kjøringer.
  # Bruk den ikke når du kjører mot en kundetenant for første gang - oppsummeringen er
  # nettopp der du oppdager at du er logget inn feil sted.
  [switch] $SkipConfirmation
)

$ErrorActionPreference = 'Stop'

# --- Konstanter (Prosjektportalen-teamets apper) ---
$AssistantAppId  = 'b999a3f6-a817-41f9-a2ec-f695f59151f5'   # «Prosjektportalen Assistent» (klient)
$ApiAppId        = '1bf9aa43-3416-493d-8709-b222cf5ac32a'   # «Prosjektportalen Assistent API»
$ApiScope        = "api://$ApiAppId/Assistant.Access"
$ConsentRedirect = 'https://pp365-ai-d2dge4fqc2bhbba9.norwayeast-01.azurewebsites.net/consent-done'
$SharePointAppId = '00000003-0000-0ff1-ce00-000000000000'
$GraphAppId      = '00000003-0000-0000-c000-000000000000'   # Microsoft Graph (Tasks.Read for Planner-oppgaver)
$HandoffMail     = 'setup@prosjektportalen.no'
$Graph           = 'https://graph.microsoft.com/v1.0'
$CogApiVersion   = '2025-06-01'   # Microsoft.CognitiveServices (allowProjectManagement krever >= 2025-04-01-preview)
$RpApiVersion    = '2021-04-01'   # registrering av ressursleverandøren

# ---------------------------------------------------------------------------
# Forhåndssjekk
#
# Hver sjekk REGISTRERER resultatet sitt i stedet for å kaste ved første feil.
# Da viser EN kjøring alt som mangler, framfor at du retter en ting, kjører på
# nytt og får neste vegg. MANGLER stopper kjøringen (etter at alle sjekker har
# gått), ADVARSEL gjør det ikke. Mønsteret er lånt fra bestillingsportalens
# deploy.ps1.
# ---------------------------------------------------------------------------
$script:Sjekker = @()

function Add-PPCheck {
  param(
    [Parameter(Mandatory)] [string] $Navn,
    [Parameter(Mandatory)] [ValidateSet('OK', 'MANGLER', 'ADVARSEL', 'HOPPET OVER', 'UKJENT')] [string] $Status,
    [string] $Detalj = '',
    [string] $Fiks = ''
  )
  $script:Sjekker += [pscustomobject]@{ Navn = $Navn; Status = $Status; Detalj = $Detalj; Fiks = $Fiks }
}

# Skriver ut sjekklista og returnerer antall MANGLER.
function Show-PPChecklist {
  Write-Host ''
  Write-Host '#################### FORHÅNDSSJEKK ####################' -ForegroundColor Magenta
  foreach ($sjekk in $script:Sjekker) {
    $farge = switch ($sjekk.Status) {
      'OK'          { 'Green' }
      'MANGLER'     { 'Red' }
      'ADVARSEL'    { 'Yellow' }
      'HOPPET OVER' { 'DarkGray' }
      'UKJENT'      { 'Yellow' }
    }
    $linje = '  [{0,-11}] {1}' -f $sjekk.Status, $sjekk.Navn
    if ($sjekk.Detalj) { $linje += " - $($sjekk.Detalj)" }
    Write-Host $linje -ForegroundColor $farge
    if ($sjekk.Fiks) { Write-Host "               Fiks: $($sjekk.Fiks)" -ForegroundColor Cyan }
  }
  $mangler  = @($script:Sjekker | Where-Object { $_.Status -eq 'MANGLER' })
  $advarsler = @($script:Sjekker | Where-Object { $_.Status -in @('ADVARSEL', 'UKJENT') })
  $ok = @($script:Sjekker | Where-Object { $_.Status -eq 'OK' })
  Write-Host ''
  Write-Host ('  {0} mangler, {1} advarsler, {2} ok' -f $mangler.Count, $advarsler.Count, $ok.Count) -ForegroundColor $(if ($mangler.Count -gt 0) { 'Red' } elseif ($advarsler.Count -gt 0) { 'Yellow' } else { 'Green' })
  Write-Host '########################################################' -ForegroundColor Magenta
  Write-Host ''
  return $mangler.Count
}

<#
  Oppsummering før noe skrives, og et bekreftelsesspørsmål.

  Poenget er dobbeltverifisering: her står de OPPLØSTE verdiene - hvilken tenant hub-URL-en
  faktisk peker på, hvilken konto du er logget inn som, hvilket abonnement, hvilken vault
  (og om den finnes fra før), hvilke Foundry-endepunkt og deployments. Det er stedet du
  oppdager at du er logget inn i feil tenant, eller er i ferd med å skrive secrets til en
  vault som tilhører en annen kunde.

  Alt over dette punktet er lesing. Første skriving skjer etter at du har svart ja.
#>
function Confirm-PPSetup($Tenant, $AzContext, $VaultFinnes, $Consent, $SharePointScope) {
  if ($SkipConfirmation) {
    Write-Host 'Hopper over bekreftelsen (-SkipConfirmation)' -ForegroundColor Yellow
    return
  }

  Show-PPSummary $Tenant $AzContext $VaultFinnes $Consent $SharePointScope
  Write-Host 'Kontroller spesielt tenant, konto og Key Vault-navn over.' -ForegroundColor Yellow
  $svar = Read-Host 'Fortsett? ( j / n )'
  if ($svar -notin @('j', 'J', 'y', 'Y')) {
    Write-Host 'Avbrutt. Ingenting er endret.' -ForegroundColor Yellow
    exit 0
  }
  Write-Host 'Bekreftet - starter.' -ForegroundColor Green
}

# Oppsummeringen alene. Brukes av Confirm-PPSetup og av -Preflight, som viser hva som ville
# blitt gjort uten å spørre.
function Show-PPSummary($Tenant, $AzContext, $VaultFinnes, $Consent, $SharePointScope) {
  Write-Host ''
  Write-Host '#################### OPPSUMMERING ####################' -ForegroundColor Magenta
  Write-Host ''
  $modus = if ($ProvisionFoundry) { 'FULLT OPPSETT + MICROSOFT FOUNDRY (modeller, Key Vault, secrets, godkjenninger)' }
           elseif ($fulltOppsett) { 'FULLT OPPSETT (Key Vault, secrets, godkjenninger)' }
           else { 'KUN GODKJENNINGER (ingen Key Vault, ingen secrets)' }
  Write-Host ('  Modus:                {0}' -f $modus) -ForegroundColor Cyan
  Write-Host ''
  Write-Host '  Koblet til:' -ForegroundColor Yellow
  Write-Host "    Hub-URL:            $HubUrl"
  Write-Host "    Entra-tenant:       $($Tenant.Name).onmicrosoft.com ($($Tenant.Id))"
  Write-Host "    Innlogget som:      $($AzContext.Account.Id)"
  Write-Host "    Abonnement:         $($AzContext.Subscription.Name) ($($AzContext.Subscription.Id))"
  Write-Host ''
  Write-Host '  Nåværende tilstand:' -ForegroundColor Yellow
  Write-Host "    Admin-consent:      $Consent"
  Write-Host "    SharePoint-scope:   $SharePointScope"
  Write-Host ''
  Write-Host $(if ($Preflight) { '  Dette ville blitt gjort:' } else { '  Dette blir gjort:' }) -ForegroundColor Yellow

  function Write-PPPlan([string] $Merkelapp, [string] $Verdi, [bool] $Hoppet = $false) {
    if ($Hoppet) { Write-Host ('    {0,-20}(hoppes over)' -f "$($Merkelapp):") -ForegroundColor DarkGray }
    else { Write-Host ('    {0,-20}{1}' -f "$($Merkelapp):", $Verdi) }
  }

  Write-PPPlan 'Admin-consent' $(if ($ForceConsent) { 'Ber om godkjenning på nytt (-ForceConsent)' } else { 'Kun hvis noe mangler' }) $SkipConsent
  if ($ProvisionFoundry) {
    foreach ($konto in $script:FoundryKontoer.Values) {
      Write-PPPlan 'Foundry-ressurs' ('{0} ({1}) - {2}' -f $konto.Navn, $konto.Location, $(if ($konto.Finnes) { 'finnes, gjenbrukes' } else { "OPPRETTES i $ResourceGroupName" }))
    }
    foreach ($d in $script:FoundryPlan) {
      $status = if ($d.Finnes) { "finnes ($($d.Type)), gjenbrukes" } else { "OPPRETTES ($($d.Type), kapasitet $($d.Kapasitet))" }
      Write-PPPlan $(if ($d.Rolle -eq 'Chat') { 'Chatmodell' } else { 'Bildemodell' }) ('{0} på {1} - {2}' -f "$($d.Modell) $($d.Versjon)".Trim(), $d.Konto, $status)
    }
    if (-not $hasImages) { Write-PPPlan 'Bildemodell' '' $true }
    foreach ($d in $script:FoundryPlan) {
      Write-PPPlan $(if ($d.Rolle -eq 'Chat') { 'Behandling, chat' } else { 'Behandling, bilder' }) $(switch ($d.Type) {
        'GlobalStandard'   { 'Global Standard - forespørslene kan behandles i alle Azure-regioner, også utenfor EU' }
        'DataZoneStandard' { 'Data Zone Standard - forespørslene behandles innenfor regionens datasone (EU)' }
        'Standard'         { 'Standard - forespørslene behandles i regionen' }
      })
    }
  }
  if ($fulltOppsett) {
    Write-PPPlan 'Key Vault' ('{0} ({1}) - {2}' -f $script:VaultName, "$ResourceGroupName/$Location", $(if ($VaultFinnes) { 'finnes, gjenbrukes' } else { 'OPPRETTES' }))
    Write-PPPlan 'Secrets' $(if ($hasImages) { 'apiKey, apiBase, modelName + de tre Images-variantene' } else { 'apiKey, apiBase, modelName' })
    if (-not $ProvisionFoundry) {
      Write-PPPlan 'Chatmodell' ("$($script:ChatBase) -> $ChatDeployment")
      if ($hasImages) { Write-PPPlan 'Bildemodell' ("$($script:ImagesBase) -> $ImagesDeployment") }
    }
    Write-PPPlan 'Vault-tilgang' 'Key Vault Secrets User til «Prosjektportalen Assistent»'
  } else {
    Write-PPPlan 'Key Vault' '' $true
    Write-PPPlan 'Secrets' '' $true
  }
  if ($RemoveSharePointFullControl) { Write-PPPlan 'SharePoint' 'FJERNER AllSites.FullControl' }
  elseif ($GrantSharePointFullControl -and -not $SkipSharePointFullControl) { Write-PPPlan 'SharePoint' 'Gir AllSites.FullControl (for «sett som prosjektlogo»)' }
  else { Write-PPPlan 'SharePoint' 'Ingen endring - rapporteres bare' }

  Write-Host ''
  Write-Host '######################################################' -ForegroundColor Magenta
}

function Write-Step([string] $Text) { Write-Host "`n== $Text" -ForegroundColor Cyan }
function Write-Ok([string] $Text)   { Write-Host "   $Text" -ForegroundColor Green }
function Write-Info([string] $Text) { Write-Host "   $Text" }

function Test-PPPrerequisites {
  Write-Step 'Forutsetninger'
  $hasImages = [bool]$ImagesApiBase -or [bool]$ImagesApiKey -or [bool]$ImagesDeployment
  if ($ProvisionFoundry) { $hasImages = [bool]$FoundryImagesModel -and -not $NoFoundryImages }
  elseif ($hasImages -and -not ($ImagesApiBase -and $ImagesApiKey -and $ImagesDeployment)) {
    throw 'Bildemodell: -ImagesApiBase, -ImagesApiKey og -ImagesDeployment må gis sammen (eller ingen av dem).'
  }
  # Az.KeyVault trengs bare når vi faktisk skal skrive secrets.
  $requiredModules = if ($fulltOppsett) { @('Az.Accounts', 'Az.KeyVault', 'Az.Resources') } else { @('Az.Accounts', 'Az.Resources') }
  $missing = $requiredModules | Where-Object { -not (Get-Module -ListAvailable -Name $_) }
  if ($missing) {
    throw "Mangler PowerShell-moduler: $($missing -join ', '). Installer med: Install-Module $($missing -join ', ') -Scope CurrentUser"
  }
  Write-Ok 'Parametre OK, Az-moduler installert'
  return $hasImages
}

function Import-PPAzModules {
  # Lastes først når Azure trengs, slik at parameterfeil rapporteres før tunge moduler.
  try {
    Import-Module Az.Accounts, Az.KeyVault, Az.Resources -ErrorAction Stop -WarningAction SilentlyContinue
  } catch {
    throw "Klarte ikke å laste Az-modulene ($($_.Exception.Message)). Prøv en ny pwsh-sesjon, eller oppdater: Update-Module Az.Accounts, Az.KeyVault, Az.Resources -Force"
  }

  # `Import-Module -ErrorAction Stop` fanger ikke alt. Er en modul installert, men har en
  # ødelagt avhengighet, kommer feilen som en ikke-terminerende assembly-lastefeil - og
  # skriptet ville ellers fortsatt helt til en forvirrende «Get-AzContext finnes ikke».
  foreach ($c in 'Get-AzContext', 'Get-AzADServicePrincipal', 'Invoke-AzRestMethod', 'Get-AzKeyVault') {
    if (-not (Get-Command $c -ErrorAction SilentlyContinue)) {
      throw "Az-modulene ser installerte ut, men $c finnes ikke - installasjonen er sannsynligvis ødelagt. Prøv: Install-Module Az.Accounts, Az.KeyVault, Az.Resources -Force -Scope CurrentUser"
    }
  }
}

function Assert-PPApiBase([string] $Value, [string] $Name) {
  $uri = $null
  if (-not [Uri]::TryCreate($Value, [UriKind]::Absolute, [ref]$uri) -or $uri.Scheme -ne 'https') {
    throw "$Name må være en https-URL."
  }
  if ($Value -match '/openai|/deployments|api-version' -or ($uri.AbsolutePath -notin @('', '/')) -or $uri.Query) {
    throw "$Name skal være ressurs-roten, f.eks. https://<ressurs>.services.ai.azure.com (uten /openai/v1, deployments eller api-version). Fikk: $Value"
  }
  if ($uri.Host -notmatch '\.(services\.ai\.azure\.com|openai\.azure\.com|cognitiveservices\.azure\.com)$') {
    Write-Warning "$Name har uvanlig host '$($uri.Host)' - forventet *.services.ai.azure.com / *.openai.azure.com."
  }
  return $Value.TrimEnd('/')
}

function Test-PPChatDeployment([string] $Base, [securestring] $Key, [string] $Deployment, [int] $Attempts = 1) {
  Write-Step 'Tester chat-deployment (ett lite kall)'
  $plain = [System.Net.NetworkCredential]::new('', $Key).Password
  try {
    $body = @{ model = $Deployment; messages = @(@{ role = 'user'; content = 'ping' }); max_completion_tokens = 5 } | ConvertTo-Json -Depth 4
    for ($i = 1; ; $i++) {
      try {
        Invoke-RestMethod -Method Post -Uri "$Base/openai/v1/chat/completions" -Headers @{ 'api-key' = $plain } -ContentType 'application/json' -Body $body | Out-Null
        Write-Ok "Deployment '$Deployment' svarer på $Base"
        return
      } catch {
        $status = $_.Exception.Response.StatusCode.value__
        # En nyopprettet ressurs/deployment svarer 401/404 en stund før den er klar.
        if ($i -lt $Attempts -and $status -in @(401, 404)) {
          if ($i -eq 1) { Write-Info 'Venter på at den nye deploymenten skal bli klar ...' }
          Start-Sleep -Seconds 15
          continue
        }
        $hint = switch ($status) { 401 { 'feil API-nøkkel' } 404 { 'feil deployment-navn eller ressurs-rot' } default { $_.Exception.Message } }
        throw "Chat-deploymenten svarte ikke ($status): $hint"
      }
    }
  } finally { $plain = $null }
}

function Resolve-PPTenantId([string] $Url) {
  Write-Step 'Finner tenant'
  $hubHost = ([Uri]$Url).Host
  if ($hubHost -like '*-admin.sharepoint.com') { throw 'Bruk hub-sitens URL, ikke admin-senteret.' }
  $tenantName = $hubHost -replace '\.sharepoint\.com$', ''
  if ($TenantId) { Write-Info "Bruker oppgitt -TenantId $TenantId"; return @{ Id = $TenantId; Name = $tenantName } }
  $cfg = Invoke-RestMethod "https://login.microsoftonline.com/$tenantName.onmicrosoft.com/v2.0/.well-known/openid-configuration"
  $id = ($cfg.issuer -split '/')[3]
  Write-Ok "$tenantName.onmicrosoft.com -> $id"
  return @{ Id = $id; Name = $tenantName }
}

function Connect-PPAzure([string] $Tenant) {
  Write-Step 'Logger inn i Azure'
  # Innlogging skal skje også under -WhatIf. `Connect-AzAccount` støtter selv ShouldProcess,
  # så uten dette ble innloggingen bare simulert - og skriptet leste videre på en gammel
  # kontekst mot en annen tenant og avbrøt. Å logge inn endrer ingenting i tenanten; det er
  # forutsetningen for i det hele tatt å kunne lese status. Vi nuller preferansen i funksjonens
  # eget scope framfor å sende -WhatIf:$false, som ville feilet om cmdleten manglet parameteren.
  $WhatIfPreference = $false
  $ctx = Get-AzContext -ErrorAction SilentlyContinue
  if (-not $ctx -or $ctx.Tenant.Id -ne $Tenant -or ($SubscriptionId -and $ctx.Subscription.Id -ne $SubscriptionId)) {
    $p = @{ Tenant = $Tenant }; if ($SubscriptionId) { $p.Subscription = $SubscriptionId }
    Connect-AzAccount @p | Out-Null
    $ctx = Get-AzContext
  }
  if ($ctx.Tenant.Id -ne $Tenant) { throw "Innlogget i tenant $($ctx.Tenant.Id), men hub-siten tilhører $Tenant. Avbryter." }
  Write-Ok "Tenant $($ctx.Tenant.Id), abonnement '$($ctx.Subscription.Name)'"
}

function Invoke-PPGraph([string] $Method, [string] $Uri, $Body) {
  # Samme grunn som i Connect-PPAzure: alle skrivende kall er allerede gated av ShouldProcess
  # hos kalleren, så det eneste som når hit under -WhatIf er GET-ene statusrapporten bygger
  # på. Uten dette ville -WhatIf ikke fått lest noe, og rapporten meldt «MANGLER» på alt.
  $WhatIfPreference = $false
  $p = @{ Method = $Method; Uri = $Uri }
  if ($Body) { $p.Payload = ($Body | ConvertTo-Json -Depth 5) }
  $r = Invoke-AzRestMethod @p
  if ($r.StatusCode -ge 400) { throw "Graph $Method $Uri -> $($r.StatusCode): $($r.Content)" }
  if ($r.Content) { return $r.Content | ConvertFrom-Json }
}

function Invoke-PPArm([string] $Method, [string] $Path, $Body, [switch] $AllowNotFound) {
  # Som Invoke-PPGraph: skrivende kall er gated av ShouldProcess hos kalleren.
  $WhatIfPreference = $false
  $p = @{ Method = $Method; Path = $Path }
  if ($Body) { $p.Payload = ($Body | ConvertTo-Json -Depth 8) }
  $r = Invoke-AzRestMethod @p
  if ($AllowNotFound -and $r.StatusCode -eq 404) { return $null }
  if ($r.StatusCode -ge 400) {
    $melding = try { $e = ($r.Content | ConvertFrom-Json).error; "$($e.code): $($e.message)" } catch { $r.Content }
    throw "ARM $Method $($Path -replace '\?.*$', '') -> $($r.StatusCode) $melding"
  }
  if ($r.Content) { return $r.Content | ConvertFrom-Json }
}

function Get-PPGrants([string] $ClientSpId) {
  (Invoke-PPGraph GET "$Graph/oauth2PermissionGrants?`$filter=clientId eq '$ClientSpId' and consentType eq 'AllPrincipals'").value
}

function Request-PPAdminConsent([string] $Tenant) {
  Write-Step 'Admin-consent'
  $assistantSp = Get-AzADServicePrincipal -ApplicationId $AssistantAppId -ErrorAction SilentlyContinue
  $apiSp       = Get-AzADServicePrincipal -ApplicationId $ApiAppId -ErrorAction SilentlyContinue
  $spSp        = Get-AzADServicePrincipal -ApplicationId $SharePointAppId
  $graphSp     = Get-AzADServicePrincipal -ApplicationId $GraphAppId

  # Tre grants må finnes: klient -> API (Assistant.Access), API -> SharePoint (OBO) og
  # API -> Graph med Tasks.Read (Planner-oppgaver, lagt til 2026-09-09). Det siste mangler hos
  # tenanter som ble onboardet før det, og fanges her så de får re-consent i stedet for «alt ok».
  $ok = $false
  if ($assistantSp -and $apiSp) {
    $clientGrants = Get-PPGrants $assistantSp.Id
    $apiGrants    = Get-PPGrants $apiSp.Id
    $hasScope = $clientGrants | Where-Object { $_.resourceId -eq $apiSp.Id -and ($_.scope -split ' ') -contains 'Assistant.Access' }
    $hasObo   = $apiGrants    | Where-Object { $_.resourceId -eq $spSp.Id }
    $hasGraph = $apiGrants    | Where-Object { $_.resourceId -eq $graphSp.Id -and ($_.scope -split ' ') -contains 'Tasks.Read' }
    $ok = [bool]$hasScope -and [bool]$hasObo -and [bool]$hasGraph
    if ($hasScope -and $hasObo -and -not $hasGraph) { Write-Info 'Consent finnes, men mangler Graph Tasks.Read (Planner-oppgaver) - ber om godkjenning på nytt.' }
  }

  if ($ok -and -not $ForceConsent) { Write-Ok 'Consent finnes allerede for begge apper (inkl. Tasks.Read)'; return $assistantSp }

  $url = "https://login.microsoftonline.com/$Tenant/adminconsent?client_id=$AssistantAppId&redirect_uri=$ConsentRedirect"
  Write-Info 'Godkjenn som administrator i nettleseren. Etter godkjenning vises en bekreftelsesside:'
  Write-Host "   $url" -ForegroundColor Yellow
  if (-not $PSCmdlet.ShouldProcess($Tenant, 'Åpne admin-consent i nettleser og vente på godkjenning')) { return $assistantSp }
  Start-Process $url

  $deadline = (Get-Date).AddMinutes(5)
  do {
    Start-Sleep 5
    $assistantSp = Get-AzADServicePrincipal -ApplicationId $AssistantAppId -ErrorAction SilentlyContinue
    $apiSp       = Get-AzADServicePrincipal -ApplicationId $ApiAppId -ErrorAction SilentlyContinue
    if ($assistantSp -and $apiSp) {
      $apiGrants = Get-PPGrants $apiSp.Id
      $hasScope = Get-PPGrants $assistantSp.Id | Where-Object { $_.resourceId -eq $apiSp.Id -and ($_.scope -split ' ') -contains 'Assistant.Access' }
      $hasObo   = $apiGrants | Where-Object { $_.resourceId -eq $spSp.Id }
      $hasGraph = $apiGrants | Where-Object { $_.resourceId -eq $graphSp.Id -and ($_.scope -split ' ') -contains 'Tasks.Read' }
      if ($hasScope -and $hasObo -and $hasGraph) { Write-Ok 'Consent registrert'; return $assistantSp }
    }
    Write-Host '   venter på consent ...'
  } while ((Get-Date) -lt $deadline)
  throw 'Fikk ikke bekreftet consent innen 5 minutter. Kjør skriptet igjen når godkjenningen er gjort.'
}

function Initialize-PPResourceGroup {
  if (Get-AzResourceGroup -Name $ResourceGroupName -ErrorAction SilentlyContinue) { return }
  if ($NoCreate) { throw "Ressursgruppen '$ResourceGroupName' finnes ikke, og -NoCreate er angitt." }
  if ($PSCmdlet.ShouldProcess($ResourceGroupName, "Opprette ressursgruppe i $Location")) {
    New-AzResourceGroup -Name $ResourceGroupName -Location $Location | Out-Null
    Write-Ok "Ressursgruppe '$ResourceGroupName' opprettet"
  }
}

function Set-PPKeyVault {
  Write-Step "Key Vault '$script:VaultName'"
  $vault = Get-AzKeyVault -VaultName $script:VaultName -ErrorAction SilentlyContinue
  if (-not $vault) {
    if ($NoCreate) { throw "Key Vault '$script:VaultName' finnes ikke, og -NoCreate er angitt." }
    if (Get-AzKeyVault -VaultName $script:VaultName -Location $Location -InRemovedState -ErrorAction SilentlyContinue) {
      throw "Navnet '$script:VaultName' er opptatt av en slettet (soft-deleted) vault. Gjenopprett den eller velg et annet navn med -KeyVaultName."
    }
    Initialize-PPResourceGroup
    if ($PSCmdlet.ShouldProcess($script:VaultName, "Opprette Key Vault (RBAC) i $ResourceGroupName/$Location")) {
      try {
        # Az.KeyVault >= 6 bruker RBAC som standard og har fjernet -EnableRbacAuthorization; eldre versjoner trenger flagget.
        $kvParams = @{ Name = $script:VaultName; ResourceGroupName = $ResourceGroupName; Location = $Location; Sku = 'Standard' }
        if ((Get-Command New-AzKeyVault).Parameters.ContainsKey('EnableRbacAuthorization')) { $kvParams.EnableRbacAuthorization = $true }
        $vault = New-AzKeyVault @kvParams
      } catch {
        if ($_.Exception.Message -match 'VaultAlreadyExists|already in use|is already taken') {
          throw "Key Vault-navnet '$script:VaultName' er opptatt (navn er globalt unike i Azure). Velg et annet med -KeyVaultName - og oppgi det til Prosjektportalen-teamet."
        }
        throw
      }
      Write-Ok 'Opprettet'
    } else { return $null }
  } else { Write-Ok "Finnes (RBAC: $($vault.EnableRbacAuthorization))" }
  if ($vault.NetworkAcls.DefaultAction -eq 'Deny') {
    Write-Warning 'Vaulten har nettverksbegrensning (Deny). Prosjektportalen-teamets tjeneste må kunne nå den - kontakt setup@prosjektportalen.no om hvitelisting.'
  }
  return $vault
}

function Grant-PPSelfSecretsOfficer($Vault) {
  # RBAC-vaults gir INGEN dataplan-tilgang som standard - heller ikke til den som opprettet den.
  if (-not $Vault.EnableRbacAuthorization) { return }
  $ctx = Get-AzContext
  $me = $null
  try {
    $me = if ($ctx.Account.Type -eq 'User') { (Get-AzADUser -SignedIn -ErrorAction Stop).Id }
          else { (Get-AzADServicePrincipal -ApplicationId $ctx.Account.Id -ErrorAction Stop).Id }
  } catch { Write-Warning "Fant ikke egen identitet ($($_.Exception.Message)) - hopper over selvtildeling."; return }
  if (-not $me) { return }
  $has = Get-AzRoleAssignment -ObjectId $me -Scope $Vault.ResourceId -RoleDefinitionName 'Key Vault Secrets Officer' -ErrorAction SilentlyContinue
  if ($has) { return }
  if ($PSCmdlet.ShouldProcess($Vault.VaultName, 'Tildele Key Vault Secrets Officer til deg selv (for å skrive secrets)')) {
    try {
      New-AzRoleAssignment -ObjectId $me -Scope $Vault.ResourceId -RoleDefinitionName 'Key Vault Secrets Officer' | Out-Null
      Write-Ok 'Key Vault Secrets Officer: tildelt deg selv (RBAC-propagering kan ta noen minutter - skriptet venter)'
      $script:SelfRoleJustAssigned = $true
    } catch {
      Write-Warning "Kunne ikke tildele deg selv Key Vault Secrets Officer ($($_.Exception.Message)). Krever Owner/User Access Administrator på vaulten."
    }
  }
}

function Set-PPSecret($Vault, [string] $Name, [string] $Value) {
  $current = Get-AzKeyVaultSecret -VaultName $Vault.VaultName -Name $Name -AsPlainText -ErrorAction SilentlyContinue
  if ($current -eq $Value) { Write-Info "$Name : uendret"; return }
  if (-not $PSCmdlet.ShouldProcess("$($Vault.VaultName)/$Name", 'Skrive secret')) { return }
  $attempt = 0
  while ($true) {
    try {
      Set-AzKeyVaultSecret -VaultName $Vault.VaultName -Name $Name -SecretValue (ConvertTo-SecureString $Value -AsPlainText -Force) | Out-Null
      Write-Ok "$Name : $(if ($null -eq $current) { 'opprettet' } else { 'oppdatert' })"
      return
    } catch {
      $isForbidden = $_.Exception.Message -match 'Forbidden|403'
      if ($isForbidden -and $attempt -lt 8) {
        $attempt++
        if ($attempt -eq 1) { Write-Info 'Venter på at Key Vault-rollen skal propagere ...' }
        Start-Sleep -Seconds 15
        continue
      }
      if ($isForbidden) { throw "Ingen skrivetilgang til vaulten etter venting. Gi deg selv rollen 'Key Vault Secrets Officer' på '$($Vault.VaultName)' og kjør igjen." }
      throw
    }
  }
}

function Set-PPKeyVaultSecrets($Vault, [bool] $HasImages) {
  Write-Step 'Secrets'
  Grant-PPSelfSecretsOfficer $Vault
  Set-PPSecret $Vault 'apiBase'   $script:ChatBase
  # Med -ProvisionFoundry og -WhatIf finnes ingen nøkkel ennå - ressursen er bare simulert.
  if ($ChatApiKey) { Set-PPSecret $Vault 'apiKey' ([System.Net.NetworkCredential]::new('', $ChatApiKey).Password) }
  else { Write-Info 'apiKey : hoppes over (nøkkelen finnes først når Foundry-ressursen er opprettet)' }
  Set-PPSecret $Vault 'modelName' $ChatDeployment
  if ($HasImages) {
    Set-PPSecret $Vault 'apiBaseImages'   $script:ImagesBase
    if ($ImagesApiKey) { Set-PPSecret $Vault 'apiKeyImages' ([System.Net.NetworkCredential]::new('', $ImagesApiKey).Password) }
    else { Write-Info 'apiKeyImages : hoppes over (nøkkelen finnes først når Foundry-ressursen er opprettet)' }
    Set-PPSecret $Vault 'modelNameImages' $ImagesDeployment
  } else {
    $aktiver = if ($ProvisionFoundry) { 'Se forhåndssjekken over for hvordan den kan settes opp.' } else { 'Kjør igjen med -Images* for å aktivere.' }
    Write-Warning "Ingen bildemodell satt opp - logo-generering vil rapportere ai_configuration_incomplete. $aktiver"
  }
  if (Get-AzKeyVaultSecret -VaultName $Vault.VaultName -Name 'apiVersion' -ErrorAction SilentlyContinue) {
    Write-Info 'apiVersion/apiVersionImages er ikke lenger i bruk (kan slettes).'
  }
}

function Grant-PPKeyVaultAccess($Vault, $AssistantSp) {
  Write-Step 'Tilgang for «Prosjektportalen Assistent» til vaulten'
  if (-not $AssistantSp) { throw 'Assistent-appen finnes ikke i tenanten ennå (consent mangler). Kjør uten -SkipConsent.' }
  if ($Vault.EnableRbacAuthorization) {
    $existing = Get-AzRoleAssignment -ObjectId $AssistantSp.Id -Scope $Vault.ResourceId -RoleDefinitionName 'Key Vault Secrets User' -ErrorAction SilentlyContinue
    if ($existing) { Write-Ok 'Key Vault Secrets User: finnes'; return }
    if ($PSCmdlet.ShouldProcess($Vault.VaultName, 'Tildele Key Vault Secrets User til assistent-appen')) {
      New-AzRoleAssignment -ObjectId $AssistantSp.Id -Scope $Vault.ResourceId -RoleDefinitionName 'Key Vault Secrets User' | Out-Null
      Write-Ok 'Key Vault Secrets User: tildelt (kan ta opptil ~10 min før den virker)'
    }
  } else {
    if ($PSCmdlet.ShouldProcess($Vault.VaultName, 'Sette access policy get,list for assistent-appen')) {
      Set-AzKeyVaultAccessPolicy -VaultName $Vault.VaultName -ObjectId $AssistantSp.Id -PermissionsToSecrets get, list | Out-Null
      Write-Ok 'Access policy (get, list): satt'
    }
  }
}

# ---------------------------------------------------------------------------
# Microsoft Foundry (-ProvisionFoundry)
#
# Bare ARM-REST via Invoke-AzRestMethod, så det trengs ingen ekstra Az-moduler.
# $script:FoundryKontoer er ressursene (én, eller to når bildemodellen ligger i en annen
# region), $script:FoundryPlan er deploymentene. Forhåndssjekken fyller inn hva som finnes og
# hvilken modellversjon som brukes; opprettelsen skjer først etter bekreftelsen.
# ---------------------------------------------------------------------------

# Finner modellversjonen som kan deployes med valgt deploymenttype i regionen. Foretrekker
# regionens standardversjon. Returnerer også kvotenavnet (usageName) for kvotesjekken.
function Resolve-PPFoundryModel([string] $Region, [string] $Model, [string] $Type) {
  $modeller = (Invoke-PPArm GET "/subscriptions/$($script:SubId)/providers/Microsoft.CognitiveServices/locations/$Region/models?api-version=$CogApiVersion").value
  $kandidater = @($modeller | Where-Object {
      $_.model.format -eq 'OpenAI' -and $_.model.name -eq $Model -and
      $_.model.lifecycleStatus -ne 'Deprecated' -and (@($_.model.skus.name) -contains $Type)
    })
  if ($kandidater.Count -eq 0) { return $null }
  $valgt = $kandidater | Where-Object { $_.model.isDefaultVersion } | Select-Object -First 1
  if (-not $valgt) { $valgt = $kandidater | Sort-Object { $_.model.version } -Descending | Select-Object -First 1 }
  $sku = $valgt.model.skus | Where-Object { $_.name -eq $Type } | Select-Object -First 1
  return [pscustomobject]@{ Version = $valgt.model.version; UsageName = $sku.usageName }
}

# Ledig kvote (limit - forbruk) for et kvotenavn i regionen, eller $null om den ikke finnes.
function Get-PPFoundryQuota([string] $Region, [string] $UsageName) {
  if (-not $UsageName) { return $null }
  $bruk = (Invoke-PPArm GET "/subscriptions/$($script:SubId)/providers/Microsoft.CognitiveServices/locations/$Region/usages?api-version=$CogApiVersion").value |
    Where-Object { $_.name.value -eq $UsageName } | Select-Object -First 1
  if (-not $bruk) { return $null }
  return [int]($bruk.limit - $bruk.currentValue)
}

# Kan modellen deployes som $Type i ressursens region, med nok kvote? Bare lesing. Ukjent kvote
# regnes som OK (Ledig = $null) - den rapporteres, men stopper ikke.
function Test-PPFoundryOption($Konto, $Deployment, [string] $Type) {
  $kapasitetParam = if ($Deployment.Rolle -eq 'Chat') { '-FoundryChatCapacity' } else { '-FoundryImagesCapacity' }
  $modell = Resolve-PPFoundryModel $Konto.Location $Deployment.Modell $Type
  if (-not $modell) {
    $fiks = if ($Deployment.Rolle -eq 'Images') {
      'Bildemodellene finnes ikke med alle deploymenttyper i alle regioner. Prøv en annen region (-FoundryImagesLocation), eller -NoFoundryImages for å sette opp uten bildemodell.'
    } else {
      'Velg en annen region (-FoundryLocation), en annen -FoundryDeploymentType eller en annen modell. Se modellkatalogen i Foundry-portalen.'
    }
    return [pscustomobject]@{ Ok = $false; Versjon = $null; Ledig = $null; Arsak = "$($Deployment.Modell) finnes ikke som $Type i $($Konto.Location)"; Fiks = $fiks }
  }
  $ledig = Get-PPFoundryQuota $Konto.Location $modell.UsageName
  if ($null -ne $ledig -and $ledig -lt $Deployment.Kapasitet) {
    $fiks = if ($ledig -gt 0) { "Kjør med $kapasitetParam $ledig, " } else { 'Prøv en annen region, ' }
    return [pscustomobject]@{ Ok = $false; Versjon = $modell.Version; Ledig = $ledig; Arsak = "ledig $Type-kvote for $($Deployment.Modell) er $ledig, ønsket $($Deployment.Kapasitet)"; Fiks = ($fiks + 'eller be om kvoteøkning under Management -> Quota i Foundry-portalen.') }
  }
  return [pscustomobject]@{ Ok = $true; Versjon = $modell.Version; Ledig = $ledig; Arsak = ''; Fiks = '' }
}

# En deployment som ikke kan opprettes, stopper kjøringen - unntatt bildemodellen når den bare er
# med som standard. Den er et tillegg (logoforslag), og da hoppes den over med en advarsel.
function Add-PPFoundryProblem($Deployment, [string] $Sjekk, [string] $Detalj, [string] $Fiks) {
  if ($Deployment.Rolle -eq 'Images' -and -not $script:BildeEksplisitt) {
    $Deployment.Hoppes = $true
    Add-PPCheck -Navn $Sjekk -Status 'ADVARSEL' -Detalj "$Detalj - bildemodellen hoppes over" -Fiks $Fiks
  } else {
    Add-PPCheck -Navn $Sjekk -Status 'MANGLER' -Detalj $Detalj -Fiks $Fiks
  }
}

<#
  Forhåndssjekk for -ProvisionFoundry. Bare lesing: er ressursleverandøren registrert, finnes
  ressursen fra før eller er navnet ledig, finnes modellen med valgt deploymenttype i regionen,
  og er det ledig kvote. Kvote er den vanligste veggen («Insufficient quota») og skal oppdages
  her, ikke midt i opprettelsen.
#>
function Test-PPFoundryPlan {
  $sub = $script:SubId
  $script:FoundryRpRegistrert = $false
  try {
    $rp = Invoke-PPArm GET "/subscriptions/$sub/providers/Microsoft.CognitiveServices?api-version=$RpApiVersion"
    $script:FoundryRpRegistrert = $rp.registrationState -eq 'Registered'
  } catch {}
  if ($script:FoundryRpRegistrert) {
    Add-PPCheck -Navn 'Ressursleverandør' -Status 'OK' -Detalj 'Microsoft.CognitiveServices er registrert'
  } else {
    Add-PPCheck -Navn 'Ressursleverandør' -Status 'ADVARSEL' -Detalj 'Microsoft.CognitiveServices er ikke registrert på abonnementet' -Fiks 'Skriptet registrerer den etter bekreftelsen. Krever Contributor på abonnementet.'
  }

  $alle = @()
  try { $alle = @((Invoke-PPArm GET "/subscriptions/$sub/providers/Microsoft.CognitiveServices/accounts?api-version=$CogApiVersion").value) } catch {}
  foreach ($konto in $script:FoundryKontoer.Values) {
    $sjekk = "Foundry-ressurs $($konto.Navn)"
    $eksisterende = $alle | Where-Object { $_.name -eq $konto.Navn } | Select-Object -First 1
    if ($eksisterende) {
      $konto.Finnes = $true
      $konto.Id = $eksisterende.id
      $rg = ($eksisterende.id -split '/')[4]
      if ($eksisterende.location -ne $konto.Location) { Write-Info "Foundry-ressursen '$($konto.Navn)' ligger i $($eksisterende.location), ikke $($konto.Location) - bruker den som den er." }
      $konto.Location = $eksisterende.location
      if ($eksisterende.kind -notin @('AIServices', 'OpenAI')) {
        Add-PPCheck -Navn $sjekk -Status 'MANGLER' -Detalj "finnes, men er av typen $($eksisterende.kind)" -Fiks 'Velg et annet navn med -FoundryName.'
      } elseif ($eksisterende.properties.disableLocalAuth) {
        Add-PPCheck -Navn $sjekk -Status 'MANGLER' -Detalj 'nøkkelbasert tilgang er slått av (disableLocalAuth)' -Fiks 'Assistenten bruker API-nøkkel. Slå på nøkler på ressursen, eller velg et annet navn med -FoundryName.'
      } else {
        Add-PPCheck -Navn $sjekk -Status 'OK' -Detalj "finnes i $rg ($($konto.Location)), gjenbrukes"
      }
    } else {
      $konto.Id = "/subscriptions/$sub/resourceGroups/$ResourceGroupName/providers/Microsoft.CognitiveServices/accounts/$($konto.Navn)"
      try {
        $ledig = Invoke-PPArm POST "/subscriptions/$sub/providers/Microsoft.CognitiveServices/checkDomainAvailability?api-version=$CogApiVersion" @{ subdomainName = $konto.Navn; type = 'Microsoft.CognitiveServices/accounts'; kind = 'AIServices' }
        if ($ledig.isSubdomainAvailable) {
          Add-PPCheck -Navn $sjekk -Status 'OK' -Detalj "opprettes i $ResourceGroupName ($($konto.Location))"
        } else {
          Add-PPCheck -Navn $sjekk -Status 'MANGLER' -Detalj 'navnet er opptatt' -Fiks 'Navnet blir subdomenet i endepunktet og er globalt unikt i Azure. Velg et annet med -FoundryName.'
        }
      } catch {
        Add-PPCheck -Navn $sjekk -Status 'UKJENT' -Detalj "kunne ikke sjekke om navnet er ledig ($($_.Exception.Message))"
      }
    }
  }

  foreach ($d in $script:FoundryPlan) {
    $konto = $script:FoundryKontoer[$d.Konto]
    $sjekk = if ($d.Rolle -eq 'Chat') { 'Foundry: chatmodell' } else { 'Foundry: bildemodell' }
    if ($konto.Finnes) {
      $eksisterende = Invoke-PPArm GET "$($konto.Id)/deployments/$($d.Modell)?api-version=$CogApiVersion" -AllowNotFound
      if ($eksisterende) {
        $d.Finnes = $true
        $d.Versjon = $eksisterende.properties.model.version
        # Eksisterende deployments gjenbrukes med typen de har - den styrer hvor forespørslene
        # behandles, så oppsummeringen skal vise den faktiske, ikke den ønskede.
        $onsketType = $d.Type
        if ($eksisterende.sku.name) { $d.Type = $eksisterende.sku.name }
        if ($eksisterende.properties.model.name -ne $d.Modell) {
          Add-PPCheck -Navn $sjekk -Status 'ADVARSEL' -Detalj "deploymenten '$($d.Modell)' finnes, men kjører $($eksisterende.properties.model.name)" -Fiks 'Gjenbrukes som den er. Slett eller gi nytt navn i Foundry-portalen om det ikke er meningen.'
        } elseif ($d.Type -eq 'GlobalStandard' -and $onsketType -ne 'GlobalStandard') {
          Add-PPCheck -Navn $sjekk -Status 'ADVARSEL' -Detalj "$($d.Modell) $($d.Versjon) finnes som GlobalStandard - forespørslene kan behandles utenfor EU" -Fiks "Gjenbrukes som den er. Vil dere ha $($onsketType): slett deploymenten i Foundry-portalen og kjør skriptet igjen."
        } else {
          Add-PPCheck -Navn $sjekk -Status 'OK' -Detalj "$($d.Modell) $($d.Versjon) ($($d.Type)) finnes, gjenbrukes"
        }
        continue
      }
    }
    try {
      $valg = Test-PPFoundryOption $konto $d $d.Type

      # Bildemodellen faller tilbake til Global Standard når den ikke kan settes opp i EU
      # (ikke tilgjengelig som Data Zone, eller ikke kvote) - med mindre typen er valgt eksplisitt.
      # Chatmodellen gjør det aldri: der går prosjektdataene.
      if (-not $valg.Ok -and $d.Rolle -eq 'Images' -and $d.Type -ne 'GlobalStandard' -and -not $script:BildeTypeEksplisitt) {
        $global = Test-PPFoundryOption $konto $d 'GlobalStandard'
        if ($global.Ok) {
          $onsketType = $d.Type
          $d.Type = 'GlobalStandard'
          $d.Versjon = $global.Versjon
          Add-PPCheck -Navn $sjekk -Status 'ADVARSEL' -Detalj "$($d.Modell) $($d.Versjon) settes opp som GlobalStandard, fordi den ikke kan settes opp som $($onsketType): $($valg.Arsak)" -Fiks "Da kan teksten brukeren skriver i logofeltet (forhåndsutfylt med tittelen på prosjektområdet) behandles utenfor EU. Ingen andre prosjektdata sendes til bildemodellen, og chatmodellen berøres ikke. Vil dere ikke det: -FoundryImagesDeploymentType $onsketType (stopper i stedet), en annen region med -FoundryImagesLocation, eller -NoFoundryImages."
          continue
        }
        $valg.Arsak = "$($valg.Arsak); heller ikke som GlobalStandard ($($global.Arsak))"
      }

      if (-not $valg.Ok) {
        Add-PPFoundryProblem $d $sjekk $valg.Arsak $valg.Fiks
        continue
      }
      $d.Versjon = $valg.Versjon
      if ($null -eq $valg.Ledig) {
        Add-PPCheck -Navn $sjekk -Status 'UKJENT' -Detalj "$($d.Modell) $($d.Versjon): fant ikke kvoten" -Fiks 'Kontroller Management -> Quota i Foundry-portalen.'
      } else {
        Add-PPCheck -Navn $sjekk -Status 'OK' -Detalj "$($d.Modell) $($d.Versjon), $($d.Type), kapasitet $($d.Kapasitet) (ledig $($valg.Ledig))"
      }
    } catch {
      $fiks = if (-not $script:FoundryRpRegistrert) { 'Kontrolleres på nytt etter at ressursleverandøren er registrert.' } else { '' }
      Add-PPCheck -Navn $sjekk -Status 'UKJENT' -Detalj $_.Exception.Message -Fiks $fiks
    }
  }
}

function Wait-PPArmProvisioning([string] $Path, [string] $Beskrivelse, [int] $Minutter = 10) {
  $frist = (Get-Date).AddMinutes($Minutter)
  while ($true) {
    $r = Invoke-PPArm GET $Path
    $tilstand = $r.properties.provisioningState
    if ($tilstand -eq 'Succeeded') { return $r }
    if ($tilstand -in @('Failed', 'Canceled')) { throw "$($Beskrivelse): provisjoneringen endte med '$tilstand'." }
    if ((Get-Date) -gt $frist) { throw "$($Beskrivelse): ikke ferdig etter $Minutter minutter (status '$tilstand'). Kjør skriptet igjen - det fortsetter der det slapp." }
    Start-Sleep -Seconds 10
  }
}

# Endepunkt-rot og nøkkel for en Foundry-ressurs. Under -WhatIf finnes ressursen kanskje ikke;
# da returneres det forventede endepunktet og ingen nøkkel.
function Get-PPFoundryConnection($Konto) {
  $base = "https://$($Konto.Navn).services.ai.azure.com"
  if (-not $Konto.Finnes) { return @{ Base = $base; Key = $null } }
  $ressurs = Invoke-PPArm GET "$($Konto.Id)?api-version=$CogApiVersion"
  $endepunkter = @(@($ressurs.properties.endpoints.PSObject.Properties.Value) + $ressurs.properties.endpoint | Where-Object { $_ })
  $treff = $endepunkter | Where-Object { $_ -match '\.services\.ai\.azure\.com' } | Select-Object -First 1
  if (-not $treff) { $treff = $endepunkter | Where-Object { $_ -match '\.openai\.azure\.com' } | Select-Object -First 1 }
  if ($treff) { $base = ([Uri]$treff).GetLeftPart([UriPartial]::Authority) }
  $nokler = Invoke-PPArm POST "$($Konto.Id)/listKeys?api-version=$CogApiVersion"
  return @{ Base = $base; Key = (ConvertTo-SecureString $nokler.key1 -AsPlainText -Force) }
}

# Oppretter det forhåndssjekken fant mangler: ressursleverandør, ressurs(er) og deployments.
# Returnerer endepunkt og nøkkel per rolle (Chat, Images).
function New-PPFoundry {
  Write-Step 'Microsoft Foundry (-ProvisionFoundry)'
  $sub = $script:SubId

  if (-not $script:FoundryRpRegistrert -and $PSCmdlet.ShouldProcess($sub, 'Registrere ressursleverandøren Microsoft.CognitiveServices')) {
    Invoke-PPArm POST "/subscriptions/$sub/providers/Microsoft.CognitiveServices/register?api-version=$RpApiVersion" | Out-Null
    $frist = (Get-Date).AddMinutes(5)
    while ((Invoke-PPArm GET "/subscriptions/$sub/providers/Microsoft.CognitiveServices?api-version=$RpApiVersion").registrationState -ne 'Registered') {
      if ((Get-Date) -gt $frist) { throw 'Microsoft.CognitiveServices ble ikke registrert innen 5 minutter. Kjør skriptet igjen om litt.' }
      Start-Sleep -Seconds 10
    }
    $script:FoundryRpRegistrert = $true
    Write-Ok 'Ressursleverandøren Microsoft.CognitiveServices: registrert'
  }

  foreach ($konto in $script:FoundryKontoer.Values) {
    if ($konto.Finnes) { Write-Ok "Foundry-ressurs '$($konto.Navn)': finnes"; continue }
    Initialize-PPResourceGroup
    if (-not $PSCmdlet.ShouldProcess($konto.Navn, "Opprette Foundry-ressurs (AIServices, S0) i $ResourceGroupName/$($konto.Location)")) { continue }
    $body = @{
      location   = $konto.Location
      kind       = 'AIServices'
      sku        = @{ name = 'S0' }
      identity   = @{ type = 'SystemAssigned' }
      tags       = @{ 'pp365-usage' = 'assistant' }
      properties = @{
        customSubDomainName    = $konto.Navn
        publicNetworkAccess    = 'Enabled'
        # Assistenten autentiserer mot modellen med API-nøkkel fra Key Vault.
        disableLocalAuth       = $false
        allowProjectManagement = $true
      }
    }
    try {
      Invoke-PPArm PUT "$($konto.Id)?api-version=$CogApiVersion" $body | Out-Null
    } catch {
      if ($_.Exception.Message -match 'RequestDisallowedByPolicy') {
        throw "En Azure Policy stopper opprettelsen av '$($konto.Navn)' ($($_.Exception.Message)). Typisk krav om disableLocalAuth eller privat nettverk - assistenten trenger API-nøkkel og et offentlig endepunkt. Opprett ressursen manuelt etter virksomhetens regler, og kjør skriptet med -ChatApiBase/-ChatApiKey/-ChatDeployment."
      }
      throw
    }
    Wait-PPArmProvisioning "$($konto.Id)?api-version=$CogApiVersion" "Foundry-ressursen '$($konto.Navn)'" | Out-Null
    $konto.Finnes = $true
    Write-Ok "Foundry-ressurs '$($konto.Navn)': opprettet i $($konto.Location)"
  }

  foreach ($d in $script:FoundryPlan) {
    $konto = $script:FoundryKontoer[$d.Konto]
    if ($d.Finnes) { Write-Ok "Deployment '$($d.Modell)': finnes"; continue }
    if (-not $PSCmdlet.ShouldProcess("$($konto.Navn)/$($d.Modell)", "Opprette deployment ($($d.Type), kapasitet $($d.Kapasitet))")) { continue }
    if (-not $d.Versjon) {
      $modell = Resolve-PPFoundryModel $konto.Location $d.Modell $d.Type
      if (-not $modell) { throw "$($d.Modell) finnes ikke som $($d.Type) i $($konto.Location)." }
      $d.Versjon = $modell.Version
    }
    $sti = "$($konto.Id)/deployments/$($d.Modell)?api-version=$CogApiVersion"
    $body = @{
      sku        = @{ name = $d.Type; capacity = $d.Kapasitet }
      properties = @{
        model                = @{ format = 'OpenAI'; name = $d.Modell; version = $d.Versjon }
        versionUpgradeOption = 'OnceNewDefaultVersionAvailable'
      }
    }
    try {
      Invoke-PPArm PUT $sti $body | Out-Null
    } catch {
      if ($_.Exception.Message -match 'InsufficientQuota|quota') {
        throw "Ikke nok kvote for $($d.Modell) i $($konto.Location) ($($_.Exception.Message)). Senk kapasiteten, velg en annen region, eller be om kvoteøkning under Management -> Quota i Foundry-portalen."
      }
      throw
    }
    Wait-PPArmProvisioning $sti "Deploymenten '$($d.Modell)'" | Out-Null
    $d.Finnes = $true
    Write-Ok "Deployment '$($d.Modell)' $($d.Versjon): opprettet ($($d.Type), kapasitet $($d.Kapasitet))"
  }

  $tilkoblinger = @{}
  foreach ($konto in $script:FoundryKontoer.Values) { $tilkoblinger[$konto.Navn] = Get-PPFoundryConnection $konto }
  $resultat = @{}
  foreach ($d in $script:FoundryPlan) { $resultat[$d.Rolle] = $tilkoblinger[$d.Konto] }
  Write-Info 'Tips: sett et budsjettvarsel på abonnementet, så dere ser forbruket før fakturaen gjør det.'
  return $resultat
}

# Gir AllSites.FullControl, som «sett som prosjektlogo» trenger.
#
# Merk for framtidig endring: AllSites.Manage er IKKE tilstrekkelig. Logoen settes med
# `web.update({SiteLogoUrl})`, en web-egenskap, og den krever ManageWeb - som bare FullControl
# gir. Testet: med Write + Manage svarer SharePoint 403 E_ACCESSDENIED.
function Grant-PPSharePointFullControl($AssistantSp) {
  Write-Step 'Valgfritt: AllSites.FullControl (for «sett som prosjektlogo»)'
  if (-not $AssistantSp) { Write-Warning 'Hopper over - assistent-appen finnes ikke ennå.'; return }
  try {
    $spSp = Get-AzADServicePrincipal -ApplicationId $SharePointAppId
    $grant = Get-PPGrants $AssistantSp.Id | Where-Object { $_.resourceId -eq $spSp.Id } | Select-Object -First 1
    # @(...) rundt HELE if-en. Uten den enumereres output-strømmen ved tilordning, og en
    # ettelements liste kollapser til en String - da blir `+` strengkonkatenering framfor
    # array-append. Det skrev 'AllSites.WriteAllSites.FullControl' til en tenant.
    $existing = @(if ($grant) { ($grant.scope -split ' ') | Where-Object { $_ } })

    if ($existing -contains 'AllSites.FullControl') { Write-Ok 'AllSites.FullControl: finnes'; return }
    if (-not $PSCmdlet.ShouldProcess($AssistantSp.DisplayName, 'Gi AllSites.FullControl (AllPrincipals)')) { return }

    if ($grant) {
      # @(...) rundt lista: uten den ville ETT element blitt pakket ut til en skalar streng, og
      # `+` blitt strengkonkatenering framfor array-append - det skrev en gang den ugyldige
      # scopen 'AllSites.WriteAllSites.Manage' til en tenant.
      $want = @($existing + 'AllSites.FullControl') | Where-Object { $_ } | Select-Object -Unique
      # Valider mot scopene SharePoint faktisk publiserer. En ren formsjekk fanger ikke en
      # sammenskrevet verdi som 'AllSites.WriteAllSites.FullControl', for den er ETT element.
      $published = (Invoke-PPGraph GET "$Graph/servicePrincipals/$($spSp.Id)?`$select=oauth2PermissionScopes").oauth2PermissionScopes.value
      $unknown = @($want | Where-Object { $_ -notin $published })
      if ($unknown.Count -gt 0) {
        throw "Ukjent SharePoint-scope: $($unknown -join ', '). Avbryter uten å endre noe."
      }
      $scopes = $want -join ' '
      Invoke-PPGraph PATCH "$Graph/oauth2PermissionGrants/$($grant.id)" @{ scope = $scopes } | Out-Null
    } else {
      Invoke-PPGraph POST "$Graph/oauth2PermissionGrants" @{ clientId = $AssistantSp.Id; consentType = 'AllPrincipals'; resourceId = $spSp.Id; scope = 'AllSites.FullControl' } | Out-Null
    }
    Write-Ok 'AllSites.FullControl: gitt'
  } catch {
    Write-Warning "Kunne ikke gi AllSites.FullControl automatisk ($($_.Exception.Message)). Uten den virker alt unntatt «sett som prosjektlogo». Kan gjøres senere av en Global Administrator."
  }
}

# Fjerner AllSites.FullControl igjen. Blir scope-lista tom, slettes hele grantet.
#
# @(...) rundt filtreringen er ikke pynt: returnerer Where-Object bare ETT element, pakker
# PowerShell det ut til en skalar streng, og `+` blir strengkonkatenering framfor array-append.
# Det skrev en gang den ugyldige scopen 'AllSites.WriteAllSites.Manage' til en tenant.
function Remove-PPSharePointFullControl($AssistantSp) {
  Write-Step 'Fjerner AllSites.FullControl'
  if (-not $AssistantSp) { Write-Warning 'Hopper over - assistent-appen finnes ikke i tenanten.'; return }
  try {
    $spSp = Get-AzADServicePrincipal -ApplicationId $SharePointAppId
    $grant = Get-PPGrants $AssistantSp.Id | Where-Object { $_.resourceId -eq $spSp.Id } | Select-Object -First 1
    $existing = @(if ($grant) { ($grant.scope -split ' ') | Where-Object { $_ } })

    if ($existing -notcontains 'AllSites.FullControl') {
      Write-Ok 'AllSites.FullControl er ikke gitt - ingenting å fjerne.'
      return
    }
    if (-not $PSCmdlet.ShouldProcess($AssistantSp.DisplayName, 'Fjern AllSites.FullControl')) { return }

    $want = @($existing | Where-Object { $_ -ne 'AllSites.FullControl' })
    if ($want.Count -eq 0) {
      Invoke-PPGraph DELETE "$Graph/oauth2PermissionGrants/$($grant.id)" | Out-Null
      Write-Ok 'AllSites.FullControl fjernet (grantet er slettet).'
      return
    }

    # Valider mot scopene SharePoint faktisk publiserer - en formsjekk fanger ikke en
    # sammenskrevet verdi, for den er ETT element og splitter tilbake til seg selv.
    $scopes = $want -join ' '
    $published = (Invoke-PPGraph GET "$Graph/servicePrincipals/$($spSp.Id)?`$select=oauth2PermissionScopes").oauth2PermissionScopes.value
    $unknown = @($want | Where-Object { $_ -notin $published })
    if ($unknown.Count -gt 0) { throw "Ukjent SharePoint-scope: $($unknown -join ', '). Avbryter uten å endre noe." }

    Invoke-PPGraph PATCH "$Graph/oauth2PermissionGrants/$($grant.id)" @{ scope = $scopes } | Out-Null
    Write-Ok "AllSites.FullControl fjernet. Nytt scope: $scopes"
  } catch {
    Write-Warning "Kunne ikke fjerne AllSites.FullControl ($($_.Exception.Message))."
  }
}

# Standardveien: rapporter hva appen har, endre ingenting. «Sett som prosjektlogo» krever
# AllSites.FullControl, og den deles bare ut når noen ber om det med -GrantSharePointFullControl.
function Show-PPSharePointScopeStatus($AssistantSp) {
  Write-Step 'SharePoint-tilgang for «sett som prosjektlogo»'
  if (-not $AssistantSp) { return }
  try {
    $spSp = Get-AzADServicePrincipal -ApplicationId $SharePointAppId
    $grant = Get-PPGrants $AssistantSp.Id | Where-Object { $_.resourceId -eq $spSp.Id } | Select-Object -First 1
    # @(...) rundt HELE if-en. Uten den enumereres output-strømmen ved tilordning, og en
    # ettelements liste kollapser til en String - da blir `+` strengkonkatenering framfor
    # array-append. Det skrev 'AllSites.WriteAllSites.FullControl' til en tenant.
    $existing = @(if ($grant) { ($grant.scope -split ' ') | Where-Object { $_ } })
    Write-Info "Nåværende scope: $(if ($existing) { $existing -join ' ' } else { '(ingen)' })"
    if ($existing -contains 'AllSites.FullControl') {
      Write-Ok '«Sett som prosjektlogo» er tilgjengelig.'
      return
    }
  } catch {
    Write-Info "Kunne ikke lese nåværende scope ($($_.Exception.Message))."
  }
  Write-Info '«Sett som prosjektlogo» er ikke aktivert. Alt annet i assistenten virker.'
  Write-Info 'Vil du ha den: kjør på nytt med -GrantSharePointFullControl. Tillatelsen er delegert -'
  Write-Info 'assistenten får aldri mer tilgang enn den pålogde brukeren selv har.'
}

# Skrives ut i BEGGE moduser. Hand-off-blokken er det teamet trenger for å registrere
# tenanten, og den skal se lik ut uansett om kunden satte opp modeller i samme kjøring
# eller bare fornyet godkjenninger – ellers vet ikke mottakeren hva som mangler.
function Write-PPResult($Tenant, [string] $TenantName, $Vault, [bool] $HasImages, $AssistantSp, [bool] $FulltOppsett = $true) {
  $name = if ($CustomerName) { $CustomerName } else { $TenantName }
  $config = [ordered]@{ TenantId = $Tenant; ApiScope = $ApiScope } | ConvertTo-Json

  Write-Step 'Lim inn i Prosjektportalen -> Globale innstillinger -> «Konfigurasjonsoppsett for assistenten»'
  Write-Host $config -ForegroundColor Yellow
  Write-Info 'Har du allerede andre nøkler der (PortfolioAccessGroups, DisabledOperations), behold dem og legg til TenantId og ApiScope.'
  Write-Info 'Sett deretter «Ta i bruk Prosjektportalen assistenten» (UseAssistant) til 1.'

  # I godkjenningsmodus vet skriptet bare det som ble oppgitt. Vault-navnet står i Azure
  # (Key Vault → Oversikt) om det mangler her; bildemodellen kan ikke avleses uten å lese vaulten.
  $vaultNavn = if ($Vault -and $Vault.VaultName) { $Vault.VaultName } elseif ($KeyVaultName) { $KeyVaultName } else { '(ikke oppgitt – oppgi -KeyVaultName, eller finn navnet i Azure)' }
  $bildeTekst = if ($FulltOppsett) { if ($HasImages) { 'ja' } else { 'nei' } } else { '(ikke kontrollert i denne kjøringen)' }

  Write-Step "Send til Prosjektportalen-teamet: $HandoffMail  (emne: Assistent: $name)"
  $handoff = @"
Virksomhet:        $name
Tenant-id:         $Tenant
Tenant:            $TenantName.onmicrosoft.com
Hub-URL:           $($HubUrl.TrimEnd('/'))
Key Vault:         $vaultNavn
Bildemodell:       $bildeTekst
Consent gitt:      $(if ($AssistantSp) { 'ja' } else { 'nei/ukjent' })
Modus:             $(if ($FulltOppsett) { 'fullt oppsett' } else { 'kun godkjenninger' })
Tidspunkt:         $(Get-Date -Format 'yyyy-MM-dd HH:mm')
"@
  Write-Host $handoff -ForegroundColor Yellow
  Write-Info 'Er virksomheten allerede registrert, trenger teamet ikke blokken – sammenlign bare hub-URL og vault-navn med det som er registrert.'
  Write-Info 'Ellers svarer assistenten «tenant_not_onboarded» til registreringen er gjort. Du får bekreftelse på e-post.'
  Write-Info 'Brukere må laste assistenten på nytt (F5) for at et nytt token skal hentes.'
}

# ---------------- Kjøring ----------------
# Rekkefølgen er bevisst: ALT over Confirm-PPSetup er lesing. Første skriving skjer
# etter at bekreftelsen er gitt. Da kan oppsummeringen vise de oppløste verdiene -
# tenant, konto, abonnement, vault - mens det fortsatt er gratis å avbryte.

# To moduser. Er AI-parametrene oppgitt, kjøres fullt oppsett. Utelates de, kjøres kun
# godkjenninger og tilgangsomfang - det en allerede oppsatt virksomhet trenger.
# -ProvisionFoundry er en tredje vei inn i fullt oppsett: skriptet lager modellene selv, og
# endepunkt/nøkkel/deployment fylles inn etter opprettelsen i stedet for fra parametrene.
if ($ProvisionFoundry) {
  if ($ChatApiBase -or $ChatApiKey -or $ChatDeployment -or $ImagesApiBase -or $ImagesApiKey -or $ImagesDeployment) {
    throw '-ProvisionFoundry oppretter modellene selv og kan ikke kombineres med -ChatApiBase/-ChatApiKey/-ChatDeployment eller -Images*. Bruk det ene eller det andre.'
  }
  $ChatDeployment = $FoundryChatModel
  $ImagesDeployment = $FoundryImagesModel
} elseif (@('FoundryName', 'FoundryImagesModel', 'FoundryImagesLocation', 'FoundryImagesDeploymentType', 'NoFoundryImages') | Where-Object { $PSBoundParameters.ContainsKey($_) }) {
  throw '-FoundryName, -FoundryImages* og -NoFoundryImages brukes bare sammen med -ProvisionFoundry.'
}
# Ba brukeren selv om bildemodellen, skal den stoppe kjøringen om den ikke kan settes opp.
# Som standard er den et tillegg som hoppes over med en advarsel.
$script:BildeEksplisitt = [bool](@('FoundryImagesModel', 'FoundryImagesLocation', 'FoundryImagesDeploymentType') | Where-Object { $PSBoundParameters.ContainsKey($_) })
# Valgt type for bildemodellen er et løfte: da faller den ikke tilbake til Global Standard.
$script:BildeTypeEksplisitt = $PSBoundParameters.ContainsKey('FoundryImagesDeploymentType')

$fulltOppsett = $ProvisionFoundry -or [bool]$ChatApiBase -or [bool]$ChatApiKey -or [bool]$ChatDeployment
if (-not $ProvisionFoundry -and $fulltOppsett -and -not ($ChatApiBase -and $ChatApiKey -and $ChatDeployment)) {
  throw 'Chatmodell: -ChatApiBase, -ChatApiKey og -ChatDeployment må gis sammen (eller ingen av dem, for kun godkjenninger).'
}
if (-not $fulltOppsett -and ($ImagesApiBase -or $ImagesApiKey -or $ImagesDeployment)) {
  throw 'Bildemodell kan ikke settes opp uten chatmodell. Oppgi -ChatApiBase/-ChatApiKey/-ChatDeployment også.'
}

Write-Step $(if ($ProvisionFoundry) { 'Modus: fullt oppsett, med opprettelse av Microsoft Foundry-modeller' } elseif ($fulltOppsett) { 'Modus: fullt oppsett' } else { 'Modus: kun godkjenninger og tilgangsomfang' })
if (-not $fulltOppsett) {
  Write-Info 'Ingen AI-parametre oppgitt. Key Vault, secrets og modelltest hoppes over.'
  Write-Info 'Vil du sette opp modellene også, kjør med -ChatApiBase, -ChatApiKey og -ChatDeployment,'
  Write-Info 'eller la skriptet opprette dem i Microsoft Foundry med -ProvisionFoundry.'
}

# --- Lesing og sjekker ---
$hasImages = Test-PPPrerequisites

if ($fulltOppsett) {
  if (-not $ProvisionFoundry) {
    $script:ChatBase   = Assert-PPApiBase $ChatApiBase 'ChatApiBase'
    $script:ImagesBase = if ($hasImages) { Assert-PPApiBase $ImagesApiBase 'ImagesApiBase' } else { $null }
  }
  if ($ChatDeployment -match 'gpt-5') {
    Add-PPCheck -Navn 'Chat-deployment' -Status 'OK' -Detalj $ChatDeployment
  } else {
    Add-PPCheck -Navn 'Chat-deployment' -Status 'ADVARSEL' -Detalj "'$ChatDeployment' inneholder ikke «gpt-5»" -Fiks 'Filvedlegg (PDF) i assistenten blir utilgjengelig. Bruk en deployment i gpt-5-familien hvis dere vil ha det.'
  }
  if ($SkipModelTest) {
    Add-PPCheck -Navn 'Chatmodellen svarer' -Status 'HOPPET OVER' -Detalj '-SkipModelTest'
  } elseif ($ProvisionFoundry) {
    Add-PPCheck -Navn 'Chatmodellen svarer' -Status 'HOPPET OVER' -Detalj 'testes etter at Foundry-deploymenten er opprettet'
  } else {
    try {
      Test-PPChatDeployment $script:ChatBase $ChatApiKey $ChatDeployment
      Add-PPCheck -Navn 'Chatmodellen svarer' -Status 'OK' -Detalj "$($script:ChatBase) -> $ChatDeployment"
    } catch {
      Add-PPCheck -Navn 'Chatmodellen svarer' -Status 'MANGLER' -Detalj $_.Exception.Message -Fiks 'Kontroller endepunkt, nøkkel og deployment-navn i Azure AI Foundry (steg 1 i veiledningen).'
    }
  }
}

$tenant = Resolve-PPTenantId $HubUrl
Add-PPCheck -Navn 'Tenant fra hub-URL' -Status 'OK' -Detalj "$($tenant.Name).onmicrosoft.com ($($tenant.Id))"

# Tenantnavnet kuttet til 15 tegn, så standardnavnene holder seg innenfor Key Vaults 24 tegn.
$tenantKort = ($tenant.Name -replace '[^A-Za-z0-9]', '')
$tenantKort = $tenantKort.Substring(0, [Math]::Min($tenantKort.Length, 15))

if ($fulltOppsett) {
  # Globalt unikt, 3-24 tegn, bokstaver/tall/bindestrek: pp365-<tenant>-kv
  $script:VaultName = if ($KeyVaultName) { $KeyVaultName } else { "pp365-$tenantKort-kv" }
}

if ($ProvisionFoundry) {
  $navn = if ($FoundryName) { $FoundryName } else { "pp365-$tenantKort-ai" }
  $bildeRegion = if ($FoundryImagesLocation) { $FoundryImagesLocation } else { $FoundryLocation }
  $script:FoundryKontoer = [ordered]@{}
  $script:FoundryKontoer[$navn] = [pscustomobject]@{ Navn = $navn; Location = $FoundryLocation; Finnes = $false; Id = $null }
  $bildeType = if ($FoundryImagesDeploymentType) { $FoundryImagesDeploymentType } else { $FoundryDeploymentType }
  $script:FoundryPlan = @([pscustomobject]@{ Rolle = 'Chat'; Konto = $navn; Modell = $FoundryChatModel; Type = $FoundryDeploymentType; Kapasitet = $FoundryChatCapacity; Versjon = $null; Finnes = $false; Hoppes = $false })
  if ($hasImages) {
    # Bildemodellene finnes ikke i alle regioner (f.eks. ikke norwayeast). Egen region gir egen ressurs.
    $bildeNavn = if ($bildeRegion -ne $FoundryLocation) { "$navn-img" } else { $navn }
    if (-not $script:FoundryKontoer.Contains($bildeNavn)) {
      $script:FoundryKontoer[$bildeNavn] = [pscustomobject]@{ Navn = $bildeNavn; Location = $bildeRegion; Finnes = $false; Id = $null }
    }
    $script:FoundryPlan += [pscustomobject]@{ Rolle = 'Images'; Konto = $bildeNavn; Modell = $FoundryImagesModel; Type = $bildeType; Kapasitet = $FoundryImagesCapacity; Versjon = $null; Finnes = $false; Hoppes = $false }
  }
}

Import-PPAzModules
Connect-PPAzure $tenant.Id
$azContext = Get-AzContext
Add-PPCheck -Navn 'Azure-innlogging' -Status 'OK' -Detalj "$($azContext.Account.Id) i riktig tenant"
$script:SubId = $azContext.Subscription.Id

if ($ProvisionFoundry) {
  Test-PPFoundryPlan
  if ($script:FoundryPlan | Where-Object { $_.Hoppes }) {
    $script:FoundryPlan = @($script:FoundryPlan | Where-Object { -not $_.Hoppes })
    $hasImages = $false
    foreach ($n in @($script:FoundryKontoer.Keys)) {
      if ($n -notin $script:FoundryPlan.Konto) { $script:FoundryKontoer.Remove($n) }
    }
  }
}

# Finnes vaulten fra før? Avgjør om oppsummeringen sier «gjenbrukes» eller «OPPRETTES».
$vaultFinnes = $false
if ($fulltOppsett) {
  $eksisterende = Get-AzKeyVault -VaultName $script:VaultName -ErrorAction SilentlyContinue
  if ($eksisterende) {
    $vaultFinnes = $true
    Add-PPCheck -Navn 'Key Vault' -Status 'OK' -Detalj "$($script:VaultName) finnes i $($eksisterende.ResourceGroupName)"
  } elseif ($NoCreate) {
    Add-PPCheck -Navn 'Key Vault' -Status 'MANGLER' -Detalj "$($script:VaultName) finnes ikke, og -NoCreate er angitt" -Fiks 'Opprett vaulten, eller kjør uten -NoCreate.'
  } else {
    Add-PPCheck -Navn 'Key Vault' -Status 'OK' -Detalj "$($script:VaultName) opprettes i $ResourceGroupName/$Location"
  }
}

# Nåværende godkjenninger og SharePoint-scope, til oppsummeringen. Rene oppslag.
$assistantSpCurrent = Get-AzADServicePrincipal -ApplicationId $AssistantAppId -ErrorAction SilentlyContinue
$consentTekst = 'appen finnes ikke i tenanten ennå (førstegangsoppsett)'
$scopeTekst = '(ingen)'
if ($assistantSpCurrent) {
  try {
    $spSpCurrent = Get-AzADServicePrincipal -ApplicationId $SharePointAppId
    $grantCurrent = Get-PPGrants $assistantSpCurrent.Id | Where-Object { $_.resourceId -eq $spSpCurrent.Id } | Select-Object -First 1
    $scopeCurrent = @(if ($grantCurrent) { ($grantCurrent.scope -split ' ') | Where-Object { $_ } })
    if ($scopeCurrent.Count -gt 0) { $scopeTekst = $scopeCurrent -join ' ' }
    $consentTekst = 'appen er godkjent fra før'
    Add-PPCheck -Navn 'Admin-consent' -Status 'OK' -Detalj 'appen finnes i tenanten'
  } catch {
    $consentTekst = 'kunne ikke leses'
    Add-PPCheck -Navn 'Admin-consent' -Status 'UKJENT' -Detalj $_.Exception.Message
  }
} else {
  Add-PPCheck -Navn 'Admin-consent' -Status 'MANGLER' -Detalj 'ikke gitt ennå' -Fiks 'Skriptet åpner godkjenningssiden. Du må være Global Administrator eller Privileged Role Administrator.'
}

$antallMangler = Show-PPChecklist
if ($Preflight) {
  Show-PPSummary $tenant $azContext $vaultFinnes $consentTekst $scopeTekst
  if ($antallMangler -gt 0) { Write-Host "Forhåndssjekken fant $antallMangler ting som mangler - kjøringen ville stoppet før noe ble endret." -ForegroundColor Red }
  Write-Info 'Kun forhåndssjekk (-Preflight). Ingenting er endret.'
  exit $(if ($antallMangler -gt 0) { 1 } else { 0 })
}
if ($antallMangler -gt 0) {
  throw "Forhåndssjekken fant $antallMangler ting som mangler (se over). Ingenting er endret."
}

Confirm-PPSetup $tenant $azContext $vaultFinnes $consentTekst $scopeTekst

# --- Fra og med her skrives det ---

# Foundry først: feiler opprettelsen (kvote, policy), har vi ikke åpnet consent-siden forgjeves.
if ($ProvisionFoundry) {
  $foundry = New-PPFoundry
  $script:ChatBase = Assert-PPApiBase $foundry.Chat.Base 'Foundry-endepunkt'
  $ChatApiKey = $foundry.Chat.Key
  if ($hasImages) {
    $script:ImagesBase = Assert-PPApiBase $foundry.Images.Base 'Foundry-endepunkt (bilder)'
    $ImagesApiKey = $foundry.Images.Key
  }
  Write-Info "Endepunkt: $($script:ChatBase)$(if ($hasImages -and $script:ImagesBase -ne $script:ChatBase) { " (bilder: $($script:ImagesBase))" })"
  if ($ChatApiKey -and -not $SkipModelTest) {
    Test-PPChatDeployment $script:ChatBase $ChatApiKey $ChatDeployment -Attempts 12
  }
}

$assistantSp = if ($SkipConsent) { $assistantSpCurrent } else { Request-PPAdminConsent $tenant.Id }

# Admin-consent skriver SharePoint-grantet om til det app-registreringen ber om - og den ber
# ikke om AllSites.FullControl. Hadde tenanten FullControl før consent, er den borte nå,
# og «sett som prosjektlogo» slutter stille å virke. Sett 2026-09-15 på tarjeieo. Vi
# gjenoppretter det som var der, med beskjed - det er ikke en ny tillatelse, bare den gamle.
if (-not $SkipConsent -and -not $RemoveSharePointFullControl -and ($scopeCurrent -contains 'AllSites.FullControl') -and $assistantSp) {
  $grantEtter = Get-PPGrants $assistantSp.Id | Where-Object { $_.resourceId -eq $spSpCurrent.Id } | Select-Object -First 1
  $scopeEtter = @(if ($grantEtter) { ($grantEtter.scope -split ' ') | Where-Object { $_ } })
  if ($scopeEtter -notcontains 'AllSites.FullControl') {
    Write-Warning 'Admin-consent fjernet AllSites.FullControl, som tenanten hadde fra før. Gjenoppretter den, så «sett som prosjektlogo» fortsetter å virke.'
    $GrantSharePointFullControl = $true
  }
}

$vault = $null
if ($fulltOppsett) {
  $vault = Set-PPKeyVault
  if ($vault) {
    Set-PPKeyVaultSecrets $vault $hasImages
    Grant-PPKeyVaultAccess $vault $assistantSp
  }
}

if ($RemoveSharePointFullControl) {
  Remove-PPSharePointFullControl $assistantSp
} elseif ($GrantSharePointFullControl -and -not $SkipSharePointFullControl) {
  Grant-PPSharePointFullControl $assistantSp
} else {
  Show-PPSharePointScopeStatus $assistantSp
}

# Samme oppsummering i begge moduser – se kommentaren over Write-PPResult.
$vaultForResultat = if ($vault) { $vault } elseif ($script:VaultName) { @{ VaultName = $script:VaultName } } else { $null }
Write-PPResult $tenant.Id $tenant.Name $vaultForResultat $hasImages $assistantSp $fulltOppsett
