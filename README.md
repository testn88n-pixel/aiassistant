# Hotel Sales Companion

Je veux construire une véritable application web de Sales Assistant pour un service commercial hôtelier.

IMPORTANT :

- Pars de cette spécification comme base fonctionnelle et UX complète.

- Ne simplifie pas le périmètre fonctionnel.

- Ne réinvente pas une nouvelle interface.

- Conserve une interface professionnelle, claire, premium et sobre, adaptée à un environnement hôtelier B2B.

- L’application doit être pensée comme une véritable application web standalone, et non comme une interface Retool.

- Le design doit être cohérent sur toutes les pages.

- L'application doit être responsive desktop/tablette.

- Prépare une architecture propre permettant ensuite de connecter Supabase, Google Sheets, n8n et une authentification.

- Pour cette première étape, concentre-toi principalement sur le dashboard, les écrans, les composants, les interactions et la logique fonctionnelle.

- Ne crée pas de données ou fonctionnalités qui ne sont pas demandées ci-dessous.

==================================================

1. CONTEXTE MÉTIER

==================================================

L’application est un AI Sales Assistant destiné à aider deux commerciaux travaillant pour UN SEUL hôtel.

Les deux commerciaux travaillent sur le même hôtel.

IMPORTANT :

- Il n’existe PAS de notion d’attribution d’une demande à un commercial.

- Les deux commerciaux voient toutes les demandes.

- Les deux commerciaux peuvent traiter toutes les demandes.

- Ne crée aucun champ "commercial".

- Ne crée aucun champ "commercial_id".

- Ne crée aucune logique d’assignation.

- Ne crée aucune fonctionnalité de prise en charge d’une demande.

L’objectif est de centraliser les demandes groupes reçues par email, d’analyser automatiquement les informations, d’évaluer la faisabilité, de proposer un tarif, de préparer un devis et une réponse commerciale, puis de permettre au commercial de contrôler les informations et de valider ou refuser la demande.

IMPORTANT :

Ne pas afficher la phrase :

"L’IA prépare et crée. Le commercial contrôle et valide."

==================================================

2. STRUCTURE GÉNÉRALE DE L’APPLICATION

==================================================

L’application comporte une sidebar verticale à gauche.

Navigation principale :

- Dashboard

- Demandes

- Demandes répondues

Sous "Demandes répondues", afficher deux sous-sections :

- Demandes acceptées

- Demandes refusées

IMPORTANT :

Les demandes ne sont PAS physiquement déplacées d’une liste à une autre.

Elles restent dans la même source de données.

La navigation fonctionne avec des filtres sur le champ "statut".

Règles :

Demandes :

- afficher les demandes actives, c’est-à-dire les demandes qui n’ont pas encore été acceptées ou refusées.

Demandes acceptées :

- afficher les demandes dont statut = "Acceptée"

Demandes refusées :

- afficher les demandes dont statut = "Refusée"

Ne pas créer de système de priorité.

Ne pas créer :

- priorité

- niveau de priorité

- filtre priorité

- badge priorité

- champ priority

==================================================

3. DASHBOARD

==================================================

Créer un dashboard commercial moderne et clair.

Le dashboard doit donner immédiatement une vision de l’activité.

Afficher notamment :

- nombre de demandes en cours

- nombre de demandes acceptées

- nombre de demandes refusées

- demandes récemment reçues

- demandes nécessitant une action

- activité récente

Ne pas afficher de KPI liés à une attribution par commercial.

Ne pas afficher de KPI de priorité.

Le dashboard doit rester simple et orienté action.

Les données affichées doivent provenir de la même source de données que les demandes.

Prévoir une architecture permettant de remplacer facilement les données mockées par les données Supabase / Google Sheets.

==================================================

4. PAGE "DEMANDES"

==================================================

La page "Demandes" constitue la liste principale des demandes commerciales.

Chaque demande doit être affichée dynamiquement à partir des données.

IMPORTANT :

1 ligne de données = 1 demande.

Ne pas coder manuellement une liste de cartes.

Si une nouvelle ligne est ajoutée dans la source de données puis que les données sont rafraîchies, une nouvelle demande doit apparaître automatiquement.

Chaque demande doit permettre d’ouvrir une page ou un panneau de détail.

Afficher les informations principales :

- société

- nom du groupe

- contact

- email

- date de la demande

- hôtel

- date d’arrivée

- date de départ

- nombre de nuits

- nombre de participants

- nombre de chambres

- statut

