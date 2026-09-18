# Reporting — AlmaWolf Lab

Guiones de reunión en formato HTML autocontenido, publicados en GitHub Pages.

Misma base técnica que las presentaciones del Corpus Method: un único `index.html` por versión, sin dependencias de build, design system AlmaWolf.

## Estructura

```
reporting/
├── index.html          # Índice general de proyectos
└── her/
    ├── index.html      # Índice de reportings Proyecto HER
    └── v1/
        └── index.html  # R01 · Estado y Próximos Pasos · sep 2026
```

## Versionado

Cada nuevo reporte = carpeta nueva (`v2/`, `v3/`, …) + entrada en `her/index.html`. Todo en `main`, sin ramas de versión.

## Modo comentarios

Los reportes incluyen `web-review-mode.js`. Activar con `⌥ + C` o el botón `✍️ Comentar`. Los comentarios se sincronizan con Google Sheets vía webhook configurado en cada versión.

## URL

**https://gabriel-almawolf.github.io/reporting/**

Páginas con `noindex` + `robots.txt` bloqueando indexación. Acceso por URL directa.
