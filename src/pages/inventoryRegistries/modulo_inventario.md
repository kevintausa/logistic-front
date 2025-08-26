
# 📦 Módulo de Inventario - Centros de Lavado

## 🎯 Objetivo
Controlar en tiempo real el inventario de productos químicos en varios **centros de lavado**, registrando:

- **Entradas** (compra de insumos).  
- **Consumos diarios** (lo gastado en operaciones).  
- **Traslados** entre centros.  
- **Inventario actual** (stock disponible).  
- **Costos de operación** basados en consumo × costo unitario.  

El modelo será **híbrido**:  
- Se almacenan **movimientos** (auditoría, trazabilidad).  
- Se mantiene una colección `inventarioActual` actualizada en cada operación para consultas rápidas.

---

## 🗄️ Colecciones (MongoDB)

### 1. Centros de lavado (laundries)
```json
{
  "_id": {
    "$oid": "68780d32eef6f6c78c8521df"
  },
  "nombre": "TEQUENDAMA",
  "direccion": "CRA 13 #26-30",
  "telefono": "7559000",
  "asesor": "HERNAN DARIO TORRES CARDONA",
  "supervisor": "MAURICIO COLMENARES",
  "estado": "Activo",
  "createdAt": {
    "$date": "2025-07-16T20:36:02.760Z"
  },
  "updatedAt": {
    "$date": "2025-07-23T14:59:40.773Z"
  },
  "__v": 0
}
```

### 2. Productos (products)
```json
{
  "_id": {
    "$oid": "687c42baf9f202a7ae792f6a"
  },
  "nombre": "DETERGENTE",
  "proveedor": "SOLCHEMICAL",
  "unidad": "Litros",
  "presentacionLitros": 25,
  "costo": 25000,
  "estado": "Activo",
  "createdAt": {
    "$date": "2025-07-20T01:13:30.267Z"
  },
  "updatedAt": {
    "$date": "2025-07-20T01:13:30.267Z"
  },
  "__v": 0,
  "stockMinimo": 50
}
```

### 3. Movimientos de inventario
Cada acción se registra aquí.

```json
{
  "_id": "m001",
  "lavanderia": {
    "id": "68780d32eef6f6c78c8521df",
    "nombre": "TEQUENDAMA",
  },
  "producto": {
    "id": "687c42baf9f202a7ae792f6a",
    "nombre": "DETERGENTE",
  },
  "tipoMovimiento": "entrada", 
  "cantidad": 50,
  "costoUnitario": 4800,
  "fecha": "2025-08-17T10:00:00Z",
  "observacion": "Compra proveedor X"
}
```

Valores de `tipoMovimiento`:
- `"entrada"`
- `"consumo"`
- `"trasladoSalida"`
- `"trasladoEntrada"`

### 4. Inventario actual
Se actualiza cada vez que se registra un movimiento.

```json
{
  "lavanderia": {
    "id": "68780d32eef6f6c78c8521df",
    "nombre": "TEQUENDAMA",
  },
  "producto": {
    "id": "687c42baf9f202a7ae792f6a",
    "nombre": "DETERGENTE",
  },
  "stockActual": 120,
  "updatedAt": "2025-08-17T12:00:00Z"
}
```

---

## 🔄 Flujo de operaciones

### Entrada de productos
1. Insertar `movimiento` tipo `"entrada"`.
2. Actualizar `inventarioActual.stockActual += cantidad`.

### Consumo diario
1. Insertar `movimiento` tipo `"consumo"`.
2. Actualizar `inventarioActual.stockActual -= cantidad`.

### Traslados
1. Insertar `movimiento` tipo `"trasladoSalida"` en centro origen.  
2. Insertar `movimiento` tipo `"trasladoEntrada"` en centro destino.  
3. Actualizar ambos `inventarioActual`.

### Consulta de stock
- Leer `inventarioActual` directamente.  
- Si hay inconsistencia, recalcular desde `movimientos` con agregaciones.

---

## 📊 Reportes clave

1. **Inventario actual por centro y producto**  
   - Fuente: `inventarioActual`.  

2. **Consumo diario / mensual por producto**  
   - Fuente: `movimientos` tipo `"consumo"`.  

3. **Costos de operación**  
   - Fórmula: `consumo × costoUnitario`.  

4. **Historial de movimientos**  
   - Fuente: `movimientos`, filtrados por fecha, centro o producto.  

---

## ⚖️ Ventajas del modelo híbrido
✅ **Trazabilidad total** con `movimientos`.  
✅ **Consultas rápidas** con `inventarioActual`.  
✅ Si ocurre un error, el stock se **recalcula** desde movimientos.  
✅ Flexible para crecer a múltiples centros y productos.  

---