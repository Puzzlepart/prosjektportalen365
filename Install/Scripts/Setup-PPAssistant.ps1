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
    3. gir admin-consent for «Prosjektportalen Assistent» (aapner nettleseren ved behov). Samme godkjenning
       dekker API-appens SharePoint-tilgang og Graph-tillatelsen Tasks.Read (Planner-oppgaver i prosjektet);
       mangler Tasks.Read-grantet hos en tidligere onboardet tenant, ber skriptet om consent paa nytt
    4. skriver secretene apiKey/apiBase/modelName (+ *Images) til Key Vault - kun ved endring
    5. gir assistent-appen rollen Key Vault Secrets User paa vaulten
    6. rapporterer SharePoint-tilgangen. «Sett som prosjektlogo» krever AllSites.FullControl, som
       IKKE deles ut som standard - bruk -GrantSharePointFullControl om dere vil ha funksjonen.

  Uten AI-parametrene kjoerer skriptet KUN steg 3 og 6. Det er modusen for en virksomhet som
  allerede er satt opp og bare trenger fornyet godkjenning - typisk Graph Tasks.Read for
  Planner-oppgaver - eller vil slaa logo-funksjonen av og paa.
    7. skriver ut AssistantConfig-JSON du limer inn i «Globale innstillinger», og informasjonen
       Prosjektportalen-teamet trenger for aa registrere tenanten din.

  Skriptet oppretter IKKE Foundry-ressurser/deployments og skriver IKKE til SharePoint.
  Trygt aa kjoere flere ganger (idempotent). Skriver aldri ut noekler.

  Foer noe skrives kjoerer en forhaandssjekk, og deretter vises en oppsummering med de
  OPPLOESTE verdiene: hvilken tenant hub-URL-en peker paa, hvilken konto du er logget inn som,
  hvilket abonnement, hvilken Key Vault og hvilke modeller. Det er stedet du oppdager at du er
  logget inn i feil tenant, eller er i ferd med aa skrive secrets til feil kundes vault.
  Ingenting er endret foer du har svart ja.

.PARAMETER HubUrl
  URL til portefoeljeomraadet (hub-siten) i Prosjektportalen, f.eks. https://kontoso.sharepoint.com/sites/pp365
.PARAMETER KeyVaultName
  Navn paa Key Vault (eksisterende eller ny). Standard: pp365-<tenantnavn>-kv. Opprettes automatisk hvis den
  mangler (i -ResourceGroupName, standard rg-prosjektportalen, som ogsaa opprettes ved behov). Bruk -NoCreate for aa
  nekte opprettelse.
.PARAMETER ChatApiBase
  Ressurs-roten til Azure AI Foundry/OpenAI, f.eks. https://<ressurs>.services.ai.azure.com (UTEN /openai/v1).
  Utelates denne (sammen med -ChatApiKey og -ChatDeployment), kjoerer skriptet KUN godkjenninger
  og tilgangsomfang - Key Vault, secrets og modelltest hoppes over. Det er modusen en virksomhet
  som allerede er satt opp trenger.
.PARAMETER ChatApiKey
  API-noekkel (SecureString). Bruk: (Read-Host -AsSecureString "Chat-noekkel")
.PARAMETER ChatDeployment
  Deployment-navn for chatmodellen (gpt-5-familien anbefales; navnet maa inneholde «gpt-5» for filvedlegg).
.PARAMETER GrantSharePointFullControl
  Gir appen AllSites.FullControl, som slaar paa «sett som prosjektlogo». Opt-in: uten den endres
  ingen SharePoint-tilgang, den bare rapporteres.
.PARAMETER RemoveSharePointFullControl
  Fjerner AllSites.FullControl igjen.
.PARAMETER Preflight
  Kjoer kun forhaandssjekken og skriv ut sjekklista. Endrer ingenting. Avslutningskode 1 hvis
  noe mangler.
.PARAMETER SkipConfirmation
  Hopp over oppsummeringen og bekreftelsen. For uovervaakede kjoeringer.
.PARAMETER ImagesApiBase
  Valgfritt: ressurs-rot for bildemodellen (gpt-image). Alle tre Images-parametre maa gis sammen.

