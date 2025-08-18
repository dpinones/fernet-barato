# Documento de Requerimientos

## Introducción
Fernet Barato es una aplicación móvil diseñada para ayudar a los consumidores en Argentina a encontrar los precios más baratos de Fernet, una bebida alcohólica popular. La app aborda puntos de dolor clave como la falta de transparencia en precios, el tiempo perdido comparando precios en diferentes tiendas, problemas de disponibilidad de variaciones de precios entre supermercados y licorerías. Al proporcionar una plataforma centralizada para comparación de precios, descubrimiento de tiendas basado en geolocalización y almacenamiento de datos respaldado por blockchain, la app empodera a los usuarios para tomar decisiones de compra informadas, potencialmente ahorrando un 20-30% en compras mientras reduce viajes innecesarios.

## Requerimientos

### Requerimiento 1: Visualización de Comparación de Precios
**Historia de Usuario:** Como consumidor, quiero ver los precios de Fernet en diferentes tiendas, para poder elegir la opción más barata.

#### Criterios de Aceptación
1. WHEN el usuario busca precios de Fernet THEN el sistema SHALL mostrar una lista de tiendas con precios actuales, ordenados por precio más bajo primero.
3. WHILE visualizando precios THE sistema SHALL incluir la diferencia de precio en pesos y porcentaje comparado con el promedio o el precio más alto.

### Requerimiento 3: Información de Tiendas y Detalles de Contacto
**Historia de Usuario:** Como usuario, quiero acceder a detalles de la tienda como dirección, teléfono y horarios, para contactarlos o visitarlos fácilmente.

#### Criterios de Aceptación
1. WHEN seleccionando una tienda THEN el sistema SHALL mostrar su nombre, dirección, número de teléfono y horarios de operación.

### Requerimiento 4: Visibilidad de Timestamp de Actualización de Precios
**Historia de Usuario:** Como usuario, quiero ver cuándo se actualizaron los precios por última vez, para evaluar la confiabilidad de los datos.

#### Criterios de Aceptación
1. WHEN mostrando cualquier precio THEN el sistema SHALL mostrar el timestamp de última actualización junto a él.
2. IF el precio es más antiguo que una semana THEN el sistema SHALL resaltar como potencialmente desactualizado con un ícono de advertencia.
3. WHILE los precios se actualizan manualmente los sábados THE sistema SHALL asegurar que todos los datos mostrados reflejen la actualización autorizada más reciente.


### Requerimiento 6: Almacenamiento de Datos en Blockchain para Transparencia
**Historia de Usuario:** Como administrador, quiero que todos los datos se almacenen en la blockchain starknet, para que los usuarios puedan verificar transparencia e inmutabilidad.

#### Criterios de Aceptación
1. WHEN actualizando precios o info de tiendas manualmente THEN el sistema SHALL cometer los datos a la blockchain con un timestamp y hash.

### Requerimiento 7: Opciones de Filtrado
**Historia de Usuario:** Como usuario, quiero filtrar resultados por precio o distancia, para personalizar mi búsqueda.

#### Criterios de Aceptación
1. WHEN aplicando filtros THEN el sistema SHALL actualizar dinámicamente la lista

### Requerimiento 8: Actualizaciones Manuales de Precios por Usuarios Autorizados
**Historia de Usuario:** Como administrador, quiero actualizar precios manualmente.

#### Criterios de Aceptación
1. WHEN un usuario autorizado inicia sesión THEN el sistema SHALL proporcionar una interfaz de admin para ingresar nuevos precios y datos de tiendas.
3. WHILE actualizando datos THE sistema SHALL validar entradas por completitud (ej. precio, ID de tienda, timestamp) antes de cometer a blockchain.


Vamos a utilizar Cavos para el login y para hacer las llamadas a starknet.