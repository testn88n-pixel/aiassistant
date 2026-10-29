import { useEffect, useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import { Copy, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requestsRepository } from "@/data/requests-repository";
import { requestKeys } from "@/data/requests.queries";
import type { SalesRequest } from "@/data/types";
import { formatDate } from "@/lib/format";

function clean(value?: string | null): string {
  const text = value?.trim() ?? "";
  return /^(null|undefined|n\/a)$/i.test(text) ? "" : text;
}

function parisToday(): string {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function AdditionalInfoSection({ request: r }: { request: SalesRequest }) {
  const queryClient = useQueryClient();
  const textareaId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(r.autres_demandes ?? "");
  const [today, setToday] = useState<string>();

  useEffect(() => {
    const update = () => setToday(parisToday());
    update();
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setDraft(r.autres_demandes ?? "");
    setEditing(false);
  }, [r.id]);

  const savedText = clean(r.autres_demandes);
  const occasion = clean(r.occasion);
  const budget = clean(r.budget_client).replace(/\bEUR\b/gi, "€");
  const deadline = formatDate(clean(r.deadline_reponse));
  const missing = (r.informations_manquantes ?? [])
    .map((item) => clean(item))
    .filter(Boolean);
  const completeness = clean(r.statut_completude).toLowerCase();
  const isComplete = completeness === "complet" || completeness === "complète";
  const question = isComplete ? "" : clean(r.question_clarification);
  const otherItems = savedText
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•]\s*/, "").trim())
    .filter(Boolean);

  let deadlineClass = "text-foreground";
  if (deadline && today) {
    const [day, month, year] = deadline.split("/");
    const date = parseISO(`${year}-${month}-${day}`);
    const current = parseISO(today);
    if (isValid(date) && isValid(current)) {
      const days = differenceInCalendarDays(date, current);
      if (days < 0) deadlineClass = "text-danger";
      else if (days <= 2) deadlineClass = "text-warning";
    }
  }

  const hasContent = Boolean(
    r.urgent === true || deadline || occasion || budget ||
    otherItems.length || missing.length || question,
  );

  const save = useMutation({
    mutationFn: (text: string) => requestsRepository.updateOtherRequests({
      id: r.id,
      autres_demandes: text,
    }),
    onSuccess: (updated) => {
      // Ne pas remplacer les autres données ou les prix en cours d’édition.
      queryClient.setQueryData<SalesRequest | null>(
        requestKeys.detail(r.id),
        (current) => current ? {
          ...current,
          autres_demandes: updated.autres_demandes ?? "",
        } : current,
      );
      void queryClient.invalidateQueries({
        queryKey: requestKeys.all,
        exact: true,
      });
      setDraft(updated.autres_demandes ?? "");
      setEditing(false);
      toast.success("Autres demandes enregistrées.");
    },
    onError: () => toast.error("Enregistrement impossible. Votre texte est conservé."),
  });

  async function copyQuestion() {
    try {
      await navigator.clipboard.writeText(question);
      toast.success("Question copiée.");
    } catch {
      toast.error("Copie impossible. Vous pouvez sélectionner la question.");
    }
  }

  function startEditing() {
    setDraft(r.autres_demandes ?? "");
    setEditing(true);
  }

  return (
    <div className="min-w-0 space-y-4 text-sm">
      {r.urgent === true && <Badge variant="destructive">Urgent</Badge>}

      {deadline && (
        <p className={`font-medium ${deadlineClass}`}>
          Réponse attendue avant le {deadline}
        </p>
      )}

      {occasion && (
        <p className="whitespace-pre-wrap break-words">
          <span className="font-semibold">Occasion : </span>{occasion}
        </p>
      )}

      {budget && (
        <p className="whitespace-pre-wrap break-words">
          <span className="font-semibold">Budget client : </span>{budget}
        </p>
      )}

      {!hasContent && !editing && (
        <p className="text-muted-foreground">Aucune information complémentaire</p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          {(otherItems.length > 0 || editing) && (
            <h4 className="font-semibold">Autres demandes</h4>
          )}
          {!editing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={startEditing}
              aria-label="Modifier les autres demandes"
              title="Modifier les autres demandes"
              className="ml-auto"
            >
              <Pencil className="size-4" />
              {otherItems.length === 0 && "Autres demandes"}
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            <label htmlFor={textareaId} className="sr-only">Autres demandes</label>
            <Textarea
              id={textareaId}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={6}
              maxLength={20000}
              disabled={save.isPending}
              className="resize-y"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={save.isPending || draft === (r.autres_demandes ?? "")}
                onClick={() => save.mutate(draft)}
              >
                <Save className="size-4" />
                {save.isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={save.isPending}
                onClick={() => setEditing(false)}
              >
                <X className="size-4" />Annuler
              </Button>
            </div>
          </div>
        ) : otherItems.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {otherItems.map((item, index) => (
              <li key={index} className="whitespace-pre-wrap break-words">{item}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {(missing.length > 0 || question) && (
        <div className="space-y-3 border-t border-border pt-4">
          <h4 className="font-semibold">Infos manquantes</h4>
          {missing.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {missing.map((item, index) => (
                <Badge
                  key={index}
                  variant="warning"
                  className="max-w-full whitespace-normal break-words"
                >
                  {item}
                </Badge>
              ))}
            </div>
          )}
          {question && (
            <div className="space-y-2">
              <p className="whitespace-pre-wrap break-words">{question}</p>
              <Button type="button" variant="outline" size="sm" onClick={copyQuestion}>
                <Copy className="size-4" />Copier
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
