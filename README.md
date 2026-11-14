# Space Cat — sitio web para clientes

Página de presentación y descarga de **Space Cat**, aplicación para Windows que
permite diseñar interiores en 3D con medidas reales y obtener el presupuesto en
soles. Desarrollada por el equipo **FSHF**.

Hecha con **Astro**, **Tailwind CSS** y **Fomantic UI**.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # genera el sitio en dist/
npm run preview  # previsualiza la versión construida
```

## Publicación (GitHub Pages)

El sitio se publica solo al hacer push a `main`, mediante el flujo de
`.github/workflows/deploy.yml`. Queda en:
`https://alex123floresc-sketch.github.io/Space_Cat/`

> Importante: este repositorio **no** contiene el código fuente de la
> aplicación, solo la web y (próximamente) los manuales en PDF. El instalador
> se publica como *Release*.
