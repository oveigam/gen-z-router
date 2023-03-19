# Gen Z Validation
Demo de validador para Express usando Zod.

El objetivo es crear un validador con un tipado más robusto y que requiera menos código redundante.

El resultado es una extensión de la API de Express en la cual el único trabajo adicional para crear un endpoint validado y fuertemente tipado es escribir los esquemas de validación.

Además de la funcionalidad básica de validar la entrada (y salida) de datos, el validador también genera la documentación de OpenAPI de manera automática.

## ¿Por qué Zod?
Zod fue escrito desde el principio con TypeScript en mente, por lo que no solo tiene un mejor tipado, sino que su API es mucho más similar a los tipos de TypeScript, haciéndolo mucho más intuitivo de usar.

Yup tiene varios problemas incómodos, mientras que Zod simplemente funciona de la manera esperada.

![yup sucks](./img/yup1.PNG)
![zod rules](./img/zod1.PNG)
![zod vs yup](./img/yupzod.PNG)

**Nota:** La versión 1.0 de Yup que salió el mes pasado mejora enormemente el tipado y es recomendable actualizarse como mínimo, pero sigue siendo inferior a Zod.

## El tipado debe ser inferido del esquema
En el validador actual, se están tipando manualmente los esquemas antes de escribirlos. Esto, además de ser el doble de trabajo, puede llevar a errores de los cuales TypeScript no se entera.

![inferpls](./img/inferpls.PNG)

En este ejemplo podemos ver que el tipo que hemos escrito no contiene el campo age que es obligatorio y ts no nos ha dicho nada ya que los tipos son en efecto compatibles pero si se valida ese esquema contra algo del tipo que hemos escrito fallará ya que no tiene el campo age que es requerido.

La solución es usar inferencia para obtener el tipado de los esquemas. No solo nos ahorramos escribir el tipo manualmente, sino que el esquema es lo que va a decidir finalmente si el dato es válido, por lo que tiene más sentido obtener el tipado directamente de él.

![inferrules](./img/inferrules.PNG)

## Validando
Para empezar a usar el validador, basta con crear un controlador, que se encarga de extender la API de router.

![inferrules](./img/constr.PNG)

Una vez creado, el funcionamiento es prácticamente igual que el del router. Tenemos todos los métodos GET, POST, etc. La diferencia está en que pasaremos los esquemas de entrada y salida, y la función de la ruta ya recibe los datos de entrada directamente (input, query y body) parseados siguiendo los esquemas de validación.

Adicionalmente, el controlador devuelve el handler de la función que hemos usado. Con esto, deberíamos poder seguir haciendo los test de la misma manera que se hacen ahora.

![inferrules](./img/basic.PNG)


## Documentación automática
El validador es capaz de generar la documentación de OpenAPI de manera automática. Esto no solo reduce la cantidad de trabajo significativamente, sino que, al generarse a partir de los validadores, la documentación será siempre auténtica y sin errores humanos.

Para ello, se ha utilizado la librería `@asteasolutions/zod-to-openapi`, que traduce un esquema de Zod al formato JSON válido para OpenAPI. No es la única librería que hace esto, pero esta extiende la API de Zod para poder añadirle información relevante para los documentos (títulos y descripciones) de manera muy sencilla.

![inferrules](./img/openapi.PNG)