.EXAMPLE
  ./Setup-PPAssistant.ps1 -HubUrl https://kontoso.sharepoint.com/sites/pp365 -KeyVaultName kv-kontoso-pp365 `
    -ChatApiBase https://kontoso-ai.services.ai.azure.com -ChatApiKey (Read-Host -AsSecureString "Chat-noekkel") `
    -ChatDeployment gpt-5.6 -ImagesApiBase https://kontoso-img.services.ai.azure.com `
    -ImagesApiKey (Read-Host -AsSecureString "Bilde-noekkel") -ImagesDeployment gpt-image-1.5 -CustomerName "Kontoso AS"

.EXAMPLE
  ./Setup-PPAssistant.ps1 -HubUrl https://kontoso.sharepoint.com/sites/pp365
  # Kun godkjenninger: fornyer admin-consent om noe mangler og rapporterer SharePoint-tilgangen.
  # Roerer ikke Key Vault eller secrets. Bruk denne naar assistenten allerede er satt opp.

.EXAMPLE
  ./Setup-PPAssistant.ps1 -HubUrl https://kontoso.sharepoint.com/sites/pp365 -Preflight
  # Kun forhaandssjekk: kontrollerer tenant, innlogging, Key Vault og godkjenninger, skriver ut
  # sjekklista og avslutter. Endrer ingenting.

.EXAMPLE
  ./Setup-PPAssistant.ps1 -HubUrl https://kontoso.sharepoint.com/sites/pp365 -GrantSharePointFullControl
  # Slaar paa «sett som prosjektlogo». -RemoveSharePointFullControl slaar den av igjen.

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

  # AI-parametrene er valgfrie, men maa gis sammen. Utelates de, kjoerer skriptet i
  # CONSENT-MODUS: kun godkjenninger og tilgangsomfang, ingen Key Vault og ingen secrets.
  # Det er det en virksomhet som allerede er satt opp trenger - da skal den ikke maatte grave
  # fram API-noekkelen sin bare for aa fornye en godkjenning.
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
  # Utgaatt: aa hoppe over er naa standard. Beholdt slik at eksisterende onboarding-skript ikke
  # feiler paa en ukjent parameter. Settes den, vinner den over -GrantSharePointFullControl.
  [Alias('SkipSharePointManage')]
  [switch] $SkipSharePointFullControl,
  # Fjerner AllSites.FullControl igjen. Slaar av «sett som prosjektlogo»; alt annet virker.
  [switch] $RemoveSharePointFullControl,
  [switch] $SkipModelTest,
  # Kjoer kun forhaandssjekken, skriv ut sjekklista og avslutt. Endrer ingenting.
  # Avslutningskoden er 1 hvis noe mangler, 0 ellers - brukbart i en pipeline.
  [switch] $Preflight,
  # Hopp over oppsummeringen og bekreftelsessproersmaalet. For uovervaakede kjoeringer.
  # Bruk den ikke naar du kjoerer mot en kundetenant for foerste gang - oppsummeringen er
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

# ---------------------------------------------------------------------------
# Forhaandssjekk
#
# Hver sjekk REGISTRERER resultatet sitt i stedet for aa kaste ved foerste feil.
# Da viser EN kjoering alt som mangler, framfor at du retter en ting, kjoerer paa
# nytt og faar neste vegg. MANGLER stopper kjoeringen (etter at alle sjekker har
# gaatt), ADVARSEL gjoer det ikke. Moensteret er laant fra bestillingsportalens
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
  Write-Host '#################### FORHAANDSSJEKK ####################' -ForegroundColor Magenta
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
  Oppsummering foer noe skrives, og et bekreftelsessproersmaal.

  Poenget er dobbeltverifisering: her staar de OPPLOESTE verdiene - hvilken tenant hub-URL-en
  faktisk peker paa, hvilken konto du er logget inn som, hvilket abonnement, hvilken vault
  (og om den finnes fra foer), hvilke Foundry-endepunkt og deployments. Det er stedet du
  oppdager at du er logget inn i feil tenant, eller er i ferd med aa skrive secrets til en
  vault som tilhoerer en annen kunde.

  Alt over dette punktet er lesing. Foerste skriving skjer etter at du har svart ja.
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
  Write-Host '  Naavaerende tilstand:' -ForegroundColor Yellow
  Write-Host "    Admin-consent:      $Consent"
  Write-Host "    SharePoint-scope:   $SharePointScope"
  Write-Host ''
  Write-Host '  Dette blir gjort:' -ForegroundColor Yellow

  function Write-PPPlan([string] $Merkelapp, [string] $Verdi, [bool] $Hoppet = $false) {
    if ($Hoppet) { Write-Host ('    {0,-20}(hoppes over)' -f "$($Merkelapp):") -ForegroundColor DarkGray }
    else { Write-Host ('    {0,-20}{1}' -f "$($Merkelapp):", $Verdi) }
  }

  Write-PPPlan 'Admin-consent' $(if ($ForceConsent) { 'Ber om godkjenning paa nytt (-ForceConsent)' } else { 'Kun hvis noe mangler' }) $SkipConsent
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
    throw 'Bildemodell: -ImagesApiBase, -ImagesApiKey og -ImagesDeployment maa gis sammen (eller ingen av dem).'
  }
  # Az.KeyVault trengs bare naar vi faktisk skal skrive secrets.
  $paakrevd = if ($fulltOppsett) { @('Az.Accounts', 'Az.KeyVault', 'Az.Resources') } else { @('Az.Accounts', 'Az.Resources') }
  $missing = $paakrevd | Where-Object { -not (Get-Module -ListAvailable -Name $_) }
  if ($missing) {
    throw "Mangler PowerShell-moduler: $($missing -join ', '). Installer med: Install-Module $($missing -join ', ') -Scope CurrentUser"
  }
  Write-Ok 'Parametre OK, Az-moduler installert'
  return $hasImages
}

