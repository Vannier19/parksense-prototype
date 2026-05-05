import { createBrowserRouter } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import IoTDevices from "./pages/IoTDevices";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "analytics",
        element: <Analytics />,
      },
      {
        path: "iot-devices",
        element: <IoTDevices />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
