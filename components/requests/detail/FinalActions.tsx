import { useState } from "react";
import { useHotel } from "@/lib/hotel-context";
import { Ban, CheckCircle2, MailCheck, Paperclip, Send, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { checkSalleCapacity } from "@/config/seminaire";
import { relanceDevisFn } from "@/lib/n8n.functions";
import { markRegistreReponduFn } from "@/lib/registre.functions";
import { requestKeys } from "@/data/requests.queries";

function FollowUpActions({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const relance = useServerFn(relanceDevisFn);
  const markRepondu = useServerFn(markRegistreReponduFn);
  const { hotel } = useHotel(); // <-- AJOUT
  const [busy, setBusy] = useState(false);

  const handleRelance = async () => {
    setBusy(true);
    try {
      const res = await relance({
        data: {
          id,
          hotel: hotel?.nom ?? "",
          hotel_code: hotel?.code ?? "",
          hotel_adresse: hotel?.adresse ?? "",
        },
      });
      if (res.ok) toast.success("Relance envoyée");
      else toast.error("La relance n'a pas été confirmée par le service d'envoi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la relance");
    } finally {
      setBusy(false);
    }
  };
  // ... reste inchangé


  const handleRepondu = async () => {
    setBusy(true);
    try {
      const updated = await markRepondu({ data: { id } });
      if (updated) queryClient.setQueryData(requestKeys.detail(id), updated);
      await queryClient.invalidateQueries({ queryKey: requestKeys.all });
      toast.success("Demande rangée dans Envoyées");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" disabled={busy} onClick={handleRepondu}>
        <MailCheck />
        Répondu
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={busy}>
            <Send />
            Relancer
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Envoyer la relance au client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Un email de relance sera envoyé au client pour ce devis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRelance}>Envoyer la relance</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDecideRequest } from "@/data/requests.queries";
import {
  CLOSED_STATUSES,
  type FbPlanningItem,
  type NightPrice,
  type SalesRequest,
  type SeminairePlanningItem,
} from "@/data/types";
import type { PrestationPrices } from "@/routes/_authenticated.demandes.$id";
import { formatDateTime } from "@/lib/format";

export function FinalActions({
  request: r,
  emailDraft = "",
  prices = {},
  nightPrices = [],
  seminairePlanning = [],
  fbPlanning = [],
  hasUnsyncedModifications = false,
  onGenerateAndValidate,
}: {
  request: SalesRequest;
  emailDraft?: string;
  prices?: PrestationPrices;
  nightPrices?: NightPrice[];
  seminairePlanning?: SeminairePlanningItem[];
  fbPlanning?: FbPlanningItem[];
  hasUnsyncedModifications?: boolean;
  onGenerateAndValidate?: () => void;
}) {
  const { hotel } = useHotel();
  const [includeQuote, setIncludeQuote] = useState(true);

  const hotelCode =
    r.hotel_code ||
    hotel?.code ||
    (r.hotel?.toLowerCase().includes("défense") || r.hotel?.includes("2")
      ? "DEMO_PARIS_2"
      : "DEMO_PARIS");

  const participants = r.seminaire_pax ?? r.pax;
  const hasRedAlert = seminairePlanning.some((row) => {
    const res = checkSalleCapacity({
      salleName: row.salle,
      dispositionRaw: row.disposition,
      participants,
      hotelCode,
    });
    return res.isRed;
  });

  const decide = useDecideRequest();
  const closed = CLOSED_STATUSES.includes(r.statut);

  // Liste des adresses en copie
  const ccEmails = (r.emails_copie ?? "")
    .split(/[,\s;]+/)
    .map((e) => e.trim())
    .filter(Boolean);

  // Identifier uniquement les prix qui ont été modifiés par rapport à Supabase
  const changements: Record<string, { initial: number | undefined; modifie: number | undefined }> = {};
  for (const [key, val] of Object.entries(prices)) {
    const original = r[key as keyof typeof r];
    if (val !== undefined && val !== original) {
      changements[key] = {
        initial: typeof original === "number" ? original : undefined,
        modifie: val,
      };
    }
  }

  const formattedTarifRecommande = nightPrices.map((n) => n.prix_bb ?? 0).join(";");

  const acceptPayload = {
    id: r.id,
    hotel: hotel?.nom ?? "",
    hotel_code: hotel?.code ?? "",
    hotel_adresse: hotel?.adresse ?? "",
    email: r.email,
    email_final: emailDraft,
    recap_devis: r.recap_devis,
    nom_groupe: r.nom_groupe,
    societe: r.societe,
    contact: r.contact,
    date_debut: r.date_debut,
    date_fin: r.date_fin,
    tarifs_par_nuit: nightPrices,
    pax: r.pax,
    chambres: r.chambres,
    numero_devis: r.numero_devis,
    devis_fichier_id: r.devis_fichier_id,
    devis_version: r.devis_version,
    tarif_recommande: formattedTarifRecommande,
    taxe_sejour_unit: 6.95,
    cc: ccEmails,
    inclure_devis: includeQuote,
    seminaire_salle_prix: prices.seminaire_salle_prix ?? r.seminaire_salle_prix,
    seminaire_jours: seminairePlanning,
    cafe_d_accueil_prix: prices.cafe_d_accueil_prix ?? r.cafe_d_accueil_prix,
    pause_matin_prix: prices.pause_matin_prix ?? r.pause_matin_prix,
    pause_apres_midi_prix: prices.pause_apres_midi_prix ?? r.pause_apres_midi_prix,
    fb_cocktail_prix: prices.fb_cocktail_prix ?? r.fb_cocktail_prix,
    seminaire_planning: seminairePlanning,
    fb_planning: fbPlanning,
    total_seminaire: seminairePlanning.reduce((sum, item) => sum + (Number(item.prix) || 0), 0),
    total_fb: fbPlanning.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
    fb_dejeuner_prix: prices.fb_dejeuner_prix ?? r.fb_dejeuner_prix,
    fb_diner_prix: prices.fb_diner_prix ?? r.fb_diner_prix,
    fb_dejeuner_assis_prix: prices.fb_dejeuner_assis_prix ?? r.fb_dejeuner_assis_prix,
    fb_diner_assis_prix: prices.fb_diner_assis_prix ?? r.fb_diner_assis_prix,
    changements_prix: Object.keys(changements).length > 0 ? changements : undefined,
  };

  const refusePayload = {
    id: r.id,
    hotel: hotel?.nom ?? "",
    hotel_code: hotel?.code ?? "",
    hotel_adresse: hotel?.adresse ?? "",
    email: r.email,
    nom_groupe: r.nom_groupe,
    cc: ccEmails,
  };

  if (closed) {
    const accepted = r.statut === "Acceptée";
    return (
      <section className="surface-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          {accepted ? (
            <CheckCircle2 className="size-5 text-success" />
          ) : (
            <XCircle className="size-5 text-danger" />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">
              Demande {accepted ? "acceptée" : "refusée"}
              {accepted && r.repondu ? " · Client a répondu" : ""}
            </p>
            {r.date_action && (
              <p className="text-xs text-muted-foreground">Le {formatDateTime(r.date_action)}</p>
            )}
          </div>
        </div>
        {accepted && !r.repondu && <FollowUpActions id={r.id} />}
      </section>
    );
  }

  // En mode "Exclure devis", le bouton Valider est utilisable même si devis_lien est vide
  const canValidate = includeQuote ? Boolean(r.devis_lien) : true;

  return (
    <section className="surface-card p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Décision commerciale</p>
          <p className="text-xs text-muted-foreground">
            Validez la demande pour la classer dans les demandes acceptées, ou bloquez-la.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* BOUTON BLOQUER */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={decide.isPending}>
                <Ban className="mr-1.5 size-4" />
                Bloquer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bloquer cette demande ?</AlertDialogTitle>
                <AlertDialogDescription>
                  La demande {r.id} passera au statut « Refusée » et sera classée dans Demandes
                  répondues › Demandes bloquées. Elle restera consultable.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    decide.mutate({ id: r.id, decision: "refuse", webhook: refusePayload })
                  }
                >
                  Confirmer le blocage
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* BOUTON BASCULE INCLURE / EXCLURE DEVIS */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIncludeQuote((prev) => !prev)}
            className={`transition-colors ${
              includeQuote
                ? "border-destructive/40 bg-destructive/10 text-destructive dark:text-red-400 hover:bg-destructive/20"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            <Paperclip className={`mr-1.5 size-4 ${includeQuote ? "line-through opacity-70" : ""}`} />
            {includeQuote ? "Exclure le devis" : "Inclure le devis"}
          </Button>

          {/* BOUTON VALIDER LA DEMANDE */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={decide.isPending || !canValidate}>
                <CheckCircle2 className="mr-1.5 size-4" />
                Valider la demande
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {!includeQuote
                    ? "Envoyer le mail sans devis ?"
                    : hasUnsyncedModifications
                    ? "Modifications non intégrées au devis"
                    : hasRedAlert
                    ? "La salle choisie ne convient pas au nombre de participants."
                    : "Valider cette demande ?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {!includeQuote
                    ? `Le mail sera envoyé directement au client sans pièce jointe devis. Pensez à mettre l'hôtel alternatif en copie.`
                    : hasUnsyncedModifications
                    ? "Vous avez des modifications non prises en compte dans le devis. Générer une nouvelle version avant d'envoyer ?"
                    : hasRedAlert
                    ? "Une ou plusieurs salles présentent un problème de capacité ou de disposition pour ce groupe. Valider quand même ?"
                    : `La demande ${r.id} passera au statut « Acceptée » et sera classée dans Demandes répondues › Demandes envoyées.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                {includeQuote && hasUnsyncedModifications ? (
                  <>
                    <AlertDialogAction
                      onClick={() =>
                        decide.mutate({
                          id: r.id,
                          decision: "accept",
                          webhook: acceptPayload,
                        })
                      }
                      className="border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    >
                      Envoyer la version actuelle
                    </AlertDialogAction>
                    {onGenerateAndValidate && (
                      <AlertDialogAction onClick={onGenerateAndValidate}>
                        Générer puis envoyer
                      </AlertDialogAction>
                    )}
                  </>
                ) : (
                  <AlertDialogAction
                    onClick={() =>
                      decide.mutate({
                        id: r.id,
                        decision: "accept",
                        webhook: acceptPayload,
                      })
                    }
                  >
                    {!includeQuote
                      ? "Confirmer l'envoi sans devis"
                      : hasRedAlert
                      ? "Valider quand même"
                      : "Valider la demande"}
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* AVERTISSEMENT EXCLURE DEVIS */}
      {!includeQuote && (
        <p className="text-xs font-semibold text-destructive dark:text-red-400 bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
          Le mail partira sans devis. Pensez à mettre l’hôtel alternatif en copie.
        </p>
      )}
    </section>
  );
}
