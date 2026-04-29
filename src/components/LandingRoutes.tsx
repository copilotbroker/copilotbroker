import { lazy, Suspense } from "react";
import { Route, Navigate } from "react-router-dom";

import EstanciaVelhaTeaser from "@/pages/EstanciaVelhaTeaser";
import BairrodasRosas from "@/pages/BairrodasRosas";
import Canela from "@/pages/Canela";
import EstanciaVelhaBrokerTeaser from "@/pages/EstanciaVelhaBrokerTeaser";
import ProjectLandingPage from "@/pages/ProjectLandingPage";
import ProjectBrokerLandingPage from "@/pages/ProjectBrokerLandingPage";
import BrokerProjectLanding from "@/pages/BrokerProjectLanding";
import GoldenViewLandingPage from "@/pages/goldenview/GoldenViewLandingPage";
import GoldenViewBrokerLandingPage from "@/pages/goldenview/GoldenViewBrokerLandingPage";
import MauricioCardosoLandingPage from "@/pages/mauriciocardoso/MauricioCardosoLandingPage";
import MauricioCardosoBrokerLandingPage from "@/pages/mauriciocardoso/MauricioCardosoBrokerLandingPage";
import TermosGoldenView from "@/pages/goldenview/TermosGoldenView";
import TermosMauricioCardoso from "@/pages/mauriciocardoso/TermosMauricioCardoso";
import Prontos from "@/pages/Prontos";
import ProntosBrokerPage from "@/pages/ProntosBrokerPage";
import HantowerLandingPage from "@/pages/hantower/HantowerLandingPage";
import SentowerLandingPage from "@/pages/sentower/SentowerLandingPage";
import CA2727LandingPage from "@/pages/CA2727LandingPage";
import NAULandingPage from "@/pages/nau/NAULandingPage";
import NAUBrokerLandingPage from "@/pages/nau/NAUBrokerLandingPage";
import TermosNAU from "@/pages/nau/TermosNAU";
import MonacoLandingPage from "@/pages/monaco/MonacoLandingPage";
import MonacoBrokerLandingPage from "@/pages/monaco/MonacoBrokerLandingPage";
import TermosMonaco from "@/pages/monaco/TermosMonaco";
import VivaParkLandingPage from "@/pages/vivapark/VivaParkLandingPage";
import VivaParkBrokerLandingPage from "@/pages/vivapark/VivaParkBrokerLandingPage";
import TermosVivaPark from "@/pages/vivapark/TermosVivaPark";
import NC1LandingPage from "@/pages/vivapark/NC1LandingPage";
import NC1BrokerLandingPage from "@/pages/vivapark/NC1BrokerLandingPage";
import AuraLeganoLandingPage from "@/pages/auralegano/AuraLeganoLandingPage";
import AuraLeganoBrokerLandingPage from "@/pages/auralegano/AuraLeganoBrokerLandingPage";
import TermosAuraLegano from "@/pages/auralegano/TermosAuraLegano";

const StuttgartLandingPage = lazy(() => import("@/pages/stuttgart/StuttgartLandingPage"));
const StuttgartBrokerLandingPage = lazy(() => import("@/pages/stuttgart/StuttgartBrokerLandingPage"));
const StuttgartIvotiV2LandingPage = lazy(() => import("@/pages/stuttgart/StuttgartIvotiV2LandingPage"));
const TermosStuttgart = lazy(() => import("@/pages/stuttgart/TermosStuttgart"));

/**
 * Renders all public landing-page routes.
 *
 * `prefix` is the path segment (without leading/trailing slashes) prepended to every route.
 * - `prefix=""` → legacy URLs (e.g. `/novohamburgo/mauriciocardoso`).
 * - `prefix="enoveimobiliaria"` → org-scoped URLs (e.g. `/enoveimobiliaria/novohamburgo/mauriciocardoso`).
 *
 * Mounted twice in App.tsx so old links (Launches / SEO / external ads) keep working
 * while new copilotbroker.lovable.app links carry the org slug prefix.
 */
