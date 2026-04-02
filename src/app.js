import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import AuthProvider from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
// Importamos los nuevos componentes
import Menu from "./components/Menu";
import MisPedidos from "./components/MisPedidos";
import Checkout from "./components/Checkout";
import AdminDashboard from "./pages/AdminDashboard";

// --- COMPONENTE PARA EL MENÚ INFERIOR ---
const BarraNavegacionInferior = () => {
  const { user } = useContext(AuthContext);

  // Solo se muestra si el usuario está logueado y es un CLIENTE
  if (!user || user.rol === "admin") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] z-50">
      <Link
        to="/"
        className="flex flex-col items-center text-gray-500 hover:text-orange-600 transition-colors"
      >
        <span className="text-2xl">🏠</span>
        <span className="text-[10px] font-black uppercase italic">Menú</span>
      </Link>

      <Link
        to="/checkout"
        className="flex flex-col items-center text-orange-600"
      >
        <span className="text-2xl">🛒</span>
        <span className="text-[10px] font-black uppercase italic">Carrito</span>
      </Link>

      <Link
        to="/mis-pedidos"
        className="flex flex-col items-center text-gray-500 hover:text-orange-600 transition-colors"
      >
        <span className="text-2xl">📋</span>
        <span className="text-[10px] font-black uppercase italic">Pedidos</span>
      </Link>
    </nav>
  );
};

// --- PROTECCIÓN DE RUTAS ---
const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading)
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
        Cargando...
      </div>
    );
  if (!user || user.rol !== "admin") return <Navigate to="/" />;
  return children;
};

const ClienteRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  if (!user) return <Navigate to="/login" />; // Si no hay usuario, al login
  if (user.rol === "admin") return <Navigate to="/admin" />; // Si es admin, al dashboard
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />

        <div className="pb-20">
          {" "}
          {/* Espacio para que el menú inferior no tape el contenido */}
          <Routes>
            {/* 🏠 AHORA LA RAÍZ MUESTRA EL MENÚ DIRECTAMENTE */}
            <Route path="/" element={<Menu />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* 🛒 RUTA DEL CARRITO */}
            <Route
              path="/checkout"
              element={
                <ClienteRoute>
                  <Checkout />
                </ClienteRoute>
              }
            />

            {/* 📋 RUTA DE MIS PEDIDOS */}
            <Route
              path="/mis-pedidos"
              element={
                <ClienteRoute>
                  <MisPedidos />
                </ClienteRoute>
              }
            />

            {/* 👤 PERFIL (Solo clientes) */}
            <Route
              path="/perfil"
              element={
                <ClienteRoute>
                  <Profile />
                </ClienteRoute>
              }
            />

            {/* ⚙️ PANEL DE ADMINISTRADOR */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Routes>
        </div>

        <BarraNavegacionInferior />
      </Router>
    </AuthProvider>
  );
}

export default App;
