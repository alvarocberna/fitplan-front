
# DESCRIPCION
Este proyecto corresponde a un agente de ia cuyo rol es ser un experto en nutricion deportiva. 
El agente se ocupa de recopilar información del usuario para luego enviarla al backend recibir los datos 
procesador. Con los datos procesados el sistema genera un documento pdf que contiene el plan nutricional del
usuario. El usuario puede obtener su plan para descargar y en su correo después de realizar el pago de este.


# FLUJO

## 1-Inicio
El usuario ingresa a la página principal del proyecto, donde puede hacer click en el botón 'iniciar consulta' donde
es redireccionado por el router a la ruta /consulta/informacion-personal

## 2-Informacion personal
En la ruta /consulta/informacion-personal se encuentra el componente FormUserInfo, que provee un formulario para ingresar datos
personales. Una vez que el usuario completa los datos y hace click en 'Siguiente', se actualiza el objeto InformacionPersonal
del context, para luego redirigir a la siguiente ruta.

## 3-Anamnesis
En la ruta /consulta/anamnesis se encuentra el componente ChatAnamnesis. Este componente inicia un chat con una primera pregunta 
ya definida. La respuesta del usuario es enviada al endpoint '/anamnesis/chat' siguiendo la estructura definida por el DTO
AnamnesisChat_RequestDto. Este dto contiene el mensaje del usuario y la data actual de anamnesis, para que el backend complete
la data de anamnesis en base a la información proporcionada. En respuesta, el backend envía un response siguiendo la estructura 
del DTO AnamnesisChat_ResponseDto. El response devuelve la nueva pregunta a realizar al usuario, y el objeto Anamnesis actualizado.
El componente ChatAnamnesis actualiza el estado local de Anamnesis en base al objeto Anamnesis enviado por el backend. 
Cuando el backend considere que el objeto Anamnesis se completo en un grado satisfactorio (60-70%), envía la propiedad isComplete 
como True, con lo cual de puede dar paso al siguiente formulario. Nuevamente, una vez que se hace click en 'Siguiente', se actualiza
la propiedad Anamnesis del contexto en base al estado local 'anamnesis' del componente ChatAnamnesis. Por  lo mismo, si se actualiza
el chat a media conversación, esta información se perderá, pues solo es guardada en el context (y localstorage) una vez se da 
click en continuar.

## 4-Mediciones
La ruta /consulta/evaluacion-fisica contiene el componente FormMediciones, el cual tiene dos inputs para peso y talla respectivamente.
Al hacer click en enviar se ejecuta la fn onSubmit que 1. Actualiza el estado de la propiedad mediciones del context, 2. Genera un
objeto ConsultaCompletaDto en base a la información almacenada en el context. 3. Envía este objeto al backend y 4. Recibe un objeto 
de tipo PlanNutricionalDto, 5. En base a la data del response recibido actualiza la propiedad planNutriconal del context.


## 5-Generación del plan


# CONTEXT
Tenemos el provider ConsultaProvider crea y posee el estado del objeto ConsultaCompleta siguiendo la estructura del DTO 
ConsultaCompletaDto. También contiene el estado del objeto PlanNutricional siguiendo la estructura del DTO PlanNutricionalDto.
El provider también provee funciones para mutar los estados de los distintos elementos del context, correspondientes 
a InformacionPersonal, Anamnesis y EvaluacionFisica, además de una función que permite obtener consulta.

Tenemos el hook useConsulta que permite acceder a las tres piezas de estado por separado (info user, anamnesis, mediciones), 
a diferencia de la función getConsultaCompleta que obtiene el objeto completo.

El context también provee las funciones saveToStorage y loadFromStorage, para que la data del contexto persista y la podamos leer.

