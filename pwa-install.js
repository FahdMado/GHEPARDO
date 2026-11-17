(() => {
  const appType = document.querySelector('meta[name="ghepardo-app"]')?.content || "store";
  const appName = appType === "control" ? "GHEPARDO CONTROL" : "GHEPARDO STORE";
  let installPrompt = null;
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Install " + appName);
  button.innerHTML = '<img src="/GHEPARDO/Logo.png" alt="" style="width:22px;height:22px;object-fit:contain"> <span>تثبيت ' + appName + '</span>';
  Object.assign(button.style, {
    position:"fixed", right:"14px", bottom:"88px", zIndex:"9998",
    display:"flex", alignItems:"center", gap:"9px", padding:"11px 15px",
    border:"1px solid #e5a93c", borderRadius:"999px", background:"#090707",
    color:"#f8cf7a", font:"700 13px system-ui,sans-serif",
    boxShadow:"0 5px 22px #0009", cursor:"pointer"
  });
  document.addEventListener("DOMContentLoaded", () => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (!standalone) document.body.appendChild(button);
  });
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    button.hidden = false;
  });
  button.addEventListener("click", async () => {
    if (!installPrompt) {
      alert("إذا لم تظهر نافذة التثبيت تلقائيًا: افتح قائمة المتصفح ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».");
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
  });
  window.addEventListener("appinstalled", () => { button.remove(); });
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/GHEPARDO/service-worker.js", {scope:"/GHEPARDO/"}).catch(() => {}));
  }
})();