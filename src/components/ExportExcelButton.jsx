import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

const ExportExcelButton = ({
  service,
  filters = {},
  columns,
  fileName = 'datos',
  dataMapper = (item) => item, // Identity function by default
}) => {
  const [loading, setLoading] = useState(false);

  // Obtiene valores soportando rutas anidadas: "a.b.c"
  const getValueByPath = (obj, path) => {
    if (!obj || !path) return '';
    try {
      return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : ''), obj);
    } catch (_) {
      return '';
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await service({ query: filters, limit: 10000, page: 1 });
      const dataToExport = response.data || response;

      if (!Array.isArray(dataToExport)) {
        console.error("El servicio no retornó un arreglo de datos válido.");
        setLoading(false);
        return;
      }

      const mappedData = dataToExport.map(dataMapper);

      const finalData = mappedData.map(item => {
        const row = {};
        columns.forEach(col => {
          // Soporta claves anidadas como 'lavanderia.nombre'
          row[col.header] = getValueByPath(item, col.key);
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(finalData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
      XLSX.writeFile(workbook, `${fileName}.xlsx`);

    } catch (error) {
      console.error("Error al exportar a Excel:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {loading ? 'Exportando...' : 'Exportar a Excel'}
    </Button>
  );
};

export default ExportExcelButton;