- éventuellement les principaux éléments de séminaire / F&B lorsque disponibles

Ne pas afficher les champs vides.

Ne jamais afficher :

- null

- undefined

- chaînes vides

- lignes inutiles

==================================================

5. RAFRAÎCHISSEMENT DES DONNÉES

==================================================

Ajouter un bouton "Actualiser" / "Rafraîchir".

Lorsqu’il est utilisé :

- recharger les données

- mettre à jour la liste

- mettre à jour les compteurs

- mettre à jour les statuts

Prévoir une architecture permettant de connecter ultérieurement ce bouton à la source réelle.

Pendant la phase prototype, il est acceptable d’utiliser des données mockées.

Ne pas mettre en place de polling automatique obligatoire.

==================================================

6. PAGE DE DÉTAIL D’UNE DEMANDE

==================================================

Lorsqu’un utilisateur clique sur une demande, ouvrir une page de détail complète.

Conserver la logique et l’organisation du détail définies dans le prototype initial.

La page doit présenter les informations de manière structurée et professionnelle.

Structure :

1. En-tête de la demande

2. Informations client

3. Faisabilité

4. Informations comprises par l’IA

5. Pricing / Revenue Management

6. Devis

7. Onglets :

   - Devis

   - Réponse client

   - Mail original

   - Historique

8. Actions finales

==================================================

7. EN-TÊTE DE LA DEMANDE

==================================================

Afficher :

- société

- nom du groupe

- contact

- email

- date de réception

- objet de l’email

- statut

Afficher également les informations principales du séjour :

- date d’arrivée

- date de départ

- nombre de nuits

- nombre de participants

- nombre de chambres

- catégorie / type de chambre

Ne pas afficher de priorité.

Ne pas afficher de commercial assigné.

==================================================

8. FAISABILITÉ

==================================================

Créer une section "Faisabilité".

Elle doit conserver le principe des 3 cartes principales :

1. Hébergement

2. Séminaire

3. F&B

Chaque carte doit présenter clairement :

- statut

- disponibilité

- informations détectées

- détails utiles

- raison en cas de problème

Exemples de statuts :

- Disponible

- Non disponible

- Informations manquantes

- À confirmer

Les informations doivent provenir des données disponibles.

Ne jamais inventer une disponibilité.

Ne jamais inventer un tarif.

==================================================

9. CARTE HÉBERGEMENT

==================================================

Afficher notamment :

- date d’arrivée

- date de départ

- nombre de nuits

- nombre de personnes

- nombre de chambres

- catégorie

- type de chambre

- chambres disponibles

- statut hébergement

- raison éventuelle

Si une donnée n’existe pas, ne pas afficher une ligne vide.

==================================================

10. CARTE SÉMINAIRE

==================================================

Toutes les informations liées au séminaire doivent rester dans cette carte.

Ne pas créer une nouvelle carte pour les pauses ou le café.

Afficher lorsque disponibles :

- séminaire demandé

- date

- heure de début

- heure de fin

- nombre de participants

- salle demandée

- salle proposée

- capacité

- disponibilité

- statut

- raison éventuelle

- prix de la salle

- unité du prix

- disposition de salle

Afficher également les pauses :

- pause matin

- disponibilité pause matin

- prix pause matin

- unité pause matin

- pause après-midi

- disponibilité pause après-midi

- prix pause après-midi

- unité pause après-midi

Afficher également le café d’accueil dans cette même section :

- café d’accueil demandé / détecté

- disponibilité

- prix

- unité

IMPORTANT :

Le café d’accueil fait partie du bloc "Séminaire".

Ne pas créer de bloc "Café d’accueil" séparé.

==================================================

11. CARTE F&B

==================================================

Toutes les informations restauration doivent rester dans cette carte.

Ne pas créer de nouveau bloc pour les informations restaurant.

Afficher lorsque disponibles :

- F&B demandé

- nombre de participants

- localisation

- restaurant

- cocktail

- déjeuner

- dîner

- déjeuner assis

- dîner assis

- pauses si elles sont liées au F&B

Pour chaque prestation tarifée, afficher :

- prix

- unité

- devise

Informations possibles :

- cocktail

- prix cocktail

- unité cocktail

- déjeuner

- prix déjeuner

- unité déjeuner

- dîner

- prix dîner

- unité dîner

- déjeuner assis

- prix déjeuner assis

- unité déjeuner assis

- dîner assis

- prix dîner assis

- unité dîner assis

Ne jamais inventer un prix.

