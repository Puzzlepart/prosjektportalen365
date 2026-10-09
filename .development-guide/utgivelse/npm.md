## NPM

SPFx-løsningene publiseres ikke lenger til npm. Siste versjon der er 1.8.4, fra august 2023, av `pp365-portfoliowebparts`, `pp365-portfolioextensions`, `pp365-programwebparts`, `pp365-projectwebparts` og `pp365-projectextensions`. `pp365-shared-library` finnes ikke på npm.

I repoet henter løsningene hverandre som Rush-prosjekter (`"pp365-shared-library": "workspace:*"`), så ingen bygg trenger pakkene fra npm.

Hver løsning har likevel `postversion`-skriptet `heft build --production && npm publish`. Kjør derfor aldri `npm version` eller `npm publish` inne i en løsning. Versjonen settes fra roten; se [Opprettelse av en ny versjon](opprette-ny-versjon.md).