function Import-PPAzModules {
  # Lastes foerst naar Azure trengs, slik at parameterfeil rapporteres foer tunge moduler.
  try {
    Import-Module Az.Accounts, Az.KeyVault, Az.Resources -ErrorAction Stop -WarningAction SilentlyContinue
  } catch {
    throw "Klarte ikke aa laste Az-modulene ($($_.Exception.Message)). Proev en ny pwsh-sesjon, eller oppdater: Update-Module Az.Accounts, Az.KeyVault, Az.Resources -Force"
  }

  # `Import-Module -ErrorAction Stop` fanger ikke alt. Er en modul installert, men har en
  # oedelagt avhengighet, kommer feilen som en ikke-terminerende assembly-lastefeil - og
  # skriptet ville ellers fortsatt helt til en forvirrende «Get-AzContext finnes ikke».
  foreach ($c in 'Get-AzContext', 'Get-AzADServicePrincipal', 'Invoke-AzRestMethod', 'Get-AzKeyVault') {
    if (-not (Get-Command $c -ErrorAction SilentlyContinue)) {
      throw "Az-modulene ser installerte ut, men $c finnes ikke - installasjonen er sannsynligvis oedelagt. Proev: Install-Module Az.Accounts, Az.KeyVault, Az.Resources -Force -Scope CurrentUser"
    }
  }
}

