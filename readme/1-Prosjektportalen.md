## Hva er Prosjektportalen for Microsoft 365?

Prosjektportalen er et prosjektstyringsverktøy for Microsoft 365, bygget på [Prosjektveiviseren](https://prosjektveiviseren.digdir.no/), Digitaliseringsdirektoratets anbefalte prosjektmodell. Løsningen installeres i virksomhetens egen Microsoft 365-tenant. Det settes opp et porteføljeområde som gir oversikt over prosjektene, og der brukerne kan opprette nye prosjekter fra maler. Hvert prosjektområde opprettes som en Microsoft 365-gruppe, med lister, standardinnhold og logikk for å gjennomføre prosjektet etter Prosjektveiviserens modell.

Prosjektportalen er åpen kildekode under MIT-lisensen, og alle står fritt til å ta den i bruk uten lisenskostnader eller bindinger. Løsningen forvaltes og videreutvikles av Prosjektportalen-teamet, som primært består av ansatte hos SoftwareOne.

Første versjon ble utviklet for Asker kommune og KommIT av Puzzlepart, som senere ble en del av Crayon og i dag er en del av SoftwareOne. Siden har videreutviklingen vært et spleiselag mellom Prosjektportalen-teamet og kundene. Ny funksjonalitet finansieres i stor grad av *kundesponsorer*: virksomheter som betaler for en forbedring de trenger, som deretter blir tilgjengelig for alle.

Mer om løsningen, hvordan den er satt opp, og eierskap, drift og forvaltning står på [wiki-sidene til Prosjektportalen](https://github.com/Puzzlepart/prosjektportalen365/wiki).

## Prosjektportalen Assistenten

Prosjektportalen har en KI-assistent som åpnes fra footeren. Den kan blant annet oppsummere statusrapporter, svare på spørsmål om prosjektet og porteføljen, foreslå listeinnhold og lage utkast til sluttrapport. Assistenten er slått av som standard, og krever eget oppsett med KI-tjenester i virksomhetens eget Azure-abonnement.

- [PP Assistenten](https://github.com/Puzzlepart/prosjektportalen365/wiki/PP-Assistenten) - hva assistenten er og hvilke operasjoner den har
- [Oppsett av PP Assistenten](https://github.com/Puzzlepart/prosjektportalen365/wiki/Oppsett-av-PP-Assistenten) - Microsoft Foundry, Key Vault, oppsettsskriptet og registrering
- [Konfigurasjon av PP Assistenten](https://github.com/Puzzlepart/prosjektportalen365/wiki/Konfigurasjon-av-PP-Assistenten) - globale innstillinger, tilgangsstyring og hva hvert felt gjør
- [Sikkerhet i PP Assistenten](https://github.com/Puzzlepart/prosjektportalen365/wiki/Sikkerhet-i-PP-Assistenten) - dataflyt, tilganger, telemetri og anbefalinger for sikkerhetsansvarlige
- [Endringslogg for PP Assistenten](https://github.com/Puzzlepart/prosjektportalen365/wiki/Endringslogg-PP-Assistenten) - hva som er nytt i hver versjon
