import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "~/components/layouts/app-layout";
import Dialer from "~/pages/dialer";
import Settings from "~/pages/settings";
import TcnCallback from "~/pages/tcn-callback";
import { ROUTES } from "~/constants";

export default function RouteConfig() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={ROUTES.DIALER} element={<Dialer />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />
      </Route>
      {/* TCN OAuth popup lands here; outside the layout and any login guard */}
      <Route path={ROUTES.TCN_CALLBACK} element={<TcnCallback />} />
      <Route path="*" element={<Navigate to={ROUTES.DIALER} replace />} />
    </Routes>
  );
}
