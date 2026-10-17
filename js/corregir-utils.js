import { supabase } from "./supabaseClient.js";

export async function marcarComoCorregir(tarjeta, idBolsa) {
  console.log("🛠️ marcando registro para corrección, bolsa_id:", idBolsa);

  const { error } = await supabase
    .from("bolsa")
    .update({ estado: "corregir" })
    .eq("id", idBolsa)
    .eq("fuente", "1");

  if (error) {
    console.error("❌ Error al marcar corrección:", error.message);
    tarjeta.appendChild(document.createElement("p")).textContent =
      "❌ No se pudo marcar para corrección.";
  } else {
    const msg = document.createElement("p");
    msg.textContent = "✅ Registro marcado para corrección.";
    tarjeta.appendChild(msg);
  }
}
