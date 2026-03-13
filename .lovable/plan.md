

## Problema: "M" se muestra como "METRO" en Android/ChromeOS

La imagen muestra claramente que el botón de nivel "M" renderiza "METRO". Esto es causado por el **autocorrect/text prediction de Android/ChromeOS** que está interviniendo sobre el contenido del botón. Chrome en Android aplica predicción de texto incluso en elementos `<button>` focusables.

## Solución

En `src/components/clase/tabs/DesempenoTab.tsx`, agregar atributos anti-autocomplete a los botones de nivel:

- `autoComplete="off"`
- `autoCorrect="off"` 
- `spellCheck={false}`
- `data-form-type="other"` (previene que gestores de contraseñas/autocomplete interfieran)

Además, envolver el texto del valor en un `<span>` con `translate="no"` para evitar que Chrome lo interprete como texto traducible/autocompletable.

### Archivo a modificar
- `src/components/clase/tabs/DesempenoTab.tsx` — agregar atributos anti-autocorrect en los botones de celda de desempeño