function Assert-PPApiBase([string] $Value, [string] $Name) {
  $uri = $null
  if (-not [Uri]::TryCreate($Value, [UriKind]::Absolute, [ref]$uri) -or $uri.Scheme -ne 'https') {
    throw "$Name maa vaere en https-URL."
  }
  if ($Value -match '/openai|/deployments|api-version' -or ($uri.AbsolutePath -notin @('', '/')) -or $uri.Query) {
    throw "$Name skal vaere ressurs-roten, f.eks. https://<ressurs>.services.ai.azure.com (uten /openai/v1, deployments eller api-version). Fikk: $Value"
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
    Write-Ok "Deployment '$Deployment' svarer paa $Base"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    $hint = switch ($status) { 401 { 'feil API-noekkel' } 404 { 'feil deployment-navn eller ressurs-rot' } default { $_.Exception.Message } }
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
  # Innlogging skal skje ogsaa under -WhatIf. `Connect-AzAccount` støtter selv ShouldProcess,
  # saa uten dette ble innloggingen bare simulert - og skriptet leste videre paa en gammel
  # kontekst mot en annen tenant og avbrøt. AA logge inn endrer ingenting i tenanten; det er
  # forutsetningen for i det hele tatt aa kunne lese status. Vi nuller preferansen i funksjonens
  # eget scope framfor aa sende -WhatIf:$false, som ville feilet om cmdleten manglet parameteren.
  $WhatIfPreference = $false
  $ctx = Get-AzContext -ErrorAction SilentlyContinue
  if (-not $ctx -or $ctx.Tenant.Id -ne $Tenant -or ($SubscriptionId -and $ctx.Subscription.Id -ne $SubscriptionId)) {
    $p = @{ Tenant = $Tenant }; if ($SubscriptionId) { $p.Subscription = $SubscriptionId }
    Connect-AzAccount @p | Out-Null
    $ctx = Get-AzContext
  }
  if ($ctx.Tenant.Id -ne $Tenant) { throw "Innlogget i tenant $($ctx.Tenant.Id), men hub-siten tilhoerer $Tenant. Avbryter." }
  Write-Ok "Tenant $($ctx.Tenant.Id), abonnement '$($ctx.Subscription.Name)'"
}

function Invoke-PPGraph([string] $Method, [string] $Uri, $Body) {
  # Samme grunn som i Connect-PPAzure: alle skrivende kall er allerede gated av ShouldProcess
  # hos kalleren, saa det eneste som når hit under -WhatIf er GET-ene statusrapporten bygger
  # på. Uten dette ville -WhatIf ikke fått lest noe, og rapporten meldt «MANGLER» paa alt.
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

  # Tre grants maa finnes: klient -> API (Assistant.Access), API -> SharePoint (OBO) og
  # API -> Graph med Tasks.Read (Planner-oppgaver, lagt til 2026-09-09). Det siste mangler hos
  # tenanter som ble onboardet foer det, og fanges her saa de faar re-consent i stedet for «alt ok».
  $ok = $false
  if ($assistantSp -and $apiSp) {
    $clientGrants = Get-PPGrants $assistantSp.Id
    $apiGrants    = Get-PPGrants $apiSp.Id
    $hasScope = $clientGrants | Where-Object { $_.resourceId -eq $apiSp.Id -and ($_.scope -split ' ') -contains 'Assistant.Access' }
    $hasObo   = $apiGrants    | Where-Object { $_.resourceId -eq $spSp.Id }
    $hasGraph = $apiGrants    | Where-Object { $_.resourceId -eq $graphSp.Id -and ($_.scope -split ' ') -contains 'Tasks.Read' }
    $ok = [bool]$hasScope -and [bool]$hasObo -and [bool]$hasGraph
    if ($hasScope -and $hasObo -and -not $hasGraph) { Write-Info 'Consent finnes, men mangler Graph Tasks.Read (Planner-oppgaver) - ber om godkjenning paa nytt.' }
  }

  if ($ok -and -not $ForceConsent) { Write-Ok 'Consent finnes allerede for begge apper (inkl. Tasks.Read)'; return $assistantSp }

  $url = "https://login.microsoftonline.com/$Tenant/adminconsent?client_id=$AssistantAppId&redirect_uri=$ConsentRedirect"
  Write-Info 'Godkjenn som administrator i nettleseren. Etter godkjenning vises en bekreftelsesside:'
  Write-Host "   $url" -ForegroundColor Yellow
  if (-not $PSCmdlet.ShouldProcess($Tenant, 'Aapne admin-consent i nettleser og vente paa godkjenning')) { return $assistantSp }
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
    Write-Host '   venter paa consent ...'
  } while ((Get-Date) -lt $deadline)
  throw 'Fikk ikke bekreftet consent innen 5 minutter. Kjoer skriptet igjen naar godkjenningen er gjort.'
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
    Write-Warning 'Vaulten har nettverksbegrensning (Deny). Prosjektportalen-teamets tjeneste maa kunne naa den - kontakt setup@prosjektportalen.no om hvitelisting.'
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
  if ($PSCmdlet.ShouldProcess($Vault.VaultName, 'Tildele Key Vault Secrets Officer til deg selv (for aa skrive secrets)')) {
    try {
      New-AzRoleAssignment -ObjectId $me -Scope $Vault.ResourceId -RoleDefinitionName 'Key Vault Secrets Officer' | Out-Null
      Write-Ok 'Key Vault Secrets Officer: tildelt deg selv (RBAC-propagering kan ta noen minutter - skriptet venter)'
      $script:SelfRoleJustAssigned = $true
    } catch {
      Write-Warning "Kunne ikke tildele deg selv Key Vault Secrets Officer ($($_.Exception.Message)). Krever Owner/User Access Administrator paa vaulten."
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
        if ($attempt -eq 1) { Write-Info 'Venter paa at Key Vault-rollen skal propagere ...' }
        Start-Sleep -Seconds 15
        continue
      }
      if ($isForbidden) { throw "Ingen skrivetilgang til vaulten etter venting. Gi deg selv rollen 'Key Vault Secrets Officer' paa '$($Vault.VaultName)' og kjoer igjen." }
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
    Write-Warning 'Ingen bildemodell oppgitt - logo-generering vil rapportere ai_configuration_incomplete. Kjoer igjen med -Images* for aa aktivere.'
  }
  if (Get-AzKeyVaultSecret -VaultName $Vault.VaultName -Name 'apiVersion' -ErrorAction SilentlyContinue) {
    Write-Info 'apiVersion/apiVersionImages er ikke lenger i bruk (kan slettes).'
  }
}

