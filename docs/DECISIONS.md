# DECISIONS.md

Registro de decisiones técnicas del frontend de Code Quest 2026, con su
justificación. El objetivo es que cualquier persona (o Claude Code) entienda
el "por qué" detrás de la arquitectura sin tener que preguntar.

## React sobre Vue

Se eligió **React** como librería de UI en lugar de Vue.

- **Ecosistema más amplio:** mayor disponibilidad de librerías maduras para
  las necesidades del proyecto (formularios, animaciones, manejo de estado,
  componentes).
- **Más familiar** para el equipo y para la comunidad de la que se espera
  recibir contribuciones o soporte.

## Zustand sobre Redux

Se eligió **Zustand** para el manejo de estado global en lugar de Redux
(o Redux Toolkit).

- **Sin boilerplate:** no requiere actions, reducers ni providers explícitos
  para cada store; un store se define en pocas líneas.
- **TypeScript nativo:** la inferencia de tipos funciona de forma directa
  sin necesidad de configuración adicional o librerías de tipado extra.

## Axios sobre fetch

Se eligió **Axios** como cliente HTTP en lugar del `fetch` nativo.

- **Interceptores:** permite centralizar el manejo de tokens de
  autenticación, refresco de sesión y manejo uniforme de errores en un solo
  lugar (`services/api.ts`).
- **Instancia configurada:** una única instancia con `baseURL` y headers
  por defecto evita repetir configuración en cada llamada, a diferencia de
  `fetch`, donde cada request debe configurarse manualmente.

## Vite sobre CRA (Create React App)

Se eligió **Vite** como build tool y dev server en lugar de Create React App.

- **Más rápido:** arranque de dev server casi instantáneo y HMR (Hot Module
  Replacement) mucho más ágil gracias al uso de ESM nativo en desarrollo.
- **Mejor DX (developer experience):** configuración más simple y moderna;
  CRA además se encuentra sin mantenimiento activo por parte del equipo de
  React.

## Framer Motion

Se eligió **Framer Motion** como librería de animaciones.

- Permite lograr animaciones (transiciones de página, micro-interacciones,
  animaciones del StarMap) con **mínimo código** declarativo, integrándose
  de forma natural con componentes de React sin necesidad de manejar CSS
  keyframes manualmente.

## React Hook Form + Zod

Se eligió la combinación de **React Hook Form** para formularios y **Zod**
para validación de esquemas.

- **Validación sin re-renders:** React Hook Form maneja el estado de los
  formularios de forma no controlada, evitando renders innecesarios en cada
  tecla presionada, lo cual es relevante para formularios complejos (por
  ejemplo, en `AssessmentPage`).
- Zod permite definir esquemas de validación tipados que se integran
  directamente con React Hook Form (vía `@hookform/resolvers`) y que además
  pueden reutilizarse para validar datos provenientes de la API.
