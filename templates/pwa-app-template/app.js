const data = Array.isArray(window.APP_DATA) ? window.APP_DATA : [];
const select = document.getElementById("mainSelect");
const card = document.getElementById("contentCard");

function renderOptions() {
  select.innerHTML = data.map((item, index) => `<option value="${index}">${item.title}</option>`).join("");
}

function renderContent() {
  const item = data[Number(select.value)] || data[0];
  if (!item) {
    card.innerHTML = "<h3>No content yet</h3><p>Edit data.js to add dropdown content.</p>";
    return;
  }
  card.innerHTML = `
    <h3>${item.title}</h3>
    <p><strong>${item.summary || ""}</strong></p>
    <p>${item.details || ""}</p>
  `;
}

renderOptions();
select.addEventListener("change", renderContent);
renderContent();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
