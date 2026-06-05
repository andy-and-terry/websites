const timestamp = 1765166400;
const now = Math.floor(Date.now() / 1000);
const diffSeconds = Math.abs(now - timestamp);
const tmbtime = Math.floor(diffSeconds / 86400);
document.getElementById("tmbtime").innerText = tmbtime;

document.getElementById("tmbstarted").innerText = "Mon Dec 08 2025 04:00:00 GMT+0000"
document.getElementById("changes").innerText = "179++";
document.getElementById("tmbend").innerText = "3/October/2026 12:00:00";
console.log("tester")
console.clear()
