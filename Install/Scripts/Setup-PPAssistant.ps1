#Requires -Version 7.0
<#
.SYNOPSIS
  Setter opp Prosjektportalen Assistenten i DIN tenant: Key Vault-secrets, tilgang for assistent-appen,
  admin-consent og ferdig konfigurasjon til Prosjektportalen.

.DESCRIPTION
  Kilde: https://github.com/Puzzlepart/prosjektportalen365 (Install/Scripts/Setup-PPAssistant.ps1). Versjon 1.1.
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

  Skriptet oppretter IKKE Foundry-ressurser/deployments og skriver IKKE til SharePoint.
  Trygt å kjøre flere ganger (idempotent). Skriver aldri ut nøkler.

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
  Kjør kun forhåndssjekken og skriv ut sjekklista. Endrer ingenting. Avslutningskode 1 hvis
  noe mangler.
.PARAMETER SkipConfirmation
  Hopp over oppsummeringen og bekreftelsen. For uovervåkede kjøringer.
.PARAMETER ImagesApiBase
  Valgfritt: ressurs-rot for bildemodellen (gpt-image). Alle tre Images-parametre må gis sammen.

.EXAMPLE
  ./Setup-PPAssistant.ps1 -HubUrl https://kontoso.sharepoint.com/sites/pp365 -KeyVaultName kv-kontoso-pp365 `
    -ChatApiBase https://kontoso-ai.services.ai.azure.com -ChatApiKey (Read-Host -AsSecureString "Chat-nøkkel") `
    -ChatDeployment gpt-5.6 -ImagesApiBase https://kontoso-img.services.ai.azure.com `
    -ImagesApiKey (Read-Host -AsSecureString "Bilde-nøkkel") -ImagesDeployment gpt-image-1.5 -CustomerName "Kontoso AS"

.EXAMPLE
  ./Setup-PPAssistant.ps1 -HubUrl https://kontoso.sharepoint.com/sites/pp365
  # Kun godkjenninger: fornyer admin-consent om noe mangler og rapporterer SharePoint-tilgangen.
  # Rører ikke Key Vault eller secrets. Bruk denne når assistenten allerede er satt opp.

.EXAMPLE
  ./Setup-PPAssistant.ps1 -HubUrl https://kontoso.sharepoint.com/sites/pp365 -Preflight
  # Kun forhåndssjekk: kontrollerer tenant, innlogging, Key Vault og godkjenninger, skriver ut
  # sjekklista og avslutter. Endrer ingenting.

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
$ApiAppId        = '1bf9å43-3416-493d-8709-b222cf5ac32a'   # «Prosjektportalen Assistent API»
$ApiScope        = "api://$ApiAppId/Assistant.Access"
$ConsentRedirect = 'https://pp365-ai-d2dge4fqc2bhbba9.norwayeast-01.azurewebsites.net/consent-done'
$SharePointAppId = '00000003-0000-0ff1-ce00-000000000000'
$GraphAppId      = '00000003-0000-0000-c000-000000000000'   # Microsoft Graph (Tasks.Read for Planner-oppgaver)
$HandoffMail     = 'setup@prosjektportalen.no'
$Graph           = 'https://graph.microsoft.com/v1.0'

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

  Write-Host ''
  Write-Host '#################### OPPSUMMERING ####################' -ForegroundColor Magenta
  Write-Host ''
  Write-Host ('  Modus:                {0}' -f $(if ($fulltOppsett) { 'FULLT OPPSETT (Key Vault, secrets, godkjenninger)' } else { 'KUN GODKJENNINGER (ingen Key Vault, ingen secrets)' })) -ForegroundColor Cyan
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
  Write-Host '  Dette blir gjort:' -ForegroundColor Yellow

  function Write-PPPlan([string] $Merkelapp, [string] $Verdi, [bool] $Hoppet = $false) {
    if ($Hoppet) { Write-Host ('    {0,-20}(hoppes over)' -f "$($Merkelapp):") -ForegroundColor DarkGray }
    else { Write-Host ('    {0,-20}{1}' -f "$($Merkelapp):", $Verdi) }
  }

  Write-PPPlan 'Admin-consent' $(if ($ForceConsent) { 'Ber om godkjenning på nytt (-ForceConsent)' } else { 'Kun hvis noe mangler' }) $SkipConsent
  if ($fulltOppsett) {
    Write-PPPlan 'Key Vault' ('{0} ({1}) - {2}' -f $script:VaultName, "$ResourceGroupName/$Location", $(if ($VaultFinnes) { 'finnes, gjenbrukes' } else { 'OPPRETTES' }))
    Write-PPPlan 'Secrets' $(if ($hasImages) { 'apiKey, apiBase, modelName + de tre Images-variantene' } else { 'apiKey, apiBase, modelName' })
    Write-PPPlan 'Chatmodell' ("$($script:ChatBase) -> $ChatDeployment")
    if ($hasImages) { Write-PPPlan 'Bildemodell' ("$($script:ImagesBase) -> $ImagesDeployment") }
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
  Write-Host 'Kontroller spesielt tenant, konto og Key Vault-navn over.' -ForegroundColor Yellow
  $svar = Read-Host 'Fortsett? ( j / n )'
  if ($svar -notin @('j', 'J', 'y', 'Y')) {
    Write-Host 'Avbrutt. Ingenting er endret.' -ForegroundColor Yellow
    exit 0
  }
  Write-Host 'Bekreftet - starter.' -ForegroundColor Green
}

