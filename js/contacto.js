
// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function() {
   const formulario = document.querySelector(".formulario-contacto");

   formulario.addEventListener("submit", function(event) {
   event.preventDefault();

     // Obtener los valores de los campos
   const nombre = document.querySelector("#nombre").value;
   const email = document.querySelector("#email").value;
   const celular = document.querySelector("#celular").value;
   const comentario = document.querySelector("#comentario").value;

     // Validación simple
   if (nombre === "" || email === "" || celular === "" || comentario === "") {
       Swal.fire({
       icon: "error",
       title: "Error",
       text: "Todos los campos son obligatorios",
       });
       return;
   }

     // Validar el formato del email
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(email)) {
       Swal.fire({
       icon: "error",
       title: "Error",
       text: "Por favor ingrese un email válido",
       });
       return;
   }

     // Mostrar un mensaje de éxito
   Swal.fire({
       icon: "success",
       title: "Mensaje enviado",
       text: "Nos pondremos en contacto contigo pronto.",
   });

     // Limpiar el formulario
   formulario.reset();
   });
});
