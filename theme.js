document.getElementById("theme").onchange = function() {
    displayTheme(this.value);
    window.localStorage.setItem('theme', this.value);
}

function displayTheme(theme) {
    if (theme.startsWith("GY")) {
        document.body.classList.remove("themeOB");
        document.body.classList.add("themeGY");
    } else {
        // startsWith("OB")
        document.body.classList.remove("themeGY");
        document.body.classList.add("themeOB");
    }

    if (theme.endsWith("W")) {
        document.body.classList.remove("themeK");
        document.body.classList.add("themeW");
    } else {
        // endsWith("K")
        document.body.classList.remove("themeW");
        document.body.classList.add("themeK");
    }
}

if (window.localStorage.getItem('theme')) {
    document.getElementById("theme").value =
        window.localStorage.getItem('theme');
    displayTheme(window.localStorage.getItem('theme'));
}
