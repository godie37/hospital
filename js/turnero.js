import { validacionBlur } from "./validaciones.js";
let selectListaMedicos = document.getElementById("listaMedico");
let inputMes = document.getElementById("mes");
let listaMedicos = [];
let medicoSeleccionado = null;
let fechaSeleccionada = null;
const SEMANA = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
let turno = [];

window.addEventListener("load", () => {
	OBTENER_MEDICOS();
	inputMes.min = new Date().toJSON().slice(0, 7);
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
	let hoy_dia = new Date().getDate()
	let hoy_mes = (new Date().getMonth() + 1).toString().length == 1 ? '0' + (new Date().getMonth() + 1) : new Date().getMonth() + 1;

	// Lista index días en el que el médico trabaja
	let diasDisponible = [];
	let diasAtencion = medicoSeleccionado.diasAtencion;

	SEMANA.forEach((e) => {
		if (diasAtencion.includes(e)) {
			diasDisponible.push(SEMANA.indexOf(e));
		}
	});

	let fechas = document.getElementById("fechas");
	fechas.innerHTML = "";

	for (let i = 1; i < totalDiasMes + 1; i++) {
		// Recupero el num del día de la semana para determinar si esta disponible
		let num_dia;

		if (i >= hoy_dia && hoy_mes == mes) {
			num_dia = new Date(anio, mes - 1, i).getDay();
		} else if (hoy_mes != mes) {
			num_dia = new Date(anio, mes - 1, i).getDay();
		}

		// Indico los días disponibles para solicitar turnos
		let hayAtencion = diasDisponible.includes(num_dia);

		// Creo el calendario
		fechas.innerHTML = fechas.innerHTML + `
				<div class="${hayAtencion ? "fecha_calendario" : "sinAtencion"}" ${hayAtencion ? `data-dia=${i}` : ""} ${!hayAtencion ? "title='Sin atención'" : ""}>
					<span class="msj_turno">${hayAtencion ? "Solicitar turno" : ""}</span>
					<span class="dia_num"><span class="dia_nombre">${SEMANA[num_dia]}</span>
					<span>${i}</span>
				</div>
			`;
	}

	solicitarTurno();
	// Acomodo el primer día del mes en el lugar correcto del calendario
	let fecha_calendario = document.querySelectorAll("." + fechas.firstChild.nextSibling.getAttribute("class"));

	fecha_calendario[0].style.gridColumnStart = primerDiaMes.getDay() == 0 ? 7 : primerDiaMes.getDay();
}

function solicitarTurno() {
	let diasConAtencion = document.querySelectorAll(".fecha_calendario");

	// Identifico cada día con atención y le asigno el evento click
	for (let i = 0; i < diasConAtencion.length; i++) {
		diasConAtencion[i].addEventListener("click", async (e) => {
			e.preventDefault();

			generarFormularioTurnero()

			// Habilito campo file solo en el caso de ser requerido
			let con_derivacion = document.querySelector(".con_derivacion");
			let sin_derivacion = document.querySelector(".sin_derivacion");
			let img_derivacion = document.getElementById("adjunto_derivacion");
			let file_turno = document.querySelector(".file_turno");

			con_derivacion.addEventListener("click", () => {
				file_turno.style.display = "flex";
				file_turno.style.flexDirection = "column";
				img_derivacion.dataset.validacion = '["required"]';
			});
			sin_derivacion.addEventListener("click", () => {
				file_turno.style.display = "none";
				img_derivacion.dataset.validacion = "[]";
			});
			//

			// Obtengo los datos de atención y genero el rango horario en bloques de 30 min
			let dia = diasConAtencion[i].getAttribute("data-dia");
			let anio = fechaSeleccionada[0];
			let mes = fechaSeleccionada[1];
			let horarioAtencion = medicoSeleccionado.horario;
			let rangoHorario = listarHorarios(anio, mes, dia, horarioAtencion);

			// Creo el select e ingreso los valores
			let select_horario = document.getElementById("horario");
			rangoHorario.forEach((horario) => {
				let option = document.createElement("option");
				option.value = horario;
				option.text = horario;
				select_horario.add(option);
			});
			//

			let btn_volver = document.getElementById("btn_volver");
			btn_volver.addEventListener("click", (e) => {
				e.preventDefault();
				resetearFormulario(bloque_fecha, form_turno, dias, fechas);
				// bloque_fecha.removeChild(fecha_turno);
			});

			campos_form.addEventListener("submit", (e) => {
				e.preventDefault();
				// Obtengo todos los datos enviados en el formulario
				const DATA = Object.fromEntries(new FormData(e.target));

				// Valido que cumplan las reglas de validación, si todo es correcto continúo sino arrojo error en el campo que corresponda
				if (validacionBlur(DATA)) {
					Swal.fire({
						title: "Guardar turno?",
						icon: "question",
						showConfirmButton: true,
						confirmButtonColor: "#379237",
						confirmButtonText: "Confirmar",
						showCancelButton: true,
						cancelButtonColor: "#FF1E1E",
						cancelButtonText: `Cancelar`,
					}).then((result) => {
						if (result.isConfirmed) {
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
								icon: "success",
								title: "Turno guardado exitosamente",
							});

							// Reviso si el médico seleccionado tiene turnos creados
							let existen_turnos = localStorage.getItem(medicoSeleccionado.id);

							// Si no tiene creo el primer turno
							if (existen_turnos == null) {
								turno = [
									{
										fecha_turno: (dia.length == 1 ? "0" + dia : dia) + "/" + mes + "/" + anio,
										turno: [
											{
												horario_turno: DATA.horario,
												paciente: {
													nombre_paciente: DATA.nombre_completo,
													dni_paciente: DATA.dni,
													tel_paciente: DATA.telefono,
													derivacion: DATA.derivacion,
													adjunto_derivacion: DATA.adjunto_derivacion,
												},
											},
										],
									},
								];

								localStorage.setItem(medicoSeleccionado.id, JSON.stringify(turno));
							} else {
								// En caso de existir, recorro el objeto y verifico si el día seleccionado existe.
								let todosTurnos = JSON.parse(existen_turnos);

								todosTurnos.find((turnero) => {
									// Si existe un registro con la fecha seleccionada, agrego solo los datos del turno en la propiedad correspondiente
									if (turnero.fecha_turno == (dia.length == 1 ? "0" + dia : dia) + "/" + mes + "/" + anio) {
										let listaTurnos = turnero.turno;
										listaTurnos.push({
											horario_turno: DATA.horario,
											paciente: {
												nombre_paciente: DATA.nombre_completo,
												dni_paciente: DATA.dni,
												tel_paciente: DATA.telefono,
												derivacion: DATA.derivacion,
												adjunto_derivacion: DATA.adjunto_derivacion,
											},
										});
										return listaTurnos;
									} else {
										// Si no existen turnos para esa fecha la registro agregando todos los datos necesarios
										todosTurnos.push({
											fecha_turno: (dia.length == 1 ? "0" + dia : dia) + "/" + mes + "/" + anio,
											turno: {
												horario_turno: DATA.horario,
												paciente: {
													nombre_paciente: DATA.nombre_completo,
													dni_paciente: DATA.dni,
													tel_paciente: DATA.telefono,
													derivacion: DATA.derivacion,
													adjunto_derivacion: DATA.adjunto_derivacion,
												},
											},
										});
									}
								});
								// Guardo nuevamente los datos en el localStorage
								localStorage.setItem(medicoSeleccionado.id, JSON.stringify(todosTurnos));
							}
							// Reseteo los campos del formularo, además restablezco la vista, oculto el formulario y muestro el calendario. El tiempo establecido va de la mano de la duración de la alerta de SweetAlert
							campos_form.reset();
							setTimeout(() => {
								resetearFormulario(bloque_fecha, form_turno, dias, fechas);
							}, 1200);
						}
					});
				}
			});
		});
	}
}

