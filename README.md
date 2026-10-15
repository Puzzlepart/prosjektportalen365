<!-- ⚠️ This README has been generated from the file(s) ".README" ⚠️--><p align="center">
  <img src="assets/pp365_logo.png" alt="Logo" width="119" height="119" />
</p> <p align="center">
  <b>Prosjektportalen er et prosjektstyringsverktøy for Microsoft 365 basert på Prosjektveiviseren.</b></br>
  <sub>Prosjektportalen for Microsoft 365 er åpen kildekode, og forvaltes og videreutvikles av Prosjektportalen-teamet. Løsningen inneholder Microsoft 365- og SharePoint-tilpasninger som til sammen utgjør et prosjektstyringsverktøy.<sub>
</p>

<br />


[![version](https://img.shields.io/badge/version-1.14.1-green.svg)](https://semver.org)

<details>
<summary>📖 Innholdsfortegnelse</summary>
<br />

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#table-of-contents)

## ➤ Table of Contents

* [➤ Hva er Prosjektportalen for Microsoft 365?](#-hva-er-prosjektportalen-for-microsoft-365)
* [➤ Installering og oppgradering](#-installering-og-oppgradering)
* [➤ Kontakt](#-kontakt)
* [➤ Nettleserstøtte](#-nettlesersttte)
* [➤ Contributors](#-contributors)
* [➤ Utvikling](#-utvikling)
</details>


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#hva-er-prosjektportalen-for-microsoft-365)

## ➤ Hva er Prosjektportalen for Microsoft 365?

Prosjektportalen er et prosjektstyringsverktøy for Microsoft 365, bygget på [Prosjektveiviseren](https://prosjektveiviseren.digdir.no/), Digitaliseringsdirektoratets anbefalte prosjektmodell. Løsningen installeres i virksomhetens egen Microsoft 365-tenant. Det settes opp et porteføljeområde som gir oversikt over prosjektene, og der brukerne kan opprette nye prosjekter fra maler. Hvert prosjektområde opprettes som en Microsoft 365-gruppe, med lister, standardinnhold og logikk for å gjennomføre prosjektet etter Prosjektveiviserens modell.

Prosjektportalen er åpen kildekode under MIT-lisensen, og alle står fritt til å ta den i bruk uten lisenskostnader eller bindinger. Løsningen forvaltes og videreutvikles av Prosjektportalen-teamet, som primært består av ansatte hos SoftwareOne.

Første versjon ble utviklet for Asker kommune og KommIT av Puzzlepart, som senere ble en del av Crayon og i dag er en del av SoftwareOne. Siden har videreutviklingen vært et spleiselag mellom Prosjektportalen-teamet og kundene. Ny funksjonalitet finansieres i stor grad av *kundesponsorer*: virksomheter som betaler for en forbedring de trenger, som deretter blir tilgjengelig for alle.

Mer om løsningen, hvordan den er satt opp, og eierskap, drift og forvaltning står på [wiki-sidene til Prosjektportalen](https://github.com/Puzzlepart/prosjektportalen365/wiki).




[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#installering-og-oppgradering)

## ➤ Installering og oppgradering

Prosjektportalen kan lastes ned fra [releases](https://github.com/Puzzlepart/prosjektportalen365/releases/latest). Installasjon, oppgradering, konfigurasjon og feilsøking er beskrevet på [wiki-sidene til Prosjektportalen](https://github.com/Puzzlepart/prosjektportalen365/wiki).

Installasjonsskriptet sender én melding til Prosjektportalen-teamet når installasjonen er ferdig, slik at teamet ser hvilke versjoner som er i bruk: adressen til porteføljeområdet, versjon, kanal, tidspunkt og navnene på parameterne som ble brukt. Fra versjon 1.15 inneholder meldingen ikke brukernavn eller parameterverdier, og den kan slås av med `-SkipPingback`. Se [Grunnlag for DPIA og ROS](https://github.com/Puzzlepart/prosjektportalen365/wiki/Grunnlag-for-DPIA-og-ROS) for hva som sendes ut av tenanten.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#kontakt)

## ➤ Kontakt

| Hva | Hvor |
| --- | --- |
| Forvaltningsavtale, bistand, videreutvikling og kundesponsing | [kontakt@prosjektportalen.no](mailto:kontakt@prosjektportalen.no) |
| Tekniske spørsmål om installasjon og oppsett | [setup@prosjektportalen.no](mailto:setup@prosjektportalen.no) |
| Feil og forslag til forbedringer | [Issues på GitHub](https://github.com/Puzzlepart/prosjektportalen365/issues) |

Prosjektportalen er ikke et produkt som selges, og har ingen garantier for feilretting, oppgradering eller support. Prosjektportalen-teamet tilbyr forvaltningsavtale for virksomheter som ønsker det. Bistand utover dokumentasjonen er en fakturerbar tjeneste.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#nettlesersttte)

## ➤ Nettleserstøtte

Prosjektportalen følger Microsofts retningslinjer for hvilke nettlesere som støttes i Microsoft 365. Noen eldre nettlesere har dårlig støtte og anbefales ikke. Se oppdatert oversikt hos Microsoft på [Hvilke nettlesere som fungerer med Microsoft 365 for nettet og Microsoft 365-tillegg](https://support.microsoft.com/nb-no/office/hvilke-nettlesere-som-fungerer-med-microsoft-365-for-nettet-og-microsoft-365-tillegg-ad1303e0-a318-47aa-b409-d3a5eb44e452) 


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#contributors)

## ➤ Contributors
	

| [Tarjei Ormestøyl](https://github.com/tarjeieo) | [Remi Blom-Ohlsen](https://github.com/Remi749) |
|:-------------------------------------------------:|:------------------------------------------------:|



Prosjektportalen-teamet har mange flere aktive bidragsytere enn de som står over, og alle fortjener en takk. Bidrag fra andre virksomheter er sjeldne, men svært velkomne, både som issues og pull requests.

Takk også til tidligere utviklere for innsatsen gjennom årene. De har bidratt til at løsningen er der den er i dag.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#utvikling)

## ➤ Utvikling

Vennligst les [Utviklingsguiden](./.development-guide/README.md).