export function LandingRoutes({ prefix = "" }: { prefix?: string }) {
  const p = prefix ? `/${prefix}` : "";

  return (
    <>
      {/* GoldenView */}
      <Route path={`${p}/portao/goldenview`} element={<GoldenViewLandingPage />} />
      <Route path={`${p}/portao/goldenview/obrigado`} element={<GoldenViewLandingPage />} />
      <Route path={`${p}/portao/goldenview/termos`} element={<TermosGoldenView />} />
      <Route path={`${p}/portao/goldenview/:brokerSlug`} element={<GoldenViewBrokerLandingPage />} />

      {/* Mauricio Cardoso */}
      <Route path={`${p}/novohamburgo/mauriciocardoso`} element={<MauricioCardosoLandingPage />} />
      <Route path={`${p}/novohamburgo/mauriciocardoso/obrigado`} element={<MauricioCardosoLandingPage />} />
      <Route path={`${p}/novohamburgo/mauriciocardoso/termos`} element={<TermosMauricioCardoso />} />
      <Route path={`${p}/novohamburgo/mauriciocardoso/:brokerSlug/obrigado`} element={<MauricioCardosoBrokerLandingPage />} />
      <Route path={`${p}/novohamburgo/mauriciocardoso/:brokerSlug`} element={<MauricioCardosoBrokerLandingPage />} />

      {/* Legacy GoldenView redirects (only on root prefix) */}
      {!prefix && <Route path="/goldenview" element={<Navigate to="/portao/goldenview" replace />} />}
      {!prefix && <Route path="/goldenview/:brokerSlug" element={<Navigate to="/portao/goldenview" replace />} />}

      {/* Estancia Velha */}
      <Route path={`${p}/estanciavelha`} element={<EstanciaVelhaTeaser />} />
      <Route path={`${p}/estanciavelha/ca2727`} element={<CA2727LandingPage />} />
      <Route path={`${p}/estanciavelha/ca2727/obrigado`} element={<CA2727LandingPage />} />
      <Route path={`${p}/estanciavelha/hantower`} element={<HantowerLandingPage />} />
      <Route path={`${p}/estanciavelha/sentower`} element={<SentowerLandingPage />} />
      <Route path={`${p}/estanciavelha/sentower/obrigado`} element={<SentowerLandingPage />} />
      <Route path={`${p}/estanciavelha/bairrodasrosas`} element={<BairrodasRosas />} />
      <Route path={`${p}/canela`} element={<Canela />} />
      <Route path={`${p}/estanciavelha/:brokerSlug`} element={<EstanciaVelhaBrokerTeaser />} />

      {/* Prontos */}
      <Route path={`${p}/prontos`} element={<Prontos />} />
      <Route path={`${p}/prontos/:brokerSlug`} element={<ProntosBrokerPage />} />

      {/* NAU */}
      <Route path={`${p}/osorio/nau`} element={<NAULandingPage />} />
      <Route path={`${p}/osorio/nau/obrigado`} element={<NAULandingPage />} />
      <Route path={`${p}/osorio/nau/termos`} element={<TermosNAU />} />
      <Route path={`${p}/osorio/nau/:brokerSlug`} element={<NAUBrokerLandingPage />} />

      {/* Mônaco */}
      <Route path={`${p}/xangrila/monaco`} element={<MonacoLandingPage />} />
      <Route path={`${p}/xangrila/monaco/obrigado`} element={<MonacoLandingPage />} />
      <Route path={`${p}/xangrila/monaco/termos`} element={<TermosMonaco />} />
      <Route path={`${p}/xangrila/monaco/:brokerSlug/obrigado`} element={<MonacoBrokerLandingPage />} />
      <Route path={`${p}/xangrila/monaco/:brokerSlug`} element={<MonacoBrokerLandingPage />} />

      {/* Vivapark */}
      <Route path={`${p}/portobelo/vivapark`} element={<VivaParkLandingPage />} />
      <Route path={`${p}/portobelo/vivapark/obrigado`} element={<VivaParkLandingPage />} />
      <Route path={`${p}/portobelo/vivapark/termos`} element={<TermosVivaPark />} />
      <Route path={`${p}/portobelo/vivapark/:brokerSlug/obrigado`} element={<VivaParkBrokerLandingPage />} />
      <Route path={`${p}/portobelo/vivapark/:brokerSlug`} element={<VivaParkBrokerLandingPage />} />

      {/* NC-1 */}
      <Route path={`${p}/portobelo/nc1`} element={<NC1LandingPage />} />
      <Route path={`${p}/portobelo/nc1/obrigado`} element={<NC1LandingPage />} />
      <Route path={`${p}/portobelo/nc1/:brokerSlug/obrigado`} element={<NC1BrokerLandingPage />} />
      <Route path={`${p}/portobelo/nc1/:brokerSlug`} element={<NC1BrokerLandingPage />} />
      <Route path={`${p}/portobelo/asramos`} element={<Navigate to={`${p}/portobelo/nc1`} replace />} />
      <Route path={`${p}/portobelo/asramos/:brokerSlug`} element={<Navigate to={`${p}/portobelo/nc1`} replace />} />

      {/* Stuttgart */}
      <Route path={`${p}/ivoti/stuttgart`} element={<Suspense fallback={null}><StuttgartLandingPage /></Suspense>} />
      <Route path={`${p}/ivoti/stuttgart/obrigado`} element={<Suspense fallback={null}><StuttgartLandingPage /></Suspense>} />
      <Route path={`${p}/ivoti/stuttgart/termos`} element={<Suspense fallback={null}><TermosStuttgart /></Suspense>} />
      <Route path={`${p}/ivoti/stuttgartivoti`} element={<Suspense fallback={null}><StuttgartIvotiV2LandingPage /></Suspense>} />
      <Route path={`${p}/ivoti/stuttgartivoti/obrigado`} element={<Suspense fallback={null}><StuttgartIvotiV2LandingPage /></Suspense>} />
      <Route path={`${p}/ivoti/stuttgart/:brokerSlug/obrigado`} element={<Suspense fallback={null}><StuttgartBrokerLandingPage /></Suspense>} />
      <Route path={`${p}/ivoti/stuttgart/:brokerSlug`} element={<Suspense fallback={null}><StuttgartBrokerLandingPage /></Suspense>} />

      {/* Aura Legano */}
      <Route path={`${p}/novasantarita/auralegano`} element={<AuraLeganoLandingPage />} />
      <Route path={`${p}/novasantarita/auralegano/obrigado`} element={<AuraLeganoLandingPage />} />
      <Route path={`${p}/novasantarita/auralegano/termos`} element={<TermosAuraLegano />} />
      <Route path={`${p}/novasantarita/auralegano/:brokerSlug/obrigado`} element={<AuraLeganoBrokerLandingPage />} />
      <Route path={`${p}/novasantarita/auralegano/:brokerSlug`} element={<AuraLeganoBrokerLandingPage />} />

      {/* Dynamic city/project routes — MUST be last in this group */}
      <Route path={`${p}/:citySlug/:projectSlug`} element={<ProjectLandingPage />} />
      <Route path={`${p}/:citySlug/:projectSlug/:brokerSlug`} element={<ProjectBrokerLandingPage />} />
    </>
  );
}
