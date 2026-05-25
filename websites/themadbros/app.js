const splash = document.getElementById("splash");
const main = document.getElementById("main-content");

// After 5 seconds, begin fading out the splash screen.
setTimeout(() => {
  splash.classList.add("fade-out");

  setTimeout(() => {
    splash.style.display = "none";
    main.style.opacity = "1";
  }, 2000);

}, 5000);

document.addEventListener("contextmenu", event => event.preventDefault());
