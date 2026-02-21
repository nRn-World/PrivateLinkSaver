# PrivateLinkSaver Pro 🔐

En modern och professionell Chrome extension för att spara och organisera dina länkar privat och säkert med lösenordsskydd.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome](https://img.shields.io/badge/chrome-%E2%9C%93-brightgreen)

## 🌟 Funktioner

### 🔒 Säkerhet
- **Lösenordsskydd**: Säkra dina bokmärken med SHA-256 hashing
- **Kryptering**: AES-256-GCM kryptering för känslig data
- **Automatisk utloggning**: Konfigurerbar timeout för ökad säkerhet

### 📁 Organisation
- **Mappar**: Skapa obegränsade mappar med anpassade färger
- **Taggar**: Tagga dina bokmärken för enkel filtrering
- **Favoriter**: Markera viktiga bokmärken
- **Sök**: Kraftfull sökfunktion med fuzzy matching

### 🎨 Anpassning
- **Mörkt/Ljust tema**: Växla mellan teman eller följ systemet
- **5 Språk**: Svenska, Engelska, Turkiska, Spanska, Franska
- **Anpassningsbar UI**: Modern design med animationer

### 📊 Statistik
- **Översikt**: Se totalt antal bokmärken, mappar och taggar
- **Topp domäner**: Se vilka webbplatser du sparar mest
- **Besöksräknare**: Spåra hur ofta du besöker dina bokmärken

### 💾 Datahantering
- **Export/Import**: JSON, CSV, HTML format
- **Automatisk backup**: Dagliga backuper
- **Återställning**: Återställ från tidigare backuper

### ⌨️ Produktivitet
- **Tangentbordsgenvägar**: Snabb åtkomst med kortkommandon
- **Kontextmeny**: Högerklicka för att spara länkar
- **Omnibox**: Sök i bokmärken från adressfältet (skriv "pls")

## 🚀 Installation

### Från Chrome Web Store (Rekommenderas)

1. Besök [Chrome Web Store](https://chrome.google.com/webstore) (kommer snart)
2. Sök efter "PrivateLinkSaver Pro"
3. Klicka "Lägg till i Chrome"

### Från Source (Developer Mode)

1. Ladda ner den senaste versionen som .zip
2. Packa upp filerna
3. Öppna Chrome och gå till `chrome://extensions/`
4. Aktivera "Developer mode" i övre högra hörnet
5. Klicka på "Load unpacked"
6. Välj mappen med uppackade filer
7. Klart!

## 📖 Användning

### Första gången

1. Klicka på tilläggsikonen i verktygsfältet
2. Skapa ett säkert lösenord (minst 6 tecken)
3. Logga in med ditt lösenord
4. Börja spara dina favoritsidor!

### Spara Länkar

- **Via popup**: Klicka på tilläggsikonen → "Spara aktuell sida"
- **Kontextmeny**: Högerklicka på en länk → "Spara länk till PrivateLinkSaver"
- **Tangentbordsgenväg**: Tryck `Ctrl+Shift+S` (Windows) eller `Cmd+Shift+S` (Mac)

### Organisera

- Skapa nya mappar med olika färger
- Flytta bokmärken mellan mappar
- Lägg till taggar för bättre filtrering
- Sök bland dina bokmärken

### Tangentbordsgenvägar

| Genväg | Funktion |
|--------|----------|
| `Ctrl+Shift+S` | Spara aktuell sida |
| `Ctrl+Shift+B` | Öppna PrivateLinkSaver |
| `Ctrl+Shift+F` | Snabbsökning |
| `Ctrl+K` | Fokusera sökfält |
| `Ctrl+N` | Skapa ny mapp |
| `Ctrl+D` | Spara aktuell sida |
| `Escape` | Rensa sökning |

## 🔒 Säkerhet

- **Lösenord**: Hashas med SHA-256 och en unik 16-byte salt
- **Kryptering**: AES-256-GCM för känslig data
- **Lokal lagring**: All data sparas lokalt i din webbläsare
- **Inga servrar**: Ingen data skickas till externa servrar

## 📁 Projektstruktur

```
PrivateLinkSaverPro/
├── manifest.json          # Extension-konfiguration
├── popup.html            # Popup UI
├── options.html          # Inställningssida
├── styles/
│   └── popup.css         # Stilar
├── scripts/
│   ├── popup.js          # Popup-logik
│   ├── background.js     # Service worker
│   ├── options.js        # Inställningar
│   ├── storage.js        # Lagringsfunktioner
│   ├── crypto.js         # Kryptering
│   └── translations.js   # Översättningar
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── _locales/             # Översättningar
│   ├── sv/
│   ├── en/
│   ├── tr/
│   ├── es/
│   └── fr/
├── README.md
├── PRIVACY.md
└── LICENSE
```

## 🛠️ Teknologier

- **Manifest V3**: Senaste Chrome Extension-standarden
- **Vanilla JavaScript**: Inga externa dependencies
- **Web Crypto API**: Säker kryptering
- **Chrome Storage API**: Lokal datalagring
- **CSS Variables**: Dynamiska teman
- **Font Awesome**: Ikoner
- **Google Fonts**: Inter typsnitt

## 📝 Changelog

### Version 2.0.0 (2026-01-30)

- ✨ **NYTT**: Komplett UI-översyn med modern design
- ✨ **NYTT**: Taggsystem för bättre organisation
- ✨ **NYTT**: Statistik och insights
- ✨ **NYTT**: Automatisk backup
- ✨ **NYTT**: Omnibox-integration (sök med "pls")
- ✨ **NYTT**: Besöksräknare
- ✨ **NYTT**: Topp domäner-visning
- ✨ **NYTT**: Förbättrad sök med fuzzy matching
- ✨ **NYTT**: Inställningssida (options.html)
- 🔒 **FÖRBÄTTRAT**: Starkare kryptering (AES-256-GCM)
- 🔒 **FÖRBÄTTRAT**: Lösenordsstyrke-indikator
- 🎨 **FÖRBÄTTRAT**: Mörkt/ljust tema
- 🌍 **FÖRBÄTTRAT**: Full i18n-stöd
- ⚡ **FÖRBÄTTRAT**: Prestandaoptimeringar

### Version 1.0.0 (2026-01-15)

- 🎉 Initial release
- 🔒 Lösenordsskydd med SHA-256
- 📁 Mapp-funktionalitet
- 🌍 Flerspråkigt stöd
- 🎨 Mörkt/ljust tema
- 📤 Export/Import

## 🤝 Bidra

Bidrag är välkomna! Följ dessa steg:

1. Forka repositoryt
2. Skapa en feature branch (`git checkout -b feature/amazing-feature`)
3. Commita dina ändringar (`git commit -m 'Add amazing feature'`)
4. Pusha till branchen (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

## 📄 Licens

Detta projekt är licensierat under MIT License - se [LICENSE](LICENSE) för detaljer.

## 👨‍💻 Författare

**Robin Ayzit**

- Buy Me a Coffee: [buymeacoffee.com/robinayzit](https://buymeacoffee.com/robinayzit)

## 🙏 Support

Om du gillar detta projekt, överväg att:

- ⭐ Ge projektet en stjärna på GitHub
- ☕ [Köp mig en kaffe](https://buymeacoffee.com/robinayzit)
- 📢 Dela med dina vänner

## ❓ FAQ

**F: Är mina data säkra?**
A: Ja! All data sparas lokalt i din Chrome-webbläsare och krypteras med ditt lösenord. Ingen data skickas till externa servrar.

**F: Kan jag synkronisera mellan enheter?**
A: För närvarande stöds endast lokal lagring. Cloud sync planeras i framtida versioner.

**F: Vad händer om jag glömmer mitt lösenord?**
A: För säkerhets skull finns ingen "glömt lösenord" funktion. Se till att exportera dina bokmärken regelbundet som backup!

**F: Hur tar jag bort alla data?**
A: Gå till Inställningar → Farozon → "Radera all data". Detta kan inte ångras!

**F: Kan jag importera från andra bokmärkeshanterare?**
A: Ja! Du kan importera från JSON-filer. Stöd för Chrome och Firefox import kommer snart.

---

<p align="center">Gjord med ❤️ av Robin Ayzit</p>
