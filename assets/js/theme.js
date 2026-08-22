// The colour-scheme selector from mvaled.github.io, unchanged in behaviour: a choice is remembered
// in localStorage, and "auto" means whatever the system asks for, tracked live.
const validUserSelectedSchemes = new Set(["auto", "light", "dark"]);

function onColorSchemeChange() {
    let userSelectedScheme = localStorage.getItem('userColorScheme');
    if (!validUserSelectedSchemes.has(userSelectedScheme)) {
        userSelectedScheme = "auto"
    }
    if (userSelectedScheme != "auto") {
        document.documentElement.setAttribute('data-color-scheme', userSelectedScheme)
    } else {
        let preferredScheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', preferredScheme)
    }
    document.documentElement.setAttribute('data-user-color-scheme', userSelectedScheme)
}

function setUserColorScheme(scheme) {
    if (validUserSelectedSchemes.has(scheme)) {
        if (scheme != "auto") {
            localStorage.setItem('userColorScheme', scheme);
        } else {
            localStorage.removeItem('userColorScheme');
        }
        onColorSchemeChange();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', _ => onColorSchemeChange());
});
