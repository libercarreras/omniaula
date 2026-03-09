

# Libreta Digital Docente — Plan de Implementación Inicial

## Descripción
Aplicación SaaS en español para profesores de educación secundaria. Permite gestionar grupos, estudiantes, asistencia, evaluaciones y más desde el celular o computadora. Este primer paso cubre la estructura, navegación y pantallas base.

## Diseño y Estilo
- **Paleta**: Tonos azules suaves con acentos verdes (estilo educativo moderno)
- **Tipografía**: Limpia y legible, tamaños grandes para uso móvil
- **Mobile-first**: Botones grandes, navegación inferior en móvil, sidebar en escritorio
- **Idioma**: Todo en español

## Navegación
- **Móvil**: Barra de navegación inferior con los módulos principales (Panel, Grupos, Asistencia, Evaluaciones, Más)
- **Escritorio**: Sidebar colapsable con todos los módulos
- **Menú "Más"** (móvil): Acceso a Seguimiento, Diario, Planificación, Informes, Análisis

## Pantallas a Crear

### 1. Panel Principal (Dashboard)
- Tarjetas resumen: clases del día, próximas evaluaciones, estudiantes en riesgo
- Accesos rápidos a grupos
- Actividad reciente

### 2. Grupos
- Lista de grupos del docente con tarjetas (nombre, cantidad de estudiantes, horario)
- Botón para agregar grupo

### 3. Estudiantes
- Lista de estudiantes filtrable por grupo
- Tarjeta por estudiante con nombre y grupo

### 4. Asistencia
- Selector de grupo y fecha
- Lista de estudiantes con botones rápidos: Presente / Ausente / Tardanza

### 5. Evaluaciones
- Lista de evaluaciones por grupo
- Vista con nombre, fecha y tipo de evaluación

### 6. Seguimiento (Observaciones)
- Lista de observaciones por estudiante
- Registro rápido de notas sobre comportamiento o rendimiento

### 7. Diario de Clase
- Registro diario por grupo con fecha y descripción de la clase

### 8. Planificación
- Vista de planificaciones por grupo/período

### 9. Informes
- Pantalla placeholder para futuros informes automáticos

### 10. Análisis
- Pantalla placeholder para futuras estadísticas y gráficos

## Datos
- Se usarán datos de ejemplo (mock data) para todas las pantallas
- La autenticación y base de datos con Supabase se implementarán en un paso posterior

## Arquitectura
- Componentes reutilizables para tarjetas, listas y formularios
- Layout compartido con navegación responsiva
- Rutas organizadas por módulo

