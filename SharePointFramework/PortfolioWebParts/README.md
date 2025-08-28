# PortfolioWebParts

_Publiseres til **npm** som `pp365-portfoliowebparts`_

## PortfolioAggregation

Webdel for dynamisk presentasjon av data fra forskjellige kilder spesifisert i datakildelisten (tilgjengelig gjennom konfigurasjonssiden).

Denne webdelen brukes på risikooversikten, leveranseoversikten og erfaringsloggsidene.

### Første gangs oppsett

Når du legger til webdelen første gang, må du spesifisere et datakildenavn:

![image-20210219110017427](assets/image-20210219110017427.png)

Rediger webdelen og sett egenskapen **Datakilde**:

<img src="assets/image-20210219110113413.png" alt="image-20210219110113413" style="zoom:80%;" />

Du kan også justere noen andre innstillinger:

![image-20210219110133325](assets/image-20210219110133325.png)

Når du har satt en datakilde (**Datakilde**), bør noen data være synlige (hvis tilgjengelig).

### Legge til tilpassede kolonner

Du vil bare ha prosjektnavnet / områdenavnet i begynnelsen, så du må legge til flere kolonner. Når du er i redigeringsmodus, vil en kolonneoverskrift med **Legg til kolonne** være synlig til høyre (_akkurat som i moderne SharePoint-lister_).

![image-20210219110311816](assets/image-20210219110311816.png)

Klikk på kolonneoverskriften for å åpne kolonnepanelet:

![image-20210219110437180](assets/image-20210219110437180.png)

### Justere kolonner

Når du er i redigeringsmodus, får du noen ekstra kommandoer i kolonnekontekstmenyen.

![image-20210219110649076](assets/image-20210219110649076.png)

Du kan flytte kolonnene til venstre eller høyre, eller redigere kolonnen.

### Slette kolonner

Når du redigerer en kolonne, har du muligheten til å slette kolonnen.

![image-20210219110744959](assets/image-20210219110744959.png)

## Serve

- Ta en kopi av `config/serve.sample.json` og gi den navnet `serve.json`
- Kjør `npm run serve`
