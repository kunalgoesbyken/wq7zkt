export const themeStorageKey = "windward-theme";

export const darkClass = "dark";

export const themeBootstrapScript = `(function(){try{var stored=localStorage.getItem("${themeStorageKey}");var dark=stored?stored==="${darkClass}":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("${darkClass}",dark)}catch(e){}})()`;