function Write-Step([string] $Text) { Write-Host "`n== $Text" -ForegroundColor Cyan }
function Write-Ok([string] $Text)   { Write-Host "   $Text" -ForegroundColor Green }
function Write-Info([string] $Text) { Write-Host "   $Text" }

function Test-PPPrerequisites {
  Write-Step 'Forutsetninger'
  $hasImages = [bool]$ImagesApiBase -or [bool]$ImagesApiKey -or [bool]$ImagesDeployment
  if ($hasImages -and -not ($ImagesApiBase -and $ImagesApiKey -and $ImagesDeployment)) {
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

function Test-PPChatDeployment([string] $Base, [securestring] $Key, [string] $Deployment) {
  Write-Step 'Tester chat-deployment (ett lite kall)'
  $plain = [System.Net.NetworkCredential]::new('', $Key).Password
  try {
    $body = @{ model = $Deployment; messages = @(@{ role = 'user'; content = 'ping' }); max_completion_tokens = 5 } | ConvertTo-Json -Depth 4
    Invoke-RestMethod -Method Post -Uri "$Base/openai/v1/chat/completions" -Headers @{ 'api-key' = $plain } -ContentType 'application/json' -Body $body | Out-Null
    Write-Ok "Deployment '$Deployment' svarer på $Base"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    $hint = switch ($status) { 401 { 'feil API-nøkkel' } 404 { 'feil deployment-navn eller ressurs-rot' } default { $_.Exception.Message } }
    throw "Chat-deploymenten svarte ikke ($status): $hint"
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

function Set-PPKeyVault {
  Write-Step "Key Vault '$script:VaultName'"
  $vault = Get-AzKeyVault -VaultName $script:VaultName -ErrorAction SilentlyContinue
  if (-not $vault) {
    if ($NoCreate) { throw "Key Vault '$script:VaultName' finnes ikke, og -NoCreate er angitt." }
    if (Get-AzKeyVault -VaultName $script:VaultName -Location $Location -InRemovedState -ErrorAction SilentlyContinue) {
      throw "Navnet '$script:VaultName' er opptatt av en slettet (soft-deleted) vault. Gjenopprett den eller velg et annet navn med -KeyVaultName."
    }
    if (-not (Get-AzResourceGroup -Name $ResourceGroupName -ErrorAction SilentlyContinue)) {
      if ($PSCmdlet.ShouldProcess($ResourceGroupName, "Opprette ressursgruppe i $Location")) {
        New-AzResourceGroup -Name $ResourceGroupName -Location $Location | Out-Null
        Write-Ok "Ressursgruppe '$ResourceGroupName' opprettet"
      }
    }
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
  Set-PPSecret $Vault 'apiKey'    ([System.Net.NetworkCredential]::new('', $ChatApiKey).Password)
  Set-PPSecret $Vault 'modelName' $ChatDeployment
  if ($HasImages) {
    Set-PPSecret $Vault 'apiBaseImages'   $script:ImagesBase
    Set-PPSecret $Vault 'apiKeyImages'    ([System.Net.NetworkCredential]::new('', $ImagesApiKey).Password)
    Set-PPSecret $Vault 'modelNameImages' $ImagesDeployment
  } else {
    Write-Warning 'Ingen bildemodell oppgitt - logo-generering vil rapportere ai_configuration_incomplete. Kjør igjen med -Images* for å aktivere.'
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
$fulltOppsett = [bool]$ChatApiBase -or [bool]$ChatApiKey -or [bool]$ChatDeployment
if ($fulltOppsett -and -not ($ChatApiBase -and $ChatApiKey -and $ChatDeployment)) {
  throw 'Chatmodell: -ChatApiBase, -ChatApiKey og -ChatDeployment må gis sammen (eller ingen av dem, for kun godkjenninger).'
}
if (-not $fulltOppsett -and ($ImagesApiBase -or $ImagesApiKey -or $ImagesDeployment)) {
  throw 'Bildemodell kan ikke settes opp uten chatmodell. Oppgi -ChatApiBase/-ChatApiKey/-ChatDeployment også.'
}

Write-Step $(if ($fulltOppsett) { 'Modus: fullt oppsett' } else { 'Modus: kun godkjenninger og tilgangsomfang' })
if (-not $fulltOppsett) {
  Write-Info 'Ingen AI-parametre oppgitt. Key Vault, secrets og modelltest hoppes over.'
  Write-Info 'Vil du sette opp modellene også, kjør med -ChatApiBase, -ChatApiKey og -ChatDeployment.'
}

# --- Lesing og sjekker ---
$hasImages = Test-PPPrerequisites

if ($fulltOppsett) {
  $script:ChatBase   = Assert-PPApiBase $ChatApiBase 'ChatApiBase'
  $script:ImagesBase = if ($hasImages) { Assert-PPApiBase $ImagesApiBase 'ImagesApiBase' } else { $null }
  if ($ChatDeployment -match 'gpt-5') {
    Add-PPCheck -Navn 'Chat-deployment' -Status 'OK' -Detalj $ChatDeployment
  } else {
    Add-PPCheck -Navn 'Chat-deployment' -Status 'ADVARSEL' -Detalj "'$ChatDeployment' inneholder ikke «gpt-5»" -Fiks 'Filvedlegg (PDF) i assistenten blir utilgjengelig. Bruk en deployment i gpt-5-familien hvis dere vil ha det.'
  }
  if ($SkipModelTest) {
    Add-PPCheck -Navn 'Chatmodellen svarer' -Status 'HOPPET OVER' -Detalj '-SkipModelTest'
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

if ($fulltOppsett) {
  $script:VaultName = if ($KeyVaultName) { $KeyVaultName } else {
    # Globalt unikt, 3-24 tegn, bokstaver/tall/bindestrek: pp365-<tenant>-kv (tenantnavn kuttes ved behov)
    $t = ($tenant.Name -replace '[^A-Za-z0-9]', '').Substring(0, [Math]::Min(($tenant.Name -replace '[^A-Za-z0-9]', '').Length, 15))
    "pp365-$t-kv"
  }
}

Import-PPAzModules
Connect-PPAzure $tenant.Id
$azContext = Get-AzContext
Add-PPCheck -Navn 'Azure-innlogging' -Status 'OK' -Detalj "$($azContext.Account.Id) i riktig tenant"

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
  Write-Info 'Kun forhåndssjekk (-Preflight). Ingenting er endret.'
  exit $(if ($antallMangler -gt 0) { 1 } else { 0 })
}
if ($antallMangler -gt 0) {
  throw "Forhåndssjekken fant $antallMangler ting som mangler (se over). Ingenting er endret."
}

Confirm-PPSetup $tenant $azContext $vaultFinnes $consentTekst $scopeTekst

# --- Fra og med her skrives det ---
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