Toujours utiliser la devise fournie par la donnée "devise".

==================================================

12. INFORMATIONS COMPRISES PAR L’IA

==================================================

Créer une section permettant de voir ce que l’IA a détecté dans la demande.

Afficher notamment :

- dates détectées

- nuits détectées

- chambres détectées

- nombre de participants détecté

- type de chambre détecté

- séminaire détecté

- horaires détectés

- déjeuner détecté

- pauses détectées

- informations manquantes

Cette section doit permettre au commercial de comprendre rapidement comment l’IA a interprété l’email.

==================================================

13. INFORMATIONS MANQUANTES

==================================================

Lorsqu’une demande est incomplète, afficher clairement :

- les informations manquantes

- les éléments à clarifier

- la question de clarification proposée

Exemples :

"Nombre exact de chambres manquant"

"Type de chambre à confirmer"

"Horaire du séminaire manquant"

"Déjeuner ou dîner à confirmer"

Ne pas inventer les informations manquantes.

==================================================

14. PRICING / REVENUE MANAGEMENT

==================================================

Créer une section dédiée au pricing.

Afficher :

- tarif recommandé

- devise

- unité tarifaire

- origine du tarif

- méthode tarifaire

- raison du tarif

Exemples d’origine :

- Tarif contractuel

- Tarif public

- Yield / RM

- Tarif recommandé par IA

Afficher également :

- RM requis

- demande envoyée au RM

- réponse du RM

Si RM est requis mais qu’aucune réponse n’est encore disponible, afficher clairement cet état.

==================================================

15. DEVIS

==================================================

Le devis est considéré comme automatiquement créé par le système.

Ne pas créer un bouton :

"Créer le devis"

Ne pas créer :

"Préparer dans Backyou"

Ne pas créer :

"À intégrer dans Backyou"

Le devis doit être présenté comme déjà généré.

Afficher :

- numéro de devis

- date de création

- statut

- lignes du devis

- total

- devise

Prévoir les actions :

- "Télécharger le devis"

- "Voir dans Backyou"

Si l’intégration Backyou n’est pas encore connectée, les boutons peuvent être simulés dans le prototype, mais l’interface doit être conçue comme si l’intégration existait.

==================================================

16. ONGLETS DU DÉTAIL

==================================================

Créer les quatre onglets :

1. Devis

2. Réponse client

3. Mail original

4. Historique

--------------------------------------------------

ONGLET DEVIS

--------------------------------------------------

Afficher le devis détaillé.

Afficher les lignes :

- hébergement

- séminaire

- pauses

- F&B

- autres prestations si présentes dans les données

Afficher :

- quantité

- unité

- prix unitaire

- total

- devise

Afficher le total général.

--------------------------------------------------

ONGLET RÉPONSE CLIENT

--------------------------------------------------

Afficher le brouillon de réponse email.

Le brouillon doit être présenté de façon professionnelle.

Prévoir une zone de texte permettant au commercial de relire / modifier la réponse.

Ne pas envoyer automatiquement l’email dans cette première version.

--------------------------------------------------

ONGLET MAIL ORIGINAL

--------------------------------------------------

Afficher l’email original reçu.

Conserver sa mise en forme autant que possible.

Afficher notamment :

- expéditeur

- destinataire

- date

- objet

- contenu

--------------------------------------------------

ONGLET HISTORIQUE

--------------------------------------------------

Afficher la chronologie des actions.

Exemples :

- demande reçue

- analyse IA

- informations détectées

- pricing calculé

- demande RM envoyée

- réponse RM reçue

- devis généré

- réponse préparée

- demande acceptée

- demande refusée

Chaque événement doit afficher :

- date

- heure si disponible

- action

- détail

==================================================

17. ACTIONS FINALES

==================================================

En bas du détail, afficher les actions principales.

Deux actions principales :

- "Valider la demande"

- "Bloquer"

--------------------------------------------------

VALIDER LA DEMANDE

--------------------------------------------------

Lorsque le commercial clique sur "Valider la demande" :

1. Mettre à jour le statut de la demande :

   statut = "Acceptée"

2. Mettre à jour :

   date_action = date/heure actuelle

3. Enregistrer l’action dans l’historique.

4. Rafraîchir les données.

5. La demande ne doit plus apparaître dans la liste des demandes actives.

6. Elle doit apparaître automatiquement dans :

   Demandes répondues > Demandes acceptées

IMPORTANT :

La demande n’est pas supprimée.

Elle reste dans la base / source de données.

--------------------------------------------------

