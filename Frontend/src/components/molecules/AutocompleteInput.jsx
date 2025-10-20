// Añadir forwardRef y useImperativeHandle
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import api from "../../api/api";
import { useDebounce } from "../../hooks/useDebounce";
import { Search, X, Loader2 } from "lucide-react";

// Envolver el componente con forwardRef
const AutocompleteInput = forwardRef(
  (
    {
      label,
      placeholder,
      onItemSelected,
      initialItemId = null,
      initialItemName = "",
    },
    ref
  ) => {
    // Recibir ref como segundo argumento
    const [searchTerm, setSearchTerm] = useState(initialItemName);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedItem, setSelectedItem] = useState(
      initialItemId
        ? { id: initialItemId, nombre_completo: initialItemName }
        : null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isListVisible, setIsListVisible] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // ... (useEffect para buscar, handleInputChange, handleSelectSuggestion SIN CAMBIOS) ...
    // Efecto para buscar sugerencias cuando el término debounced cambia
    useEffect(() => {
      if (
        selectedItem &&
        debouncedSearchTerm === selectedItem.nombre_completo
      ) {
        setSuggestions([]);
        setIsLoading(false);
        setIsListVisible(false);
        return;
      }
      if (debouncedSearchTerm.trim().length < 2) {
        setSuggestions([]);
        setIsListVisible(false);
        return;
      }
      const fetchSuggestions = async () => {
        setIsLoading(true);
        try {
          const response = await api.get("/stock/search-items", {
            params: { query: debouncedSearchTerm, limit: 10 },
          });
          setSuggestions(response.data);
          setIsListVisible(response.data.length > 0);
        } catch (error) {
          console.error("Error fetching autocomplete suggestions:", error);
          setSuggestions([]);
          setIsListVisible(false);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSuggestions();
    }, [debouncedSearchTerm, selectedItem]);

    const handleInputChange = (e) => {
      const newSearchTerm = e.target.value;
      setSearchTerm(newSearchTerm);
      if (newSearchTerm === "") {
        handleClearSelection();
      } else if (
        selectedItem &&
        newSearchTerm !== selectedItem.nombre_completo
      ) {
        setSelectedItem(null);
        onItemSelected(null);
        setIsListVisible(true);
      }
    };

    const handleSelectSuggestion = (item) => {
      setSearchTerm(item.nombre_completo);
      setSelectedItem(item);
      setSuggestions([]);
      setIsListVisible(false);
      onItemSelected(item);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    };

    // Función para limpiar (ahora usada internamente y expuesta)
    const clearInputAndSelection = useCallback(() => {
      setSearchTerm("");
      setSelectedItem(null);
      setSuggestions([]);
      setIsListVisible(false);
      onItemSelected(null);
    }, [onItemSelected]); // Dependencia onItemSelected

    // Llamar a clearInputAndSelection desde el botón X
    const handleClearSelection = () => {
      clearInputAndSelection();
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Exponer la función `clear` al componente padre usando la ref
    useImperativeHandle(ref, () => ({
      clear: () => {
        clearInputAndSelection();
        // Opcionalmente, también podrías poner el foco aquí si lo necesitas
        // if (inputRef.current) {
        //   inputRef.current.focus();
        // }
      },
    }));

    // Cerrar la lista si se hace clic fuera
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          inputRef.current &&
          !inputRef.current.contains(event.target) &&
          listRef.current &&
          !listRef.current.contains(event.target)
        ) {
          setIsListVisible(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return (
      <div className="relative w-full">
        {label && (
          <label
            htmlFor={label.replace(/\s+/g, "-").toLowerCase()}
            className="block mb-2 text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            ref={inputRef}
            id={label ? label.replace(/\s+/g, "-").toLowerCase() : undefined}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() =>
              setIsListVisible(suggestions.length > 0 && !selectedItem)
            }
            placeholder={placeholder}
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 pl-10 pr-10"
            autoComplete="off"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
            ) : (
              (searchTerm || selectedItem) && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-slate-400 hover:text-white"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-5 w-5" />
                </button>
              )
            )}
          </div>
        </div>

        {isListVisible && suggestions.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto text-sm"
          >
            {suggestions.map((item) => (
              <li
                key={item.id}
                onClick={() => handleSelectSuggestion(item)}
                className="px-4 py-2 text-white hover:bg-slate-600 cursor-pointer"
              >
                {item.nombre_completo}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
); // Cerrar forwardRef

// Añadir displayName para DevTools
AutocompleteInput.displayName = "AutocompleteInput";

export default AutocompleteInput;
