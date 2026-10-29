import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPin,
  XCircle,
} from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useRequestCounts } from "@/data/requests.queries";
import { supabase } from "@/integrations/supabase/client";
import { useHotel } from "@/lib/hotel-context";
import { cn } from "@/lib/utils";

interface NavItem {
  to:
    | "/dashboard"
    | "/demandes"
    | "/attente-infos"
    | "/demandes-acceptees"
    | "/demandes-refusees"
    | "/relances";
  label: string;
  icon: LucideIcon;
  count?: number | undefined;
  nested?: boolean;
}

function NavLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        item.nested && "ml-3 py-1 text-[11px]",
      )}
      activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}
    >
      <Icon className={cn("size-3.5 shrink-0", item.nested && "size-3")} />
      <span className="flex-1 truncate">{item.label}</span>
      {typeof item.count === "number" && (
        <span className="tabular rounded-full bg-sidebar-border px-1.5 py-0.2 text-[10px] font-semibold text-sidebar-foreground">
          {item.count}
        </span>
      )}
    </Link>
  );
}

export function AppSidebar() {
  const { data } = useRequestCounts();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { hotel, hotels, isLoading: hotelsLoading, selectHotel } = useHotel();

  const isArchiveRoute =
    currentPath === "/demandes-acceptees" || currentPath === "/demandes-refusees";

  const [hydrated, setHydrated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [archivesOpen, setArchivesOpen] = useState(isArchiveRoute);
  const [hotelMenuOpen, setHotelMenuOpen] = useState(false);

  useEffect(() => {
    setHydrated(true);
    supabase.auth.getUser().then(({ data: u }) => setUserEmail(u.user?.email ?? undefined));
  }, []);

  const counts = hydrated ? data : undefined;

  async function handleSignOut() {
    try {
      localStorage.removeItem("okkosmart_hotel");
    } catch (error) {
      console.warn("Impossible de supprimer le dernier hôtel mémorisé :", error);
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    /* >>> LARGEUR SIDEBAR : modifiez "w-44" ci-dessous (et "pl-44" dans _authenticated.tsx) <<< */
    <aside className="fixed inset-y-0 left-0 z-30 flex w-44 flex-col bg-sidebar text-sidebar-foreground">
      {/* Sélecteur d'hôtel intégré à l'en-tête de la sidebar */}
      <div className="relative border-b border-sidebar-border px-3 py-3.5">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={hotelMenuOpen}
          onClick={() => setHotelMenuOpen((open) => !open)}
          className="flex w-full items-center gap-2 rounded-md text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary font-display text-sm font-semibold text-sidebar-primary-foreground">
            O
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-sm font-semibold leading-tight tracking-wide">OKKOSMART</span>
            <span className="block truncate text-[11px] text-sidebar-muted">
              {hotel?.code ?? hotel?.nom ?? "Choisir un hôtel"}
            </span>
          </span>
          <ChevronDown className={cn("size-3.5 shrink-0 text-sidebar-muted transition-transform", hotelMenuOpen && "rotate-180")} />
        </button>

        {hotelMenuOpen && (
          <div
            role="listbox"
            aria-label="Choisir un hôtel"
            className="absolute left-3 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-sidebar-border bg-card text-card-foreground shadow-xl"
          >
            <div className="border-b border-border px-3 py-2">
              <p className="text-xs font-semibold">Changer d'hôtel</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Sélectionnez votre établissement</p>
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {hotelsLoading ? (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">Chargement des hôtels...</p>
              ) : hotels.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">Aucun hôtel disponible.</p>
              ) : (
                hotels.map((item) => {
                  const selected = hotel?.code === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        selectHotel(item);
                        setHotelMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent",
                        selected && "bg-accent",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium">{item.nom}</span>
                        {(item.ville || item.adresse) && (
                          <span className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            {[item.adresse, item.ville].filter(Boolean).join(", ")}
                          </span>
                        )}
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">{item.code}</span>
                      </span>
                      {selected && <Check className="size-4 shrink-0 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          <NavLink item={{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }} />
          <NavLink
            item={{ to: "/demandes", label: "Demandes", icon: Inbox, count: counts?.active }}
          />
          <NavLink
            item={{
              to: "/attente-infos",
              label: "Attente infos",
              icon: Clock,
              count: counts?.waitingClient,
            }}
          />
          <NavLink
            item={{ to: "/relances", label: "Relances", icon: Bell, count: counts?.followUp }}
          />
        </div>

        {/* Section Archives repliable */}
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => setArchivesOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <span className="flex items-center gap-2">
              <Archive className="size-3.5 shrink-0" />
              <span>Archives</span>
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                archivesOpen ? "rotate-0" : "-rotate-90",
              )}
            />
          </button>

          {archivesOpen && (
            <div className="space-y-0.5 pt-0.5">
              <NavLink
                item={{
                  to: "/demandes-acceptees",
                  label: "Envoyées",
                  icon: CheckCircle2,
                  count: counts?.accepted,
                  nested: true,
                }}
              />
              <NavLink
                item={{
                  to: "/demandes-refusees",
                  label: "Bloquées",
                  icon: XCircle,
                  count: counts?.refused,
                  nested: true,
                }}
              />
            </div>
          )}
        </div>
      </nav>

      {/* Pied utilisateur compact */}
      <div className="space-y-1.5 border-t border-sidebar-border px-3 py-3">
        {userEmail && (
          <p className="truncate text-[11px] font-medium text-sidebar-foreground" title={userEmail}>
            {userEmail}
          </p>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-[11px] text-sidebar-muted transition-colors hover:text-sidebar-foreground"
        >
          <LogOut className="size-3" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