function Grant-PPKeyVaultAccess($Vault, $AssistantSp) {
  Write-Step 'Tilgang for «Prosjektportalen Assistent» til vaulten'
  if (-not $AssistantSp) { throw 'Assistent-appen finnes ikke i tenanten ennaa (consent mangler). Kjoer uten -SkipConsent.' }
  if ($Vault.EnableRbacAuthorization) {
    $existing = Get-AzRoleAssignment -ObjectId $AssistantSp.Id -Scope $Vault.ResourceId -RoleDefinitionName 'Key Vault Secrets User' -ErrorAction SilentlyContinue
    if ($existing) { Write-Ok 'Key Vault Secrets User: finnes'; return }
    if ($PSCmdlet.ShouldProcess($Vault.VaultName, 'Tildele Key Vault Secrets User til assistent-appen')) {
      New-AzRoleAssignment -ObjectId $AssistantSp.Id -Scope $Vault.ResourceId -RoleDefinitionName 'Key Vault Secrets User' | Out-Null
      Write-Ok 'Key Vault Secrets User: tildelt (kan ta opptil ~10 min foer den virker)'
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
  if (-not $AssistantSp) { Write-Warning 'Hopper over - assistent-appen finnes ikke ennaa.'; return }
  try {
    $spSp = Get-AzADServicePrincipal -ApplicationId $SharePointAppId
    $grant = Get-PPGrants $AssistantSp.Id | Where-Object { $_.resourceId -eq $spSp.Id } | Select-Object -First 1
    # @(...) rundt HELE if-en. Uten den enumereres output-stroemmen ved tilordning, og en
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
        throw "Ukjent SharePoint-scope: $($unknown -join ', '). Avbryter uten aa endre noe."
      }
      $scopes = $want -join ' '
      Invoke-PPGraph PATCH "$Graph/oauth2PermissionGrants/$($grant.id)" @{ scope = $scopes } | Out-Null
    } else {
      Invoke-PPGraph POST "$Graph/oauth2PermissionGrants" @{ clientId = $AssistantSp.Id; consentType = 'AllPrincipals'; resourceId = $spSp.Id; scope = 'AllSites.FullControl' } | Out-Null
    }
    Write-Ok 'AllSites.FullControl: gitt'
  } catch {
    Write-Warning "Kunne ikke gi AllSites.FullControl automatisk ($($_.Exception.Message)). Uten den virker alt unntatt «sett som prosjektlogo». Kan gjoeres senere av en Global Administrator."
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
      Write-Ok 'AllSites.FullControl er ikke gitt - ingenting aa fjerne.'
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
    if ($unknown.Count -gt 0) { throw "Ukjent SharePoint-scope: $($unknown -join ', '). Avbryter uten aa endre noe." }

    Invoke-PPGraph PATCH "$Graph/oauth2PermissionGrants/$($grant.id)" @{ scope = $scopes } | Out-Null
    Write-Ok "AllSites.FullControl fjernet. Nytt scope: $scopes"
  } catch {
    Write-Warning "Kunne ikke fjerne AllSites.FullControl ($($_.Exception.Message))."
  }
}

