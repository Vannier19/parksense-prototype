import { createBrowserRouter } from "react-router";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import IoTDevices from "./pages/IoTDevices";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
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
]);
