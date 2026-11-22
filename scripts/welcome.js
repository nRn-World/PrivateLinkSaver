// PrivateLinkSaver – Interactive 5-step Onboarding Guide
(function () {
  const I18N = {
    sv: {
      s0_title: 'Ditt privata valv är redo',
      s0_sub: 'Spara, organisera och kryptera dina länkar bakom ett huvudlösenord — helt utan spårning.',
      s0_notice_title: 'Viktigt om säkerhet',
      s0_notice_text: 'Dina länkar krypteras lokalt på din enhet. Om du glömmer ditt huvudlösenord kan det inte återställas — kom ihåg att spara det säkert.',
      s0_cta: 'Starta snabbguiden (5 steg)',
      s1_step: 'Steg 1',
      s1_title: 'Fäst tillägget i verktygsfältet',
      s1_sub: 'Klicka på pusselbiten uppe till höger i Chrome och nåla fast PrivateLinkSaver för åtkomst med ett klick.',
      s1_mock_ext: 'Tillägg',
      s2_step: 'Steg 2',
      s2_title: 'Aktivera i inkognitoläge',
      s2_sub: 'Slå på "Tillåt i inkognito" under tilläggets inställningar så du kan spara och öppna hemliga länkar även i privata fönster.',
      s2_pin_label: 'Fäst i verktygsfältet',
      s2_pin_desc: 'Visa ikonen bredvid adressfältet',
      s2_incog_label: 'Tillåt i inkognito',
      s2_incog_desc: 'Använd PrivateLinkSaver i inkognitofönster utan att spara historik.',
      s2_btn: 'Öppna tilläggsinställningar i Chrome',
      s3_step: 'Steg 3',
      s3_title: 'Snabbkommandon & Sidopanel',
      s3_sub: 'Arbeta blixtsnabbt med tangentbordet eller öppna valvet i Chromes sidopanel medan du surfar.',
      s3_k1: 'Spara aktuell sida direkt',
      s3_k2: 'Spara alla öppna flikar',
      s3_k3: 'Öppna PrivateLinkSaver',
      s3_k4: 'Sök bokmärken i adressfältet',
      s3_btn: 'Anpassa kortkommandon i Chrome',
      s4_title: 'Utforska funktionerna',
      s4_sub: 'Allt du behöver för ett säkert och organiserat privat bokmärkesvalv.',
      f1_t: 'Lösenord & AES-256', f1_d: 'Lås alla länkar bakom ett huvudlösenord med valfri lokal AES-256-kryptering.',
      f2_t: 'Sidopanel-läge', f2_d: 'Ha ditt valv öppet i Chromes sidopanel medan du surfar mellan sidor.',
      f3_t: 'Inkognito-stöd', f3_d: 'Spara och öppna privata länkar direkt i inkognitofönster utan spår.',
      f4_t: 'Spara alla flikar', f4_d: 'Spara hela din webbläsarsession med ett klick — dubbletter hoppas över.',
      f5_t: 'Mappar & Pastelltaggar', f5_d: 'Organisera med färgkodade mappflikar, smarta taggförslag och flerval.',
      f6_t: 'Blixtsnabb sök & pls', f6_d: 'Hitta länkar direkt med Ctrl+K eller skriv "pls" i adressfältet.',
      f7_t: 'Panikknapp', f7_d: 'Lås valvet och stäng popupen omedelbart med ett enda klick.',
      f8_t: 'Öppna hel mapp', f8_d: 'Starta alla sparade länkar i en mapp samtidigt i nya flikar.',
      f9_t: 'Krypterad molnsynk', f9_d: 'Valfri molnbackup som krypteras på din enhet innan uppladdning.',
      f10_t: 'Import & Export', f10_d: 'Importera från Chrome-bokmärken eller exportera till JSON, HTML och CSV.',
      f11_t: 'Lösenordsgenerator', f11_d: 'Skapa ett kryptografiskt starkt huvudlösenord med ett klick.',
      f12_t: 'Auto-lås & Integritet', f12_d: 'Låser automatiskt vid inaktivitet, rensar spårningslänkar och döljer ikoner.',
      s4_open_panel: 'Öppna i sidopanelen',
      s4_done: 'Stäng guiden',
      prev: 'Tillbaka',
      next: 'Nästa',
      finish: 'Klar'
    },
    en: {
      s0_title: 'Your private vault is ready',
      s0_sub: 'Save, organize, and encrypt your links behind a master password — with zero tracking.',
      s0_notice_title: 'Security Notice',
      s0_notice_text: 'Your links are encrypted locally on your device. If you forget your master password, it cannot be recovered — keep it somewhere safe.',
      s0_cta: 'Start quick tour (5 steps)',
      s1_step: 'Step 1',
      s1_title: 'Pin the extension',
      s1_sub: 'Click the puzzle icon in Chrome’s toolbar and pin PrivateLinkSaver for one-click access.',
      s1_mock_ext: 'Extensions',
      s2_step: 'Step 2',
      s2_title: 'Allow in Incognito',
      s2_sub: 'Turn on "Allow in Incognito" in extension settings so you can save and open private links in Incognito windows.',
      s2_pin_label: 'Pin to toolbar',
      s2_pin_desc: 'Show the icon next to the address bar',
      s2_incog_label: 'Allow in Incognito',
      s2_incog_desc: 'Use PrivateLinkSaver in Incognito windows without saving history.',
      s2_btn: 'Open extension settings in Chrome',
      s3_step: 'Step 3',
      s3_title: 'Shortcuts & Side Panel',
      s3_sub: 'Work faster with keyboard shortcuts or keep your vault open in Chrome’s Side Panel.',
      s3_k1: 'Save current page instantly',
      s3_k2: 'Save all open tabs',
      s3_k3: 'Open PrivateLinkSaver',
      s3_k4: 'Search bookmarks in address bar',
      s3_btn: 'Customize shortcuts in Chrome',
      s4_title: 'Explore features',
      s4_sub: 'Everything you need for a private, organized bookmark vault.',
      f1_t: 'Password & AES-256', f1_d: 'Lock links behind a master password with optional local AES-256 encryption.',
      f2_t: 'Side Panel Mode', f2_d: 'Keep your vault docked in Chrome’s Side Panel while browsing.',
      f3_t: 'Incognito Support', f3_d: 'Save and access private links directly inside Incognito windows.',
      f4_t: 'Save All Open Tabs', f4_d: 'Save your entire browser session in one click — duplicates skipped.',
      f5_t: 'Folders & Pastel Tags', f5_d: 'Organize with colored folder chips, smart tag suggestions & bulk actions.',
      f6_t: 'Instant Search & pls', f6_d: 'Find links immediately with Ctrl+K or type "pls" in the address bar.',
      f7_t: 'Panic Button', f7_d: 'Lock your vault and close the popup immediately with a single click.',
      f8_t: 'Open Entire Folder', f8_d: 'Launch every saved link in a folder at once in new tabs.',
      f9_t: 'Encrypted Cloud Sync', f9_d: 'Optional cloud backup encrypted on your device before upload.',
      f10_t: 'Import & Export', f10_d: 'Import from Chrome bookmarks or export to JSON, HTML & CSV anytime.',
      f11_t: 'Password Generator', f11_d: 'Generate a cryptographically strong master password in one click.',
      f12_t: 'Auto-Lock & Privacy', f12_d: 'Automatic inactivity lock, tracking-param stripping & favicon hiding.',
      s4_open_panel: 'Open in Side Panel',
      s4_done: 'Close guide',
      prev: 'Back',
      next: 'Next',
      finish: 'Done'
    }
  };

  let currentStep = 0;
  let lang = 'en';
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dots = Array.from(document.querySelectorAll('.dot'));
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const themeBtn = document.getElementById('theme-btn');

  function applyLang(nextLang) {
    lang = I18N[nextLang] ? nextLang : 'en';
    const dict = I18N[lang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll('.pill-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    updateNav();
  }

  function updateNav() {
    slides.forEach((s, i) => s.classList.toggle('active', i === currentStep));
    dots.forEach((d, i) => d.classList.toggle('active', i === currentStep));
    prevBtn.disabled = currentStep === 0;
    const nextSpan = nextBtn.querySelector('span');
    if (nextSpan) {
      nextSpan.textContent = currentStep === slides.length - 1 ? I18N[lang].finish : I18N[lang].next;
    }
  }

  function goTo(step) {
    if (step < 0) step = 0;
    if (step >= slides.length) {
      window.close();
      return;
    }
    currentStep = step;
    updateNav();
  }

  prevBtn.addEventListener('click', () => goTo(currentStep - 1));
  nextBtn.addEventListener('click', () => goTo(currentStep + 1));
  document.getElementById('start-tour-btn').addEventListener('click', () => goTo(1));
  dots.forEach((dot) => dot.addEventListener('click', () => goTo(Number(dot.dataset.goto))));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goTo(currentStep + 1);
    if (e.key === 'ArrowLeft') goTo(currentStep - 1);
  });

  document.querySelectorAll('.pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });

  themeBtn.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeBtn.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  });

  document.getElementById('open-ext-settings-btn').addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime) {
      chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
    }
  });

  document.getElementById('open-shortcuts-btn').addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    }
  });

  const spBtn = document.getElementById('open-sidepanel-btn');
  spBtn.addEventListener('click', async () => {
    if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.open) {
      try {
        const win = await chrome.windows.getCurrent();
        await chrome.sidePanel.open({ windowId: win.id });
        return;
      } catch (_e) {}
    }
    window.close();
  });

  document.getElementById('finish-btn').addEventListener('click', () => window.close());

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['language', 'darkMode'], (res) => {
      if (res && res.language) applyLang(res.language === 'sv' ? 'sv' : 'en');
      if (res && res.darkMode === false) {
        document.body.setAttribute('data-theme', 'light');
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
      }
    });
  }

  applyLang(lang);
})();