# Standardveien: rapporter hva appen har, endre ingenting. «Sett som prosjektlogo» krever
# AllSites.FullControl, og den deles bare ut naar noen ber om det med -GrantSharePointFullControl.
function Show-PPSharePointScopeStatus($AssistantSp) {
  Write-Step 'SharePoint-tilgang for «sett som prosjektlogo»'
  if (-not $AssistantSp) { return }
  try {
    $spSp = Get-AzADServicePrincipal -ApplicationId $SharePointAppId
    $grant = Get-PPGrants $AssistantSp.Id | Where-Object { $_.resourceId -eq $spSp.Id } | Select-Object -First 1
    # @(...) rundt HELE if-en. Uten den enumereres output-stroemmen ved tilordning, og en
    # ettelements liste kollapser til en String - da blir `+` strengkonkatenering framfor
    # array-append. Det skrev 'AllSites.WriteAllSites.FullControl' til en tenant.
    $existing = @(if ($grant) { ($grant.scope -split ' ') | Where-Object { $_ } })
    Write-Info "Naavaerende scope: $(if ($existing) { $existing -join ' ' } else { '(ingen)' })"
    if ($existing -contains 'AllSites.FullControl') {
      Write-Ok '«Sett som prosjektlogo» er tilgjengelig.'
      return
    }
  } catch {
    Write-Info "Kunne ikke lese naavaerende scope ($($_.Exception.Message))."
  }
  Write-Info '«Sett som prosjektlogo» er ikke aktivert. Alt annet i assistenten virker.'
  Write-Info 'Vil du ha den: kjoer paa nytt med -GrantSharePointFullControl. Tillatelsen er delegert -'
  Write-Info 'assistenten faar aldri mer tilgang enn den paalogde brukeren selv har.'
}

function Write-PPResult($Tenant, [string] $TenantName, $Vault, [bool] $HasImages, $AssistantSp) {
  $name = if ($CustomerName) { $CustomerName } else { $TenantName }
  $config = [ordered]@{ TenantId = $Tenant; ApiScope = $ApiScope } | ConvertTo-Json

  Write-Step 'Lim inn i Prosjektportalen -> Globale innstillinger -> «Konfigurasjonsoppsett for assistenten»'
  Write-Host $config -ForegroundColor Yellow
  Write-Info 'Har du allerede andre noekler der (PortfolioAccessGroups, DisabledOperations), behold dem og legg til TenantId og ApiScope.'
  Write-Info 'Sett deretter «Ta i bruk Prosjektportalen assistenten» (UseAssistant) til 1.'

  Write-Step "Send til Prosjektportalen-teamet: $HandoffMail  (emne: Assistent: $name)"
  $handoff = @"
Virksomhet:        $name
Tenant-id:         $Tenant
Tenant:            $TenantName.onmicrosoft.com
Hub-URL:           $($HubUrl.TrimEnd('/'))
Key Vault:         $($Vault.VaultName)
Bildemodell:       $(if ($HasImages) { 'ja' } else { 'nei' })
Consent gitt:      $(if ($AssistantSp) { 'ja' } else { 'nei/ukjent' })
Tidspunkt:         $(Get-Date -Format 'yyyy-MM-dd HH:mm')
"@
  Write-Host $handoff -ForegroundColor Yellow
  Write-Info 'Assistenten svarer «tenant_not_onboarded» til Prosjektportalen-teamet har registrert tenanten. Du faar bekreftelse paa e-post.'
}

# ---------------- Kjoering ----------------
# Rekkefoelgen er bevisst: ALT over Confirm-PPSetup er lesing. Foerste skriving skjer
# etter at bekreftelsen er gitt. Da kan oppsummeringen vise de oppløste verdiene -
# tenant, konto, abonnement, vault - mens det fortsatt er gratis aa avbryte.

# To moduser. Er AI-parametrene oppgitt, kjoeres fullt oppsett. Utelates de, kjoeres kun
# godkjenninger og tilgangsomfang - det en allerede oppsatt virksomhet trenger.
$fulltOppsett = [bool]$ChatApiBase -or [bool]$ChatApiKey -or [bool]$ChatDeployment
if ($fulltOppsett -and -not ($ChatApiBase -and $ChatApiKey -and $ChatDeployment)) {
  throw 'Chatmodell: -ChatApiBase, -ChatApiKey og -ChatDeployment maa gis sammen (eller ingen av dem, for kun godkjenninger).'
}
if (-not $fulltOppsett -and ($ImagesApiBase -or $ImagesApiKey -or $ImagesDeployment)) {
  throw 'Bildemodell kan ikke settes opp uten chatmodell. Oppgi -ChatApiBase/-ChatApiKey/-ChatDeployment ogsaa.'
}

