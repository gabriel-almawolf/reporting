# HER — Estado y Próximos Pasos
**Reunión con José · 18/09/2026 · ~30 min**
Edu · Gabo

---

## 1. Adopción ✅

- **+90% de cumplimiento** diario en Woztell. El hábito está instalado.
- Los managers están usando el agente de consulta de forma regular.
- Conclusión: el piloto cumplió su objetivo de adopción.

---

## 2. Estabilidad del sistema

El sistema funciona, pero hay margen de mejora antes de escalar.

| Qué | Estado | Nota para la reunión |
|---|---|---|
| Agente de check-in (voz) | 80% estable | Algunos cortes o silencios intermitentes |
| Agente de consulta (managers) | Funciona dentro de su alcance | No agrega ni compara datos aún |
| Canal de llamada | Dependiente de la conexión del usuario | Evaluando llamada telefónica como alternativa |

**Mensaje clave:** El piloto está operativo y la base es sólida. Lo que falla hoy no bloquea el uso, pero sí hay que resolverlo antes de escalar.

---

## 3. Problemas conocidos y mitigaciones

| Problema | Impacto | Qué estamos haciendo |
|---|---|---|
| Vapi (plataforma de voz) tiene inestabilidades | Experiencia degradada ocasional | Pruebas A/B con alternativas (SpotFónico) |
| El agente no distingue nombres propios mal escritos/transcritos | Resultados incorrectos en consultas | Diccionario de sinónimos |
| El agente de consulta no agrega ni compara datos | Preguntas complejas sin respuesta | Pendiente definir si entra en alcance |
| Sin segmentación por área/empresa/jerarquía | Managers ven datos de toda la org | Fuera de alcance del piloto actual |

---

## 4. Próximos pasos — a consensuar hoy

José señaló tres líneas concretas. Necesitamos alinearnos en prioridad y alcance:

### A. Expansión a otras regiones de SKG
- Desplegar el mismo sistema en otras empresas/regiones del grupo.
- Costes estimados disponibles. ¿Damos luz verde?

### B. Activación del teléfono (llamadas inbound)
- Que el empleado reciba una llamada en vez de iniciarla por WhatsApp.
- Evaluando SpotFónico vs. Twilio. La diferencia es coste y facilidad de integración.
- **Pregunta para José:** ¿lo priorizamos sobre otras funcionalidades?

### C. Integración con resumen diario de WhatsApp
- Ya existe un prototipo funcional conectado al grupo de WhatsApp de Woztell.
- Pendiente de validar con Jorge (estuvo de vacaciones).
- **Propuesta:** activarlo en la próxima iteración sin coste adicional significativo.

### D. Decisión de segmentación (jerarquía / departamento / empresa)
- Hoy cualquier manager ve todo. ¿Queremos restringir visibilidad?
- Es una decisión de negocio antes que técnica.

---

## 5. Lo que pedimos salir con

1. ✅ / ❌ Expansión a otras regiones — ¿cuándo?
2. Orden de prioridad de los evolutivos (B, C, D u otros)
3. ¿Hay otros stakeholders que deban estar en el próximo ciclo?

---

*Documentación técnica completa en Confluence AIOps · Proyecto HER*