// Genero el formulario para solicitar el turno
function generarFormularioTurnero() {
	let bloque_fecha = document.getElementById("bloque_fecha");
	let dias = document.getElementById("dias_semana");
	let fechas = document.getElementById("fechas");
	dias.style.display = "none";
	fechas.style.display = "none";
	bloque_fecha.style.backgroundColor = "rgb(224, 219, 198)";
	selectListaMedicos.setAttribute("disabled", true);
	inputMes.setAttribute("disabled", true);

	let form_turno = document.createElement("section");
	form_turno.setAttribute("class", "form_turno");

	let campos_form = document.createElement("form");
	campos_form.setAttribute("class", "campos_form");
	campos_form.setAttribute("id", "campos_form");
	campos_form.innerHTML = ` 
			<section class="caja_inputs">
				<label for="nombre_completo">Nombre completo</label>
				 <input class='form-control' placeholder="Ingrese su nombre completo" type="text" name="nombre_completo" id="nombre_completo" data-validacion='["required"]'/>		 					
				<span class="hidden" id="error_nombre_completo"></span>
			 </section>
			 <section class="caja_inputs">
				 <label for="dni">DNI</label>
				 <input class='form-control' placeholder="Ingrese su DNI" type="number" name="dni" id="dni" data-validacion='["required", "numeric"]'/>
				 <span class="hidden" id="error_dni"></span>
			 </section>
			 <section class="caja_inputs">
				 <label for="telefono">Teléfono</label>
				 <input class='form-control' placeholder="Ingrese su teléfono" type="text" name="telefono" id="telefono" data-validacion='["required", "min:7", "max:10"]'/>
				 <span class="hidden" id="error_telefono"></span>
			 </section>
			<section class="caja_inputs checkbox_turno">
				<input type="checkbox" name="es_obra_social" id="es_obra_social" data-validacion='[]'/>
				<label for="es_obra_social">Por obra social</label>
			</section>
			<section class="caja_inputs radio_turno">
				<label for="derivacion">Es con derivación?</label>
				<div class="bloque_radio">
					<label for="sin_derivacion">Sin derivación
						<input class='form-radio-input sin_derivacion' type="radio" name="derivacion" id="derivacion" value='No' data-validacion='[]' checked/>
					</label>
					<label for="con_derivacion">Con derivación
						<input class='form-radio-input con_derivacion' type="radio" name="derivacion" id="derivacion" value='Si' data-validacion='[]'/>
					</label>
				</div>
			</section>
			<section class="caja_inputs file_turno">
				<label for="adjunto_derivacion">Adjunte derivación</label>
				<input class='form-control' type="file" name="adjunto_derivacion" id="adjunto_derivacion" data-validacion='[]'/>	
				<span class="hidden" id="error_adjunto_derivacion"></span>	
			</section>
			 <section class="caja_inputs select_turno">
				 <label for="horario">Seleccionar horario</label>
				 <select name="horario" id="horario" data-validacion='["required"]' class='form-select'>
					 <option value="">Seleccionar horario</option>
				 </select>
				 <span class="hidden" id="error_horario"></span>
			 </section>
			<section class='bloque_btn'>
				<button class='btn_enviar' type="submit" id='btn_enviar'>Solicitar turno</button>
				<button class='btn_volver' type="button" id='btn_volver'>Volver</button>
			</section>
	`;

	bloque_fecha.appendChild(form_turno);
	form_turno.appendChild(campos_form);
}

