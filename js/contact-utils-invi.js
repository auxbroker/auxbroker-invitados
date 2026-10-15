import { supabase } from "./supabaseClient.js";

/**
 * Renderiza los botones de contacto y registra el contacto en la tabla "contactos"
 * además de rebajar cupos del invitado autenticado.
 * @param {HTMLElement} tarjeta - El contenedor donde se mostrarán los botones
 * @param {string} telefonoEmisor - Teléfono del asesor emisor (destino)
 * @param {string} pais - Código de país (ej. 52 para México)
 * @param {string} textoInteres - Contenido del mensaje (masdetalle)
 * @param {number} idBolsa - Identificador del registro en la tabla "bolsa"
 */
export async function mostrarOpcionesContactoInvitado(tarjeta, telefonoEmisor, pais, textoInteres, idBolsa) {
  console.log("🆔 mostrarOpcionesContactoInvitado recibió bolsa_id:", idBolsa);

  // Mostrar teléfono y botones
  const telefonoDiv = document.createElement("div");
  telefonoDiv.innerHTML = `
    <p><strong>Teléfono:</strong> ${telefonoEmisor}</p>
    <a href="tel:${telefonoEmisor}" class="btn-call">📞 Llamar</a>
    <a href="https://wa.me/${pais}${telefonoEmisor}" target="_blank" class="btn-whatsapp">💬 WhatsApp</a>
  `;
  tarjeta.appendChild(telefonoDiv);

  // Recuperar teléfono del invitado autenticado
  const telefonoInvitado = sessionStorage.getItem("telefono");
  if (!telefonoInvitado) {
    console.error("⚠️ No se encontró teléfono del invitado en sessionStorage");
    return;
  }

  // Buscar miembro por teléfono para obtener cupos
  const { data: miembro, error: errorMiembro } = await supabase
    .from("miembros")
    .select("cupos")
    .eq("telefono", telefonoInvitado)
    .single();

  if (errorMiembro || !miembro) {
    console.error("⚠️ No se encontró invitado con ese teléfono", errorMiembro);
    return;
  }

  const nuevoCupo = miembro.cupos - 1;

  // 1️⃣ Registrar contacto en tabla "contactos"
  const { error: errorContacto } = await supabase
    .from("contactos")
    .insert([{
      telefono_origen: telefonoInvitado,
      telefono_destino: telefonoEmisor,
      texto_de_interes: textoInteres,
      bolsa_id: idBolsa || null
    }]);

  if (errorContacto) {
    console.error("❌ Error al registrar contacto:", errorContacto.message);
  } else {
    console.log("✅ Contacto registrado correctamente con bolsa_id:", idBolsa);
  }

  // 2️⃣ Rebajar cupos del invitado autenticado
  const { data: actualizado, error: errorUpdate } = await supabase
    .from("miembros")
    .update({ cupos: nuevoCupo })
    .eq("telefono", telefonoInvitado)
    .select("cupos");

  if (errorUpdate) {
    console.error("❌ Error al actualizar cupos:", errorUpdate);
  } else if (actualizado && actualizado.length > 0) {
    const cupoDiv = document.createElement("p");
    cupoDiv.textContent = `✅ Tu nuevo saldo de cupos es: ${actualizado[0].cupos}`;
    tarjeta.appendChild(cupoDiv);
    // refrescar sessionStorage
    sessionStorage.setItem("cupos", actualizado[0].cupos);
  }
}
