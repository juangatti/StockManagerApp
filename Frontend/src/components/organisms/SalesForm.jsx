import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { UploadCloud, FileText } from "lucide-react";
import useStockStore from "../../stores/useStockStore"; // Importamos el store para refrescar

export default function SalesForm() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchStock } = useStockStore(); // Obtenemos la acción para refrescar el stock

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      toast.error("Por favor, selecciona un archivo Excel.");
      return;
    }

    const formData = new FormData();
    formData.append("archivoVentas", selectedFile);

    setIsSubmitting(true);
    const promise = axios.post(
      "http://localhost:5000/api/sales/salesProcessor",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    toast.promise(promise, {
      loading: "Procesando ventas...",
      success: () => {
        setIsSubmitting(false);
        setSelectedFile(null);
        fetchStock(); // <-- ¡Refrescamos todo el estado del stock!
        return "Ventas procesadas con éxito.";
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.response?.data?.message || "Error al procesar el archivo.";
      },
    });
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center">
      <UploadCloud className="mx-auto h-16 w-16 text-slate-500" />
      <h3 className="mt-4 text-xl font-semibold text-white">
        Subir Reporte de Ventas
      </h3>
      <p className="mt-2 text-sm text-slate-400">
        Arrastra o selecciona un archivo .xlsx (con columnas "Producto" y
        "Cantidad").
      </p>
      <div className="mt-6">
        <label
          htmlFor="file-upload"
          className="relative cursor-pointer rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          <span>Seleccionar archivo</span>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            accept=".xlsx, .xls"
          />
        </label>
      </div>

      {selectedFile && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-300">
          <FileText className="h-5 w-5" />
          <span>{selectedFile.name}</span>
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={handleSubmit}
          disabled={!selectedFile || isSubmitting}
          className="w-full flex items-center justify-center text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Procesando..." : "Descontar Ventas del Stock"}
        </button>
      </div>
    </div>
  );
}
