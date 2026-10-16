// js/utils.js
export async function loadPartial(id, file) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    el.innerHTML = await (await fetch(file)).text();
  } catch (err) {
    console.error(`❌ Error cargando ${file}:`, err);
  }
}

