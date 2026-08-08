import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";
import HomePage from "@/pages/HomePage/HomePage";
import InvestmentsPage from "@/pages/InvestmentsPage/InvestmentsPage";
import InvestmentDetailPage from "@/pages/InvestmentDetailPage/InvestmentDetailPage";
import ExposPage from "@/pages/ExposPage/ExposPage";
import ExpoDetailPage from "@/pages/ExpoDetailPage/ExpoDetailPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="investments" element={<InvestmentsPage />} />
        <Route path="investments/:id" element={<InvestmentDetailPage />} />
        <Route path="expos" element={<ExposPage />} />
        <Route path="expos/:id" element={<ExpoDetailPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
