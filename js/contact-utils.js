import { supabase } from "./supabaseClient.js";

/**
 * Renderiza los botones de contacto y registra el contacto en la tabla "contactos"
 * además de rebajar cupos del miembro autenticado.
 * @param {HTMLElement} tarjeta - El contenedor donde se mostrarán los botones
 * @param {string} telefonoEmisor - Teléfono del asesor emisor (destino)
 * @param {string} pais - Código de país (ej. 52 para México)
 * @param {string} textoInteres - Contenido del mensaje (masdetalle)
 * @param {number} idBolsa - Identificador del registro en la tabla "bolsa"
 */
export async function mostrarOpcionesContacto(tarjeta, telefonoEmisor, pais, textoInteres, idBolsa) {
  console.log("🆔 mostrarOpcionesContacto recibió bolsa_id:", idBolsa);

  // Recuperar correo del invitado autenticado desde sessionStorage
  const correoUsuario = sessionStorage.getItem("correoUsuario");
  if (!correoUsuario) {
    console.error("⚠️ No se encontró correoUsuario en sessionStorage");
    return;
  }

  // Buscar miembro
  const { data: miembro, error: errorMiembro } = await supabase
    .from("miembros")
    .select("telefono, cupos")
    .eq("correo", correoUsuario)
    .single();

  if (errorMiembro || !miembro) {
    console.error("⚠️ No se encontró miembro con ese correo", errorMiembro);
    return;
  }

  const telefonoOrigen = miembro.telefono;

  // 🚦 Verificar cupos antes de mostrar cualquier dato
  if (miembro.cupos <= 0) {
    const avisoDiv = document.createElement("div");
    avisoDiv.textContent = "❌ Sin cupos disponibles, contrate más.";
    tarjeta.appendChild(avisoDiv);
    console.warn("❌ Intento de contacto sin cupos disponibles");
    return; // detenemos aquí, no se muestran botones ni datos
  }

  // 🔎 Verificar si ya existe un contacto previo
  const { data: contactoPrevio, error: errorCheck } = await supabase
    .from("contactos")
    .select("estado_seguimiento, notas")
    .eq("telefono_origen", telefonoOrigen)
    .eq("telefono_destino", telefonoEmisor)
    .eq("bolsa_id", idBolsa)
    .maybeSingle();

  if (errorCheck) {
    console.error("❌ Error al verificar contacto previo:", errorCheck.message);
    return;
  }

  if (contactoPrevio) {
    const avisoDiv = document.createElement("div");
    avisoDiv.innerHTML = `
      <p>⚠️ Ya registraste un contacto previo con este asesor.</p>
      <p><strong>Estado seguimiento:</strong> ${contactoPrevio.estado_seguimiento}</p>
      <p><strong>Notas:</strong> ${contactoPrevio.notas || "Sin notas registradas"}</p>
    `;
    tarjeta.appendChild(avisoDiv);
    return;
  }

  // ➡️ Renderizar botones SOLO si hay cupos y no existe contacto previo
  const telefonoDiv = document.createElement("div");
  telefonoDiv.innerHTML = `
    <p><strong>Teléfono:</strong> ${telefonoEmisor}</p>
    <a href="tel:${telefonoEmisor}" class="btn-call">📞 Llamar</a>
    <a href="https://wa.me/${pais}${telefonoEmisor}" target="_blank" class="btn-whatsapp">💬 WhatsApp</a>
  `;
  tarjeta.appendChild(telefonoDiv);

  // ➡️ Registrar contacto nuevo
  const { error: errorContacto } = await supabase
    .from("contactos")
    .insert([{
      telefono_origen: telefonoOrigen,
      telefono_destino: telefonoEmisor,
      texto_de_interes: textoInteres,
      bolsa_id: idBolsa || null
    }]);

  if (errorContacto) {
    console.error("❌ Error al registrar contacto:", errorContacto.message);
  } else {
    console.log("✅ Contacto registrado correctamente con bolsa_id:", idBolsa);
  }

  // Rebajar cupos
  const nuevoCupo = miembro.cupos - 1;
  const { data: actualizado, error: errorUpdate } = await supabase
    .from("miembros")
    .update({ cupos: nuevoCupo })
    .eq("correo", correoUsuario)
    .select("cupos");

  if (errorUpdate) {
    console.error("❌ Error al actualizar cupos:", errorUpdate);
  } else if (actualizado && actualizado.length > 0) {
    const cupoDiv = document.createElement("p");
    cupoDiv.textContent = `✅ Tu nuevo saldo de cupos es: ${actualizado[0].cupos}`;
    tarjeta.appendChild(cupoDiv);
  }
}
