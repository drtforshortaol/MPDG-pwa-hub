const groupSelect = document.getElementById("groupSelect");
const searchInput = document.getElementById("searchInput");
const groupIntro = document.getElementById("groupIntro");
const appGrid = document.getElementById("appGrid");

const config = Array.isArray(window.MPDG_APPS) ? window.MPDG_APPS : [];

function appMatches(app, q) {
  if (!q) return true;
  const haystack = [app.title, app.subtitle, app.status, ...(app.tags || [])].join(" ").toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function renderGroupOptions() {
  groupSelect.innerHTML = "";
  config.forEach((group, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = group.group;
    groupSelect.appendChild(option);
  });
}

function render() {
  const group = config[Number(groupSelect.value)] || config[0];
  const query = searchInput.value.trim();
  if (!group) {
    groupIntro.innerHTML = "<h2>No apps configured yet</h2><p>Edit apps-config.js to add your first app.</p>";
    appGrid.innerHTML = "";
    return;
  }

  groupIntro.innerHTML = `<h2>${group.group}</h2><p>${group.description || ""}</p>`;
  const apps = (group.apps || []).filter(app => appMatches(app, query));
  appGrid.innerHTML = apps.map(app => {
    const isReady = app.url && app.url !== "#";
    const tags = (app.tags || []).map(tag => `<span class="tag">${tag}</span>`).join("");
    return `
      <article class="app-card">
        <span class="status">${app.status || "Planned"}</span>
        <h3>${app.title}</h3>
        <p>${app.subtitle || ""}</p>
        <div class="tags">${tags}</div>
        <a class="open-link ${isReady ? "" : "disabled"}" href="${isReady ? app.url : "#"}">${isReady ? "Open app" : "Placeholder"}</a>
      </article>
    `;
  }).join("") || `<article class="app-card"><h3>No matches</h3><p>Try a different search term.</p></article>`;
}

renderGroupOptions();
groupSelect.addEventListener("change", render);
searchInput.addEventListener("input", render);
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
