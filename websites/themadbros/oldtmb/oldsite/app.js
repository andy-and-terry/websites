document.addEventListener("DOMContentLoaded", ()=>{
  const splash = document.getElementById("splash");
  const main = document.getElementById("main-content");

  setTimeout(()=>{
    splash.classList.add("fade-out");
    setTimeout(()=>{
      splash.style.display="none";
      main.style.opacity="1";
    },2000);
  },2000);
});
