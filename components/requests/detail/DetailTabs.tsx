import { useEffect, useMemo, useState } from "react";
import { useHotel } from "@/lib/hotel-context";
import { Check, Clock, Copy, Download, ExternalLink, FileCheck, FileEdit, Loader2, RotateCcw, Save, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { HOTEL_GROUP_EMAIL } from "@/data/mock-requests";
import { CLOSED_STATUSES, type SalesRequest } from "@/data/types";
import { formatDateTime, formatDevisDateTime, hasValue } from "@/lib/format";
import { updateRegistreEmailsCopieFn } from "@/lib/registre.functions";
import { sendClientEmailFn } from "@/lib/n8n.functions";
import { requestsRepository } from "@/data/requests-repository";
import { requestKeys } from "@/data/requests.queries";


import { SectionTitle } from "./SectionTitle";

/* ------------------------------- Devis ------------------------------- */

/**
 * Backyou integration hooks. Replace these with the real integration
 * (server function / API call) once Backyou is connected.
 */
function downloadQuote(request: SalesRequest) {
  toast.info(`Téléchargement du devis ${request.numero_devis ?? request.id}`, {
    description: "L'intégration Backyou sera connectée prochainement.",
  });
}

function openInBackyou(request: SalesRequest) {
  toast.info(`Ouverture du devis ${request.numero_devis ?? request.id} dans Backyou`, {
    description: "L'intégration Backyou sera connectée prochainement.",
  });
}

function QuoteTab({
  request: r,
  onModifyDevis,
  isModifyingDevis = false,
}: {
  request: SalesRequest;
  onModifyDevis?: ((commentaire?: string) => void) | undefined;
  isModifyingDevis?: boolean | undefined;
}) {
  const [comment, setComment] = useState("");
  const isClosed = CLOSED_STATUSES.includes(r.statut);

  if (r.statut === "Attente RM") {
    return (
      <div className="flex items-center gap-2.5 px-5 py-5 text-sm text-muted-foreground">
        <Clock className="size-4 text-brass" />
        <span>Devis en attente de la réponse du RM</span>
      </div>
    );
  }

  if (!hasValue(r.devis_lien)) {
    return (
      <div className="flex items-center gap-2.5 px-5 py-5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-brass" />
        <span>Devis en cours de génération</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Boutons d'actions principaux */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="default" size="sm" asChild>
            <a href={r.devis_lien} target="_blank" rel="noopener noreferrer">
              <Download className="mr-1.5 size-4" />
              Télécharger le devis
            </a>
          </Button>

          <Button variant="outline" size="sm" onClick={() => openInBackyou(r)}>
            <ExternalLink className="mr-1.5 size-4" />
            Ouvrir Backyou
          </Button>

          {/* Bouton Modifier le devis avec commentaire facultatif */}
          {!isClosed && onModifyDevis && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Commentaire de révision (facultatif)"
                disabled={isModifyingDevis}
                className="w-56 rounded border border-border bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 shadow-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass disabled:opacity-50"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isModifyingDevis}
                onClick={() => {
                  onModifyDevis(comment);
                  setComment("");
                }}
              >
                {isModifyingDevis ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Génération…
                  </>
                ) : (
                  <>
                    <FileEdit className="mr-1.5 size-3.5" />
                    Modifier le devis
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Version et date */}
        <span className="text-xs text-muted-foreground">
          Version {r.devis_version ?? 1}
          {r.devis_genere_le && ` – générée le ${formatDevisDateTime(r.devis_genere_le)}`}
        </span>
      </div>
    </div>
  );
}


/* -------------------------- Réponse client -------------------------- */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractEmailsFromText(text?: string | null): string[] {
  if (!text) return [];
  const matches = text.match(/[\w.+%-]+@[\w.-]+\.[a-zA-Z]{2,}/g);
  return matches ? Array.from(new Set(matches.map((e) => e.trim().toLowerCase()))) : [];
}

function parseEmailsList(text?: string | null): string[] {
  if (!text) return [];
  return text
    .split(/[,\s;]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

function ClientResponseTab({
  request: r,
  draft,
  setDraft,
  original,
}: {
  request: SalesRequest;
  draft: string;
  setDraft: (value: string) => void;
  original: string;
}) {
  const queryClient = useQueryClient();
  const sendClientEmail = useServerFn(sendClientEmailFn);
  const saveEmailsCopie = useServerFn(updateRegistreEmailsCopieFn);
  const { hotel } = useHotel();
  const [isSending, setIsSending] = useState(false);
  const [isSavingCc, setIsSavingCc] = useState(false);

  // Initialisation des adresses Cc
  const initialEmails = useMemo(() => parseEmailsList(r.emails_copie), [r.emails_copie]);
  const [ccList, setCcList] = useState<string[]>(initialEmails);
  const [inputValue, setInputValue] = useState("");

  // Suggestions issues de mettre_en_copie si emails_copie est vide
  const suggestedEmails = useMemo(() => {
    if (r.emails_copie && r.emails_copie.trim().length > 0) return [];
    const extracted = extractEmailsFromText(r.mettre_en_copie);
    return extracted.filter((e) => !ccList.includes(e));
  }, [r.emails_copie, r.mettre_en_copie, ccList]);

  // Synchronisation si r.emails_copie change depuis la base
  useEffect(() => {
    setCcList(parseEmailsList(r.emails_copie));
  }, [r.emails_copie]);

  const hasInvalidEmail = ccList.some((e) => !EMAIL_REGEX.test(e));
  const isCcDirty = useMemo(() => {
    const currentJoined = ccList.join(", ");
    const initialJoined = initialEmails.join(", ");
    return currentJoined !== initialJoined;
  }, [ccList, initialEmails]);

  const addEmail = (raw: string) => {
    const parts = raw.split(/[,\s;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!parts.length) return;
    setCcList((prev) => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.includes(p)) next.push(p);
      }
      return next;
    });
    setInputValue("");
  };

  const removeEmail = (index: number) => {
    setCcList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      if (inputValue.trim()) {
        addEmail(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && ccList.length > 0) {
      removeEmail(ccList.length - 1);
    }
  };

  const handleSaveCc = async (): Promise<boolean> => {
    if (hasInvalidEmail) {
      toast.error("Veuillez corriger ou retirer les adresses e-mail invalides.");
      return false;
    }
    setIsSavingCc(true);
    try {
      const joined = ccList.join(", ");
      const updated = await saveEmailsCopie({ data: { id: r.id, emails_copie: joined } });
      if (updated) {
        queryClient.setQueryData(requestKeys.detail(r.id), updated);
      }
      toast.success("Copies enregistrées");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement des copies");
      return false;
    } finally {
      setIsSavingCc(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      toast.success("Réponse copiée dans le presse-papier");
    } catch {
      toast.error("Impossible de copier la réponse");
    }
  };

  const handleSendToClient = async () => {
    if (!draft.trim()) {
      toast.error("Le message est vide.");
      return;
    }

    if (hasInvalidEmail) {
      toast.error("Veuillez corriger les adresses e-mail invalides en copie.");
      return;
    }

    // Enregistrement automatique des copies si modifiées
    if (isCcDirty) {
      const ok = await handleSaveCc();
      if (!ok) return;
    }

    setIsSending(true);
    try {
      const res = await sendClientEmail({
        data: {
          id: r.id,
          message: draft,
          hotel: hotel?.nom ?? "",
          hotel_code: hotel?.code ?? "",
          hotel_adresse: hotel?.adresse ?? "",
          cc: ccList,
        },
      });

      if (res.status === 409) {
        toast.warning(res.error ?? "Cette demande n'est plus en attente d'infos.");
        await queryClient.invalidateQueries({ queryKey: requestKeys.all });
        return;
      }

      if (res.ok) {
        toast.success("Email envoyé au client. La demande a été transmise.");
        await queryClient.invalidateQueries({ queryKey: requestKeys.all });
      } else {
        toast.error("L'envoi a échoué via n8n. Réessayez.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 p-5">
      <div className="grid gap-2 text-sm">
        {hasValue(r.email) && (
          <p>
            <span className="text-muted-foreground">À : </span>
            {r.contact ? `${r.contact} <${r.email}>` : r.email}
          </p>
        )}

        {/* CHAMP CC */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 pt-0.5">
          <span className="text-muted-foreground pt-1 text-sm shrink-0">Cc :</span>
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5 min-h-9 w-full rounded-md border border-input bg-card px-2 py-1 text-sm">
              {ccList.map((email, idx) => {
                const isValid = EMAIL_REGEX.test(email);
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                      isValid
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400"
                    }`}
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(idx)}
                      className="hover:opacity-75 focus:outline-none"
                      title="Retirer"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                );
              })}

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (inputValue.trim()) addEmail(inputValue);
                }}
                placeholder={ccList.length === 0 ? "Ajouter un email en copie (Entrée pour valider)…" : ""}
                className="flex-1 min-w-[180px] bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Suggestions depuis mettre_en_copie */}
            {suggestedEmails.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                <span>Suggéré par le RM :</span>
                                {suggestedEmails.map((email: string) => (

                  <button
                    key={email}
                    type="button"
                    onClick={() => addEmail(email)}
                    className="inline-flex items-center gap-1 rounded border border-dashed border-border bg-muted/50 px-1.5 py-0.5 hover:bg-muted text-foreground transition-colors"
                  >
                    <span>+ {email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSaveCc()}
            disabled={!isCcDirty || isSavingCc || hasInvalidEmail}
            className="shrink-0 self-start text-xs h-9"
          >
            {isSavingCc ? <Loader2 className="mr-1 size-3 animate-spin" /> : <Save className="mr-1 size-3" />}
            Enregistrer
          </Button>
        </div>

        {hasValue(r.subject) && (
          <p>
            <span className="text-muted-foreground">Objet : </span>RE : {r.subject}
          </p>
        )}
      </div>

      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={16}
        className="bg-card font-sans text-sm leading-relaxed"
        aria-label="Brouillon de réponse client"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Brouillon préparé par l'assistant — relisez et ajustez avant envoi.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={copy} disabled={!draft || isSending}>
            <Copy className="mr-1 size-3.5" />
            Copier la réponse
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSendToClient}
            disabled={!draft || isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Envoi en cours…
              </>
            ) : (
              <>
                <Send className="mr-1.5 size-3.5" />
                Envoyer au client
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}


/* --------------------------- Mail original --------------------------- */

function OriginalMailTab({ request: r }: { request: SalesRequest }) {
  if (!hasValue(r.email_original)) {
    return <p className="px-5 py-10 text-center text-sm text-muted-foreground">Email original indisponible.</p>;
  }
  const from = r.contact ? `${r.contact} <${r.email ?? ""}>` : r.email;
  return (
    <div className="p-5">
      <div className="grid gap-1 border-b border-border pb-4 text-sm">
        {hasValue(from) && (
          <p>
            <span className="inline-block w-24 text-muted-foreground">De</span>
            {from}
          </p>
        )}
        <p>
          <span className="inline-block w-24 text-muted-foreground">À</span>
          {HOTEL_GROUP_EMAIL}
        </p>
        {hasValue(r.date_email) && (
          <p>
            <span className="inline-block w-24 text-muted-foreground">Date</span>
            {formatDateTime(r.date_email)}
          </p>
        )}
        {hasValue(r.subject) && (
          <p>
            <span className="inline-block w-24 text-muted-foreground">Objet</span>
            <span className="font-medium">{r.subject}</span>
          </p>
        )}
      </div>
      <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
        {r.email_original}
      </pre>
    </div>
  );
}

/* ----------------------------- Historique ---------------------------- */

function HistoryTab({ request: r }: { request: SalesRequest }) {
  const events = [...(r.historique ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  if (events.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-muted-foreground">Aucun événement enregistré.</p>;
  }
  return (
    <ol className="p-5">
      {events.map((e, i) => {
        const last = i === events.length - 1;
        return (
          <li key={`${e.date}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && <span className="absolute left-[7px] top-5 h-full w-px bg-border" />}
            <span className="relative mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-brass-soft">
              <Check className="size-2.5 text-brass" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{e.action}</p>
                <p className="tabular text-xs text-muted-foreground">{formatDateTime(e.date)}</p>
              </div>
              {hasValue(e.detail) && <p className="mt-0.5 text-sm text-muted-foreground">{e.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* -------------------------------- Tabs ------------------------------- */

export function DetailTabs({
  request,
  draft,
  onDraftChange,
  onModifyDevis,
  isModifyingDevis,
}: {
  request: SalesRequest;
  draft: string;
  onDraftChange: (value: string) => void;
  onModifyDevis?: ((commentaire?: string) => void) | undefined;
  isModifyingDevis?: boolean | undefined;
}) {

  return (
    <section className="space-y-4">
      <SectionTitle title="Détails" />
      <Tabs defaultValue="devis" className="surface-card overflow-hidden">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-2">
          <TabsTrigger value="devis">Devis</TabsTrigger>
          <TabsTrigger value="reponse">Réponse client</TabsTrigger>
          <TabsTrigger value="mail">Mail original</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>
        <TabsContent value="devis" className="mt-0">
          <QuoteTab
            request={request}
            onModifyDevis={onModifyDevis}
            isModifyingDevis={isModifyingDevis}
          />
        </TabsContent>
        <TabsContent value="reponse" className="mt-0">
          <ClientResponseTab
            request={request}
            draft={draft}
            setDraft={onDraftChange}
            original={request.reponse_commercial ?? ""}
          />
        </TabsContent>

        <TabsContent value="mail" className="mt-0">
          <OriginalMailTab request={request} />
        </TabsContent>
        <TabsContent value="historique" className="mt-0">
          <HistoryTab request={request} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

