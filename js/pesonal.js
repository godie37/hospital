let bloque_personal = document.getElementById('bloque_personal')

window.addEventListener("load", () => {
   OBTENER_MEDICOS();
});

// Recupero todos los médicos de la api
const OBTENER_MEDICOS = async () => {
   const RESP = await fetch("/api/medicos.json");
   const MEDICOS = await RESP.json();
   generarCard(MEDICOS);
};

function generarCard(medicos) {

   medicos.forEach(medico => {
      let card_personal = document.createElement('div')
      card_personal.setAttribute('class', 'card_personal')

      card_personal.innerHTML = `
         <h3 class='nombre_personal'>${medico.nombreCompleto}</h3>
         <img src="${medico.foto}" alt="silueta_personal" class='img_personal'>
			<h4 class='especialidad_personal'>${medico.especialidad}</h4>
			<p class='matricula_personal'>MP ${medico.mp}</p>
      `;

      bloque_personal.appendChild(card_personal)
   });
}