BLOQUER

--------------------------------------------------

Lorsque le commercial clique sur "Bloquer" :

1. Mettre à jour :

   statut = "Refusée"

2. Mettre à jour :

   date_action = date/heure actuelle

3. Enregistrer l’action dans l’historique.

4. Rafraîchir les données.

5. La demande ne doit plus apparaître dans la liste des demandes actives.

6. Elle doit apparaître automatiquement dans :

   Demandes répondues > Demandes refusées

IMPORTANT :

La demande n’est pas supprimée.

Elle reste dans la base / source de données.

==================================================

18. STATUTS

==================================================

Utiliser les statuts nécessaires au workflow.

Au minimum :

- Nouvelle

- En analyse

- Informations manquantes

- À confirmer

- RM en attente

- Prête à valider

- Acceptée

- Refusée

Les statuts "Acceptée" et "Refusée" sont les statuts utilisés pour alimenter les deux sous-sections de "Demandes répondues".

Ne pas créer de logique de priorité.

==================================================

19. STRUCTURE DES DONNÉES

==================================================

Prévoir une structure compatible avec les colonnes suivantes.

IDENTIFICATION :

id

date_traitement

societe

nom_groupe

contact

email

date_email

subject

statut

date_action

HÔTEL / HÉBERGEMENT :

hotel

date_debut

date_fin

nombre_nuits

pax

chambres

categorie

type_chambre

chambres_disponibles

statut_hebergement

raison_hebergement

SÉMINAIRE :

seminaire_demande

seminaire_date

seminaire_heure_debut

seminaire_heure_fin

seminaire_pax

seminaire_salle_demandee

seminaire_salle_proposee

seminaire_capacite

seminaire_disponible

seminaire_statut

seminaire_raison

seminaire_salle_prix

seminaire_salle_unite

seminaire_disposition

PAUSES :

pause_matin_prix

pause_matin_unite

pause_apres_midi_prix

pause_apres_midi_unite

CAFÉ D’ACCUEIL :

cafe_d_accueil_disponible

cafe_d_accueil_detecte

cafe_d_accueil_prix

cafe_d_accueil_unite

F&B :

fb_demande

fb_pax

fb_localisation

dejeuner_demande

dejeuner_disponible

diner_demande

diner_disponible

pause_matin_demande

pause_matin_disponible

pause_apres_midi_demande

pause_apres_midi_disponible

fb_statut

fb_raison

PRIX F&B :

fb_cocktail_prix

fb_cocktail_unite

fb_dejeuner_prix

fb_dejeuner_unite

fb_diner_prix

fb_diner_unite

fb_dejeuner_assis_prix

fb_dejeuner_assis_unite

fb_diner_assis_prix

fb_diner_assis_unite

COMPLÉTUDE :

statut_completude

champs_manquants

question_clarification

PRICING / RM :

tarif_recommande

devise

unite_tarif

origine_tarif

methode_tarif

raison_tarif

rm_requis

demande_rm

reponse_rm

DEVIS :

numero_devis

date_creation_devis

statut_devis

total_devis

recap_devis

EMAIL :

email_original

DÉTECTION IA :

dates_detectees

nuits_detectees

chambres_detectees

pax_detectes

type_chambre_detecte

seminaire_detecte

horaires_detectes

dejeuner_detecte

pauses_detectees

informations_manquantes

RÉPONSE :

email_reponse

IMPORTANT :

Ne pas ajouter "commercial" ou "commercial_id".

Ne pas ajouter "priority".

Ne pas ajouter de champ lié à l’attribution d’une demande.

==================================================

20. RÈGLES D’AFFICHAGE DES DONNÉES

==================================================

Le frontend doit être robuste face aux données incomplètes.

Pour chaque champ :

- si valeur présente → afficher

- si valeur absente → ne pas afficher la ligne

- si null → ne pas afficher

- si undefined → ne pas afficher

- si chaîne vide → ne pas afficher

Ne jamais afficher "undefined", "null" ou "N/A" par défaut.

Ne jamais inventer de données pour compléter une fiche.

==================================================

21. DONNÉES DE TEST

==================================================

Utiliser les demandes de test suivantes pour construire le prototype.

REQ-001 :

L’Oréal France

Demande complète

12–14 novembre 2026

80 pax

40 chambres doubles

Séminaire

F&B

Tarif recommandé : 185 EUR

RM en attente

Devis : 22 450 EUR

REQ-002 :

Deloitte France

Demande complète

3–5 décembre 2026

