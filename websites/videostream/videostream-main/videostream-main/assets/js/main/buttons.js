document.getElementById("login").addEventListener("click", () => {
  window.location.href = "login/";
});

const moreBtn = document.getElementById("more");
if (moreBtn) {
  moreBtn.addEventListener("click", () => {
    window.open("https://andy-and-terry.github.io/learningforeveryone/info.html/", "_blank");
  });
}