// Armo el rango de horarios cada 30 minutos para la atención del médico
function listarHorarios(anio, mes, dia, horarioAtencion) {
	let rangoHorario = [];

	let hora_ingreso = new Date(anio + "-" + mes + "-" + dia + " " + horarioAtencion[0]);
	let hora_salida = new Date(anio + "-" + mes + "-" + dia + " " + horarioAtencion[1]);

	let horaActual = hora_ingreso;
	while (Date.parse(horaActual) < Date.parse(hora_salida)) {
		let hora = horaActual.getHours();
		let minutos = horaActual.getMinutes();

		rangoHorario.push(hora + ":" + (minutos.toString().length == 1 ? minutos + "0" : minutos));
		horaActual = contador(horaActual);
	}

	// Reviso si existe un horario asignado a un turno, si existe lo elimino del array para que no pueda seleccionarse
	let turnos = JSON.parse(localStorage.getItem(medicoSeleccionado.id));
	let horariosAsignados = [];

	turnos.forEach((turnosAsignadas) => {
		if (turnosAsignadas.fecha_turno == (dia.toString().length == 1 ? "0" + dia : dia) + "/" + mes + "/" + anio) {
			horariosAsignados = turnosAsignadas.turno;
		}
	});

	horariosAsignados.forEach((turno) => {
		rangoHorario.find((franjaHoraria, key) => {
			if (franjaHoraria == turno.horario_turno) {
				rangoHorario.splice(key, 1)
			}
		})
	});

	return rangoHorario;
}

// Agrego 30 minutos al horario de inicio, para conseguir el rango de atención
function contador(horaActual) {
	var sumarMinutos = 30;
	var min = horaActual.getMinutes();
	horaActual.setMinutes(min + sumarMinutos);
	return horaActual;
}

// Oculto campos formulario y vuelvo a mostar el calendario
function resetearFormulario(fondo_form, campos_form, dias, fechas) {
	fondo_form.style.backgroundColor = "cornsilk";
	dias.removeAttribute("style");
	fechas.removeAttribute("style");
	fondo_form.removeChild(campos_form);
	selectListaMedicos.removeAttribute("disabled");
	inputMes.removeAttribute("disabled");
}



// Ver si se puede agregar la fecha en el formulario de solicitud de turno, para que quede claro para que día es el turno
