let selectListaMedicos = document.getElementById("listaMedico");
let inputMes = document.getElementById("mes");
let listaMedicos = [];
let medicoSeleccionado = null;
let fechaSeleccionada = null;
const semana = [
	"Domingo",
	"Lunes",
	"Martes",
	"Miercoles",
	"Jueves",
	"Viernes",
	"Sabado",
];

window.addEventListener("load", () => {
	obtenerMedicos();
	inputMes.min = new Date().toJSON().slice(0, 7);
});

// Recupero todos los médicos de la api
export const obtenerMedicos = async () => {
	const resp = await fetch("/api/medicos.json");
	const medicos = await resp.json();

	listarMedicos(medicos);
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

// Recupero el médico seleccionado
selectListaMedicos.addEventListener("change", (e) => {
	e.preventDefault();

	listaMedicos.forEach((medicos) => {
		if (medicos.id == e.target.value) {
			medicoSeleccionado = medicos;
		}
	});

	if (fechaSeleccionada != null) {
		mostrarCalendario();
		armarCalendario();
	}
});

// Recupero el mes y año seleccionado
inputMes.addEventListener("change", (e) => {
	e.preventDefault();
	fechaSeleccionada = e.target.value.split("-");

	if (medicoSeleccionado != null) {
		mostrarCalendario();
		armarCalendario();
	}
});

// Muestro el calendario si se seleccionó el médico y el mes, sino queda oculto
function mostrarCalendario() {
	let calendario = document.getElementById("calendario");
	calendario.style.display = "flex";
	calendario.style.flexDirection = "column";
	calendario.style.marginBottom = "10px";
}

// Lógica del calendario
function armarCalendario() {
	let anio = fechaSeleccionada[0];
	let mes = fechaSeleccionada[1];

	let totalDiasMes = new Date(anio, mes, 0).getDate();
	let primerDiaMes = new Date(anio, mes - 1, 1);

	// Lista index días en el que el médico trabaja
	let diasDisponible = [];
	let diasAtencion = medicoSeleccionado.diasAtencion;
	semana.forEach((e) => {
		if (diasAtencion.includes(e)) {
			diasDisponible.push(semana.indexOf(e));
		}
	});

	let fechas = document.getElementById("fechas");
	fechas.innerHTML = "";

	for (let i = 1; i < totalDiasMes + 1; i++) {
		// Recupero el num del día de la semana para determinar si esta disponible
		let num_dia = new Date(anio, mes - 1, i).getDay();

		// Indico los días disponibles para solicitar turnos
		let hayAtencion = diasDisponible.includes(num_dia);

		// Creo el calendario
		fechas.innerHTML =
			fechas.innerHTML +
			`
				<div class="${hayAtencion ? "fecha_calendario" : "sinAtencion"}" title="${
				!hayAtencion ? "Sin atención" : ""
			}">
					<span class="msj_turno">${hayAtencion ? "Solicitar turno" : ""}</span>
					<span class="dia_num"><span class="dia_nombre">${
						semana[num_dia]
					}</span><span>${i}</span>
				</div>
			`;
	}

	// Acomodo el primer día del mes en el lugar correcto del calendario
	let fecha_calendario = document.querySelectorAll(
		"." + fechas.firstChild.nextSibling.getAttribute("class")
	);

	fecha_calendario[0].style.gridColumnStart =
		primerDiaMes.getDay() == 0 ? 7 : primerDiaMes.getDay();
}

// El formulario va con sweetalert, al resultado se le suma el id del medico y el mes en cuestio
// Al armar el select de los horarios disponibles, hay que consumir el localStorage para ver disponibilidad.

// Revisar archivo de validaciones, si es necesario copiar el que uso con Laravel, implementarlo correctamente para la confirmación de la reserva del turno

//Datos para el localStorage = ID medico, y datos del formulario

// Una vez confirmada la reserva, la cual se guarda en el localStorage, resetear todos los campos de la vista
