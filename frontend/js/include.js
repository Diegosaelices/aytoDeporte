// Carga fragmentos HTML comunes (header, footer, etc.) en los elementos con [data-include]

async function includeHTML() {
  const includeTargets = document.querySelectorAll("[data-include]");

  for (const target of includeTargets) {
    const file = target.getAttribute("data-include");
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error("Archivo no encontrado: " + file);

      const html = await response.text();
      target.innerHTML = html;
    } catch (err) {
      console.error(err);
      target.innerHTML = "<!-- Error cargando " + file + " -->";
    }
  }

  // Avisamos al resto de scripts de que ya están cargados header/footer
  document.dispatchEvent(new Event("includesLoaded"));
}

document.addEventListener("DOMContentLoaded", () => {
  includeHTML();
});
