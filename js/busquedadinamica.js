import { supabase } from "./supabaseClient.js";
import { loadPartial } from "./utils.js";
import { mostrarOpcionesContacto } from "./contact-utils.js";
import { marcarComoCorregir } from "./corregir-utils.js";

loadPartial("inmuebleBox","../public/partials/inmueble.html");
loadPartial("municipioBox","../public/partials/municipio.html");

let resultadosBase=[],resultadosActuales=[];

document.getElementById("btnBuscar").addEventListener("click",async()=>{
  const tipoReqUI=document.getElementById("tipoRequerimiento").value;
  const tipoReq=(tipoReqUI==="solicita")?"solicitud":"ofrecimiento";
  const inmueble=document.getElementById("inmueble")?.value||"";
  const operacion=document.getElementById("tipoOperacion")?.value||"";
  const municipio=document.getElementById("municipio")?.value||"";
  const precioMin=parseFloat(document.getElementById("precioMin").value)||0;
  const precioMax=parseFloat(document.getElementById("precioMax").value)||Number.MAX_SAFE_INTEGER;

  let query=supabase.from("bolsa").select("*")
    .eq("estado","activa")
    .eq("requerimiento",tipoReq)
    .eq("inmueble",inmueble)
    .eq("operacion",operacion);

  if(municipio&&municipio.toLowerCase()!=="na"){query=query.eq("municipio",municipio);}

  const {data:resultados,error}=await query.order("id",{ascending:false});
  const cont=document.getElementById("resultadosBusqueda");
  cont.innerHTML="";

  if(error){cont.innerHTML="<p>Error al ejecutar búsqueda.</p>";return;}
  if(!resultados||resultados.length===0){cont.innerHTML="<p>No se encontraron coincidencias.</p>";return;}

  resultadosBase=resultados.filter(item=>{
    const min=parseFloat(item.preciomin)||0;
    const max=parseFloat(item.preciomax)||0;
    const dentro=min>=precioMin&&(max?max<=precioMax:true);
    const abierto=tipoReq==="solicitud"&&min===1111&&max===1111;
    return dentro||abierto;
  });

  resultadosActuales=[...resultadosBase];
  mostrarResultados(resultadosActuales);
});

function aplicarFiltroPalabra(palabraClave){
  const clave=palabraClave.trim().toLowerCase();
  resultadosActuales=!clave?[...resultadosBase]:resultadosActuales.filter(item=>item.masdetalle.toLowerCase().includes(clave));
  mostrarResultados(resultadosActuales);
}

function mostrarResultados(lista){
  const cont=document.getElementById("resultadosBusqueda");
  cont.innerHTML="";
  if(!lista||lista.length===0){cont.innerHTML="<p>No se encontraron opciones con los filtros aplicados.</p>";return;}

  const filtroDiv=document.createElement("div");
  filtroDiv.className="filtro-palabra";
  const inputClave=document.createElement("input");
  inputClave.type="text";inputClave.placeholder="Filtrar por palabra clave";inputClave.className="palabraClave";
  const btnFiltrar=document.createElement("button");
  btnFiltrar.textContent="🔍 Filtrar";btnFiltrar.className="btn-filtrar";
  btnFiltrar.addEventListener("click",()=>{aplicarFiltroPalabra(inputClave.value);});
  filtroDiv.appendChild(inputClave);filtroDiv.appendChild(btnFiltrar);cont.appendChild(filtroDiv);

  lista.forEach(item=>{
    const min=parseFloat(item.preciomin)||0;
    const max=parseFloat(item.preciomax)||0;
    const abierto=min===1111&&max===1111;
    const indicador=abierto?"Presupuesto abierto":"En el rango";

    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`<p><strong>Detalle:</strong> ${item.masdetalle||""}</p>
                    <p><strong>Fecha:</strong> ${item.fecha_alta||"Sin fecha"}</p>
                    <p><em>${indicador}</em></p>
                    <button class="btn-contactar">Contactar</button>
                    <button class="btn-corregir">Corregir</button>`;

    card.querySelector(".btn-contactar").addEventListener("click",()=>{
      console.log("🆔 Bolsa ID desde Consulta Dinámica:",item.id);
      mostrarOpcionesContacto(card,item.telefono,item.pais,item.masdetalle,item.id);
    });

    card.querySelector(".btn-corregir").addEventListener("click",()=>{
      console.log("🛠️ Marcando para corrección:",item.id);
      marcarComoCorregir(card,item.id);
    });

    cont.appendChild(card);
  });
}