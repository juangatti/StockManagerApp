import { ClipboardList } from "lucide-react";
import { useLoginForm } from "../hooks/useLoginForm"; // 1. Importamos el nuevo hook

export default function LoginPage() {
  // 2. Consumimos el hook para obtener toda la lógica y estados
  const {
    username,
    setUsername,
    password,
    setPassword,
    rememberUser,
    setRememberUser,
    error,
    isLoading,
    handleSubmit,
  } = useLoginForm();

  // 3. El JSX permanece idéntico, pero ahora es mucho más "limpio"
  //    y solo se encarga de renderizar.
  return (
    <div className="flex min-h-screen flex-col justify-center bg-background py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-primary">
          <ClipboardList className="h-16 w-16" />
        </div>
        <h2 className="mt-6 text-center text-4xl font-bold tracking-tight text-text-primary font-display uppercase">
          STOCK MANAGER APP
        </h2>
        <h3 className="mt-2 text-center text-sm font-medium text-text-secondary">
          STOCK MANAGER
        </h3>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow-(--shadow-card) sm:rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-bold text-text-secondary uppercase tracking-wider"
              >
                Usuario
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-text-primary placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-text-secondary uppercase tracking-wider"
              >
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-text-primary placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm font-medium text-primary bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-user"
                  name="remember-user"
                  type="checkbox"
                  checked={rememberUser}
                  onChange={(e) => setRememberUser(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="remember-user"
                  className="ml-2 block text-sm text-text-secondary"
                >
                  Recordar usuario
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-bold text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 uppercase tracking-widest transition-colors cursor-pointer"
              >
                {isLoading ? "Ingresando..." : "Ingresar"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <p className="text-center text-xs text-text-muted">
          Stock Manager App
          <br />
          Created by Juan Gatti{" "}
          <span className="align-super" style={{ fontSize: "0.6rem" }}>
            ®
          </span>{" "}
          {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