50 pax

25 chambres doubles

Séminaire

F&B

Tarif recommandé : 210 EUR

RM en attente

Devis : 16 850 EUR

REQ-003 :

Airbus France

Demande incomplète

21 janvier 2027

35 pax

18 chambres doubles à confirmer

Séminaire

Certaines informations F&B et chambres manquantes

Statut : Informations manquantes

Devis : 0 EUR

REQ-004 :

Orange Business

Demande incomplète

15–17 février 2027

60 pax

30 chambres doubles, nombre exact à confirmer

Séminaire

Certaines informations F&B manquantes

Statut : Informations manquantes

REQ-005 :

Microsoft France

Demande complète

18–20 mars 2027

80 pax

40 chambres doubles

Séminaire le 19 mars

09:00–18:00

Salle

Disposition théâtre

Salle : 900 EUR / jour

Pauses : 12 EUR / personne

Restaurant principal

Cocktail : 25 EUR

Déjeuner : 45 EUR

Dîner : 55 EUR

Déjeuner assis : 65 EUR

Dîner assis : 75 EUR

Tarif chambre : 185 EUR

RM en attente

Devis : 28 420 EUR

REQ-006 :

Airbus France

Demande complète

7–10 avril 2027

60 pax

30 chambres doubles

Séminaire le 8 avril

08:30–18:30

Salle Concorde

1 200 EUR / jour

Disposition classe

Pause matin : 15 EUR / personne

Pause après-midi : 15 EUR / personne

Restaurant panoramique

Cocktail : 30 EUR

Déjeuner : 50 EUR

Dîner : 65 EUR

Déjeuner assis : 75 EUR

Dîner assis : 85 EUR

Tarif chambre : 210 EUR

Devis : 35 640 EUR

==================================================

22. ARCHITECTURE UI

==================================================

Le design doit être :

- premium

- professionnel

- hôtelier

- sobre

- lisible

- moderne

- orienté productivité

Utiliser :

- sidebar fixe

- header clair

- cartes propres

- badges de statut

- tableaux/listes lisibles

- sections bien séparées

- espaces blancs suffisants

- typographie moderne

- hiérarchie visuelle claire

Éviter :

- interface trop colorée

- effets inutiles

- animations excessives

- dashboards surchargés

- informations répétées

==================================================

23. IMPORTANT : NE PAS AJOUTER

==================================================

Ne pas ajouter :

- attribution à un commercial

- commercial_id

- priorité

- système de priorité

- section alternative hotel

- hôtel alternatif

- filtre par commercial

- prise en charge d’une demande

- suppression physique d’une demande après validation

- création manuelle du devis

- "Préparer dans Backyou"

- "À intégrer dans Backyou"

- nouvelle section pour le café d’accueil

- nouvelle section pour les pauses

- nouvelle section pour le restaurant

Le café d’accueil reste dans Séminaire.

Les pauses restent dans Séminaire.

Toutes les prestations restaurant restent dans F&B.

==================================================

24. PRÉPARATION POUR LA VRAIE APPLICATION WEB

==================================================

Cette application doit être conçue comme une vraie application web standalone.

Prévoir une architecture permettant ensuite :

- authentification utilisateur

- Supabase

- base de données

- GitHub

- n8n

- Google Sheets pendant la phase de transition

- intégration email

- intégration IA

- intégration Backyou

- domaine personnalisé

Le domaine cible sera :

sales-assistant.tonentreprise.com

Après connexion, l’utilisateur doit arriver directement sur le Dashboard.

Un utilisateur non authentifié ne doit pas pouvoir accéder aux pages internes de l’application.

Les deux commerciaux disposent des mêmes droits.

==================================================

25. RÈGLE IMPORTANTE POUR LOVABLE

==================================================

Construis l’application de manière modulaire.

Les données doivent être séparées de l’interface.

Les composants doivent être réutilisables.

Préparer les fonctions d’accès aux données de façon à pouvoir remplacer facilement les données mockées par Supabase ou une API.

Ne mets pas de credentials ou de clés API directement dans le frontend.

Ne construis pas une simple maquette statique.

Je veux une application fonctionnelle avec :

- navigation

- filtres

- détails

- changements de statut

- rafraîchissement

- listes dynamiques

- historique

- onglets

- validation

- refus

- gestion des demandes acceptées/refusées.

Commence par construire cette version complète de l’interface et du workflow avec les données de test fournies ci-dessus.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/501ed60f-6e8a-5722-90e3-2a1ca71194eb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
