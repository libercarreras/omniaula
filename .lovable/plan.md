

## Plan: Fix Dashboard empty state when user has materias/grupos but no clases

### Problem
The Dashboard shows a misleading "Bienvenido, crea tu primera materia y grupo" message even though the user already has 3 materias and 6 grupos. The issue is that the `hasData` check only looks at `clases` (which link materias to grupos), and Karen hasn't created any clases yet.

### Changes

**Update `src/pages/Dashboard.tsx`**:

1. **Fetch materias count** alongside existing queries to know if the user has materias
2. **Add a second empty state** for when the user has materias and grupos but no clases:
   - Show a message like "Ya tienes materias y grupos. Crea una clase para vincularlos."
   - Show a button linking to a create-class flow or the grupos/materias page
3. **Keep existing empty state** only for truly new users (no materias AND no grupos)
4. **Update the stats cards** to still be useful -- show materias count and grupos count even when there are no clases

### Technical Details

The Dashboard currently has this logic:
```
const hasData = clases.length > 0;
```

Change to a 3-tier approach:
- **No materias & no grupos**: Show current "Bienvenido" with "Crear materia" + "Crear grupo"
- **Has materias/grupos but no clases**: Show "Vincula tus materias con grupos creando clases" with a link to create clases
- **Has clases**: Show existing dashboard with stats, radar, quick access

Also need to query `materias` in the Dashboard since it's already fetched for labels but we need the count for the empty state logic.