Write-Step $(if ($fulltOppsett) { 'Modus: fullt oppsett' } else { 'Modus: kun godkjenninger og tilgangsomfang' })
if (-not $fulltOppsett) {
  Write-Info 'Ingen AI-parametre oppgitt. Key Vault, secrets og modelltest hoppes over.'
  Write-Info 'Vil du sette opp modellene ogsaa, kjoer med -ChatApiBase, -ChatApiKey og -ChatDeployment.'
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
      Add-PPCheck -Navn 'Chatmodellen svarer' -Status 'MANGLER' -Detalj $_.Exception.Message -Fiks 'Kontroller endepunkt, noekkel og deployment-navn i Azure AI Foundry (steg 1 i veiledningen).'
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

# Finnes vaulten fra foer? Avgjoer om oppsummeringen sier «gjenbrukes» eller «OPPRETTES».
$vaultFinnes = $false
if ($fulltOppsett) {
  $eksisterende = Get-AzKeyVault -VaultName $script:VaultName -ErrorAction SilentlyContinue
  if ($eksisterende) {
    $vaultFinnes = $true
    Add-PPCheck -Navn 'Key Vault' -Status 'OK' -Detalj "$($script:VaultName) finnes i $($eksisterende.ResourceGroupName)"
  } elseif ($NoCreate) {
    Add-PPCheck -Navn 'Key Vault' -Status 'MANGLER' -Detalj "$($script:VaultName) finnes ikke, og -NoCreate er angitt" -Fiks 'Opprett vaulten, eller kjoer uten -NoCreate.'
  } else {
    Add-PPCheck -Navn 'Key Vault' -Status 'OK' -Detalj "$($script:VaultName) opprettes i $ResourceGroupName/$Location"
  }
}

# Naavaerende godkjenninger og SharePoint-scope, til oppsummeringen. Rene oppslag.
$assistantSpNaa = Get-AzADServicePrincipal -ApplicationId $AssistantAppId -ErrorAction SilentlyContinue
$consentTekst = 'appen finnes ikke i tenanten ennaa (foerstegangsoppsett)'
$scopeTekst = '(ingen)'
if ($assistantSpNaa) {
  try {
    $spSpNaa = Get-AzADServicePrincipal -ApplicationId $SharePointAppId
    $grantNaa = Get-PPGrants $assistantSpNaa.Id | Where-Object { $_.resourceId -eq $spSpNaa.Id } | Select-Object -First 1
    $scopeNaa = @(if ($grantNaa) { ($grantNaa.scope -split ' ') | Where-Object { $_ } })
    if ($scopeNaa.Count -gt 0) { $scopeTekst = $scopeNaa -join ' ' }
    $consentTekst = 'appen er godkjent fra foer'
    Add-PPCheck -Navn 'Admin-consent' -Status 'OK' -Detalj 'appen finnes i tenanten'
  } catch {
    $consentTekst = 'kunne ikke leses'
    Add-PPCheck -Navn 'Admin-consent' -Status 'UKJENT' -Detalj $_.Exception.Message
  }
} else {
  Add-PPCheck -Navn 'Admin-consent' -Status 'MANGLER' -Detalj 'ikke gitt ennaa' -Fiks 'Skriptet aapner godkjenningssiden. Du maa vaere Global Administrator eller Privileged Role Administrator.'
}

$antallMangler = Show-PPChecklist
if ($Preflight) {
  Write-Info 'Kun forhaandssjekk (-Preflight). Ingenting er endret.'
  exit $(if ($antallMangler -gt 0) { 1 } else { 0 })
}
if ($antallMangler -gt 0) {
  throw "Forhaandssjekken fant $antallMangler ting som mangler (se over). Ingenting er endret."
}

Confirm-PPSetup $tenant $azContext $vaultFinnes $consentTekst $scopeTekst

# --- Fra og med her skrives det ---
$assistantSp = if ($SkipConsent) { $assistantSpNaa } else { Request-PPAdminConsent $tenant.Id }

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

if ($fulltOppsett) {
  Write-PPResult $tenant.Id $tenant.Name ($vault ?? @{ VaultName = $script:VaultName }) $hasImages $assistantSp
} else {
  Write-Step 'Ferdig'
  Write-Info 'Godkjenningene er kontrollert. Er virksomheten ikke registrert hos Prosjektportalen-teamet ennaa,'
  Write-Info "send tenant-id ($($tenant.Id)), hub-URL og Key Vault-navn til $HandoffMail."
  Write-Info 'Brukere maa laste assistenten paa nytt (F5) for at et nytt token skal hentes.'
}
