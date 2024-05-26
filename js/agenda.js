let selectListaMedicos = document.getElementById("listarMedicos");
let fecha_turnos = document.getElementById("fecha_turnos");
let listaMedicos = [];
let btn_agenda = document.getElementById("btn_agenda");
let listar_agenda = document.getElementById("listar_agenda");
let tabla_turnos = document.getElementById("tabla_turnos");
let btn_volver = document.getElementById("btn_volver");
let cuerpo_tabla = document.getElementById("cuerpo_tabla");
let consultar_agenda = document.getElementById("consultar_agenda");


window.addEventListener("load", () => {
   OBTENER_MEDICOS();
});

// Recupero todos los médicos de la api
const OBTENER_MEDICOS = async () => {
   const RESP = await fetch("/api/medicos.json");
   const MEDICOS = await RESP.json();
   listarMedicos(MEDICOS);
};

// Armo el select con los médicos
function listarMedicos(medicos) {
   listaMedicos = medicos;
   medicos.forEach((e) => {
      let option = document.createElement("option");
      option.value = e.id;
      option.text = e.nombreCompleto + " || " + e.especialidad;
      selectListaMedicos.add(option);
   });
}

selectListaMedicos.addEventListener('change', e => {
   e.preventDefault();
   let dias_atencion = document.createElement('h3')
   dias_atencion.setAttribute('class', 'dias_atencion')

   let medico = listaMedicos.find(med => med.id == e.target.value)

   let formateo = ((medico.diasAtencion).replace('[','')).replace(']','')

   let dias = formateo.split(",", 31)

   dias_atencion.innerHTML = `Días de atención: `
   dias.forEach(dia => {
      dias_atencion.innerHTML = dias_atencion.innerHTML + (dia.replace("'",'*')).replace("'",'* ')
   })

   consultar_agenda.after(dias_atencion);
})


// Evento que muestra el listado de turnos
btn_agenda.addEventListener('click', e => {
   e.preventDefault()

   let turnosXFecha = []
   let turnero = JSON.parse(localStorage.getItem(selectListaMedicos.value))
   let fechaSinFormato = (fecha_turnos.value).split("-")
   let fechaElegida = fechaSinFormato[2] + '/' + fechaSinFormato[1] + '/' + fechaSinFormato[0]


   // Recupero solo los turnos utilizados
   if (turnero != null) {
      turnero.forEach(asignado => {
         if (asignado.fecha_turno == fechaElegida) {
            turnosXFecha = asignado.turno
         }
      })
   }

   // Relleno la tabla con los campos correspondientes
   if (turnosXFecha.length > 0) {
      // Inhabilito los inputs y btn de buscar y muestro el de 'Nueva búsqueda'
      selectListaMedicos.setAttribute('disabled', true)
      fecha_turnos.setAttribute('disabled', true)
      btn_agenda.setAttribute('hidden', true)
      btn_volver.removeAttribute('hidden')
      btn_volver.setAttribute('class', 'btn_volver')
      tabla_turnos.removeAttribute('hidden')
      tabla_turnos.setAttribute('class', 'tabla_turnos')

      // Los ordeno por horario
      turnosXFecha = turnosXFecha.sort((a, b) => {
         if (a.horario_turno < b.horario_turno) {
            return -1
         } if (a.horario_turno > b.horario_turno) {
            return 1
         } else {
            return 0;
         }
      })

      turnosXFecha.forEach(turno => {
         let segmento = document.createElement("tr");
         segmento.setAttribute('class', 'bloque_horarios')
         segmento.innerHTML = `
            <td>${fechaElegida}</td>
            <td>${turno.horario_turno} HS</td>
            <td class='datos_paciente'>
               <span><p class='pre_datos'>Paciente:</p> <p>${turno.paciente.nombre_paciente}</p></span>
               <span><p class='pre_datos'>DNI:</p> <p>${turno.paciente.dni_paciente}</p></span>
               <span><p class='pre_datos'>TEL:</p> <p>${turno.paciente.tel_paciente}</p></span>
            </td>
         `
         cuerpo_tabla.appendChild(segmento)
      })

   } else {
      // Si no existen turnos ese día muestro mensaje
      const Toast = Swal.mixin({
         toast: true,
         position: "top-end",
         showConfirmButton: false,
         timer: 1500,
         timerProgressBar: true,
         didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
         },
      });
      Toast.fire({
         icon: "warning",
         title: "No hay turnos en la fecha solicitada",
      });
   }
})

btn_volver.addEventListener('click', e => {
   e.preventDefault()

   selectListaMedicos.removeAttribute('disabled')
   fecha_turnos.removeAttribute('disabled')
   btn_agenda.removeAttribute('hidden')
   btn_volver.setAttribute('hidden', true)
   btn_volver.removeAttribute('class')

   tabla_turnos.removeAttribute('class')
   tabla_turnos.setAttribute('hidden', true)
   selectListaMedicos.value = ''
   fecha_turnos.value = ''
   cuerpo_tabla.innerHTML = ''
})