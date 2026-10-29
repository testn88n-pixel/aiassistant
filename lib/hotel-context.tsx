import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Check, MapPin, X } from "lucide-react";

import { getHotelsFn } from "@/lib/hotels.functions";

export interface Hotel {
  code: string;
  nom: string;
  adresse?: string;
  ville?: string;
  actif?: boolean;
}

interface HotelContextValue {
  hotel: Hotel | null;
  hotels: Hotel[];
  isLoading: boolean;
  openSelector: () => void;
  selectHotel: (hotel: Hotel) => void;
}

const STORAGE_KEY = "okkosmart_hotel";

const defaultHotelContext: HotelContextValue = {
  hotel: null,
  hotels: [],
  isLoading: false,
  openSelector: () => {},
  selectHotel: () => {},
};

const HotelContext = createContext<HotelContextValue>(defaultHotelContext);

export function HotelProvider({ children }: { children: ReactNode }) {
  const fetchHotels = useServerFn(getHotelsFn);
  const queryClient = useQueryClient();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Récupération des hôtels autorisés pour le commercial connecté
  const { data: hotels = [], isLoading } = useQuery<Hotel[]>({
    queryKey: ["available-hotels"],
    queryFn: () => fetchHotels(),
  });

  // 2. Synchronisation initiale avec le localStorage
  useEffect(() => {
    if (isLoading) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Hotel = JSON.parse(saved);
        const matched = hotels.find((h) => h.code === parsed.code);
        if (matched) {
          setHotel(matched);
        } else {
          setHotel(null);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setHotel(null);
    } finally {
      setIsInitialized(true);
    }
  }, [hotels, isLoading]);

  const selectHotel = (selected: Hotel) => {
    setHotel(selected);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch {
      // Ignorer
    }
    setIsSelectorOpen(false);
    // Recharge les requêtes avec le code de l'hôtel choisi
    void queryClient.invalidateQueries({ queryKey: ["requests"] });
  };

  const openSelector = () => setIsSelectorOpen(true);

  // Tant que l'hôtel n'a pas été choisi : affichage de l'écran plein écran
  if (!hotel) {
    return (
      <HotelContext.Provider
        value={{
          hotel,
          hotels,
          isLoading,
          openSelector,
          selectHotel,
        }}
      >
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="surface-card w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary font-display text-lg font-semibold text-primary-foreground">
                O
              </div>
              <div>
                <p className="font-display text-lg font-semibold leading-tight text-foreground">OKKOSMART</p>
                <p className="text-xs text-muted-foreground">Sélection de l'établissement</p>
              </div>
            </div>

            <div>
              <p className="eyebrow text-muted-foreground">Session de travail</p>
              <h1 className="font-display text-xl font-semibold text-foreground">
                Choisissez votre hôtel
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Sélectionnez l'établissement sur lequel vous souhaitez travailler.
              </p>
            </div>

            <div className="mt-6 max-h-[60vh] space-y-2.5 overflow-y-auto pr-1">
              {isLoading || !isInitialized ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Chargement des hôtels autorisés...
                </div>
              ) : hotels.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Aucun hôtel actif n'est attribué à votre compte. Contactez votre administrateur.
                </div>
              ) : (
                hotels.map((h) => (
                  <button
                    key={h.code}
                    type="button"
                    onClick={() => selectHotel(h)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-foreground/30 hover:bg-accent/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                        <Building2 className="size-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{h.nom}</p>
                        {(h.ville || h.adresse) && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            <span>{[h.adresse, h.ville].filter(Boolean).join(", ")}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
                      {h.code}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </HotelContext.Provider>
    );
  }

  // Dès qu'un hôtel est sélectionné : on affiche l'application normale
  return (
    <HotelContext.Provider
      value={{
        hotel,
        hotels,
        isLoading,
        openSelector,
        selectHotel,
      }}
    >
      {children}

      {/* Modal permettant de changer d'hôtel en cours de session */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="surface-card w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-muted-foreground">Établissement</p>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Changer d'hôtel
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sélectionnez un autre établissement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectorOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Fermer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {hotels.map((h) => {
                const isSelected = hotel?.code === h.code;
                return (
                  <button
                    key={h.code}
                    type="button"
                    onClick={() => selectHotel(h)}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground shadow-xs"
                        : "border-border bg-card hover:border-foreground/30 hover:bg-accent/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${
                          isSelected
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-border bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <Building2 className="size-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{h.nom}</p>
                        {(h.ville || h.adresse) && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            <span>{[h.adresse, h.ville].filter(Boolean).join(", ")}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
                        {h.code}
                      </span>
                      {isSelected && <Check className="size-4 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </HotelContext.Provider>
  );
}

export function useHotel() {
  const ctx = useContext(HotelContext);
  return ctx ?? defaultHotelContext;
}
