import { supabase } from "./supabaseClient.js";

export async function mostrarOpcionesContactoInvitado(tarjeta, telefonoEmisor, pais, textoInteres, idBolsa) {
  console.log("🆔 Bolsa ID:", idBolsa);

  // Botones de contacto
  const div = document.createElement("div");
  div.innerHTML = `
    <p><strong>Teléfono:</strong> ${telefonoEmisor}</p>
    <a href="tel:${telefonoEmisor}" class="btn-call">📞 Llamar</a>
    <a href="https://wa.me/${pais}${telefonoEmisor}" target="_blank" class="btn-whatsapp">💬 WhatsApp</a>`;
  tarjeta.appendChild(div);

  // Teléfono invitado
  const telInv = sessionStorage.getItem("telefono");
  if (!telInv) return console.error("⚠️ No se encontró teléfono en sessionStorage");

  // Cupos actuales
  const { data: miembro, error: errM } = await supabase.from("miembros").select("cupos").eq("telefono", telInv).single();
  if (errM || !miembro) return console.error("⚠️ Invitado no encontrado", errM);

  const nuevoCupo = miembro.cupos - 1;

  // Registrar contacto
  const { error: errC } = await supabase.from("contactos").insert([{
    telefono_origen: telInv, telefono_destino: telefonoEmisor,
    texto_de_interes: textoInteres, bolsa_id: idBolsa || null
  }]);
  if (errC) console.error("❌ Error al registrar contacto:", errC.message);
  else console.log("✅ Contacto registrado con bolsa_id:", idBolsa);

  // Actualizar cupos
  const { data: act, error: errU } = await supabase.from("miembros").update({ cupos: nuevoCupo }).eq("telefono", telInv).select("cupos");
  if (errU) return console.error("❌ Error al actualizar cupos:", errU);
  if (act?.length) {
    const cupoDiv = document.createElement("p");
    cupoDiv.textContent = `✅ Nuevo saldo de cupos: ${act[0].cupos}`;
    tarjeta.appendChild(cupoDiv);
    sessionStorage.setItem("cupos", act[0].cupos);
  }
}
