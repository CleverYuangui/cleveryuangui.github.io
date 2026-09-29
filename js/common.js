'use strict';
// DOM
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const html = document.documentElement;
const cs = getComputedStyle(document.documentElement);
function onReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

// EVENT RESPONSE
// Navigation for Mobile
const barsBtn = $('#barsBtn');
const navMenu = $('#navMenu');
function closeMobileMenu() {
    navMenu?.classList.remove('open');
    barsBtn?.setAttribute('aria-expanded', 'false');
}
function toggleMobileMenu() {
    const isOpen = navMenu?.classList.contains('open');
    navMenu?.classList.toggle('open');
    barsBtn?.setAttribute('aria-expanded', !isOpen);
}
barsBtn?.addEventListener('click', toggleMobileMenu);
document.addEventListener('click', function(e) {
    if (!barsBtn?.contains(e.target) && !navMenu?.contains(e.target)) {
        closeMobileMenu();
    }
});
// Theme
const themeLight = $('#themeLight');
const themeDark = $('#themeDark');
const themeMobile = $('#themeMobile');
function setTheme(theme, storage) {
    html.setAttribute('data-theme', theme);
    if (storage) {
        try {
            localStorage.setItem('theme', theme);
        } catch (_) {}
    }
}
themeLight?.addEventListener('click', function(e) {
    setTheme('light', true);
});
themeDark?.addEventListener('click', function(e) {
    setTheme('dark', true);
});
themeMobile?.addEventListener('click', function(e) {
    const theme = html.getAttribute('data-theme');
    if (theme === 'dark') {
        setTheme('light', true);
    } else {
        setTheme('dark', true);
    }
});
function loadTheme() {
    let saved = null;
    try {
        const stored = localStorage.getItem('theme');
        if (stored === 'light' || stored === 'dark') {
            saved = stored;
        }
    } catch (_) {}
    if (saved === null) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark', false)
        }
    } else {
        setTheme(saved, true);
    }
}
onReady(loadTheme);
// Language
const langToggle = $('#langToggle');
const langDropdown = $('#langDropdown');
function closeLangDropdown() {
    langDropdown?.classList.remove('open');
    langToggle?.classList.remove('open');
    langToggle?.setAttribute('aria-expanded', 'false');
}
function toggleLangDropdown() {
    const isOpen = langDropdown?.classList.contains('open');
    langDropdown?.classList.toggle('open');
    langToggle?.classList.toggle('open');
    langToggle?.setAttribute('aria-expanded', !isOpen);
}
langToggle?.addEventListener('click', toggleLangDropdown);
document.addEventListener('click', function(e) {
    if (!langToggle?.contains(e.target) && !langDropdown?.contains(e.target)) {
        closeLangDropdown();
    }
});
function setLang() {
    const lang = html.getAttribute('lang');
    try {
        localStorage.setItem('lang', lang);
    } catch (_) {}
}
onReady(setLang);
// Others
function closeAll() {
    closeMobileMenu();
    closeLangDropdown();
}
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAll();
    }
});