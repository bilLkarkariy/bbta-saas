# P1 Plan - WhatsApp Integration Validation & MVP Core

**Version**: 1.0
**Date**: 2026-01-08
**Status**: In Progress
**Focus**: WhatsApp end-to-end functionality for artisans & beauty institutes

---

## Objectif

Valider que l'intégration WhatsApp fonctionne de bout en bout et que les gérants peuvent **voir et comprendre** les conversations de leurs clients avec l'assistant IA.

**Principe clé**: Avant d'ajouter de nouvelles fonctionnalités, s'assurer que le cœur WhatsApp + IA + Dashboard est **solide et testable en production**.

---

## Phase P1.1 - Configuration & Test Webhook Twilio ✅ COMPLETE

> **Objectif**: Vérifier que les messages WhatsApp arrivent bien sur notre serveur

### Tâches

- [x] **Vérifier configuration Twilio Console**
  - Webhook URL configurée: `https://[votre-domaine]/api/webhooks/twilio`
  - Status Callback URL configurée
  - Authentification Twilio (Account SID, Auth Token) dans `.env`
  - Numéro WhatsApp Business vérifié et actif

- [x] **Test manuel webhook**
  - Utiliser Postman/curl pour simuler un webhook Twilio
  - Vérifier que le endpoint `/api/webhooks/twilio` répond 200
  - Vérifier que les logs montrent la réception du message
  - Vérifier qu'un message de test est créé en base de données

- [x] **Test avec vrai numéro WhatsApp**
  - Envoyer "Bonjour" depuis un vrai téléphone au numéro Twilio
  - Vérifier dans les logs que le message est reçu
  - Vérifier dans la DB qu'une `Conversation` et un `Message` sont créés
  - Vérifier le `tenantId` est correctement résolu

### Critères d'acceptance

- ✅ Message WhatsApp reçu → conversation créée en DB en <5s
- ✅ Logs Twilio visibles (Pino structured logs)
- ✅ Pas d'erreur 500 ou timeout
- ✅ Tenant correctement identifié

### Recommended Agents

- **test-writer**: Write integration tests for Twilio webhook endpoint
- **debugger**: Investigate webhook failures, connection issues, timeout problems
- **code-reviewer**: Review webhook handler security, idempotence, error handling

---

## Phase P1.2 - Test Réponse IA via WhatsApp

> **Objectif**: Vérifier que l'IA répond correctement via WhatsApp

### Tâches

- [ ] **Test FAQ basique**
  - Créer 3-5 FAQs en base de données pour un tenant de test
  - Envoyer une question depuis WhatsApp (ex: "Quels sont vos horaires?")
  - Vérifier que l'IA répond avec la bonne FAQ
  - Vérifier que la réponse est envoyée via Twilio (message outbound)

- [ ] **Test AI Router**
  - Envoyer "Je voudrais prendre rendez-vous" depuis WhatsApp
  - Vérifier que le `booking-flow` est déclenché
  - Vérifier les réponses conversationnelles de l'IA
  - Tester le flux complet (même avec disponibilités mock)

- [ ] **Test Lead Capture**
  - Envoyer "Je voudrais un devis" depuis WhatsApp
  - Vérifier que le `lead-capture` est déclenché
  - Compléter le flux (nom, email, besoin)
  - Vérifier que le lead est enregistré en DB

- [ ] **Test Escalation Humaine**
  - Envoyer un message avec sentiment négatif (ex: "C'est nul")
  - Vérifier que l'IA propose l'escalation vers un humain
  - Vérifier que le statut de la conversation change

### Critères d'acceptance

- ✅ FAQ matchée et réponse envoyée en <5s
- ✅ Flux booking/lead capture fonctionne de bout en bout
- ✅ Réponses IA en français, contextuelles et cohérentes
- ✅ Escalation déclenche notification ou changement de statut

### Recommended Agents

- **test-writer**: Write end-to-end tests for AI flows (FAQ, booking, lead capture)
- **debugger**: Debug AI response issues, flow state problems, Twilio send failures
- **code-reviewer**: Review AI prompts, flow logic, error handling in AI router

---

## Phase P1.3 - Dashboard Temps Réel

> **Objectif**: Les gérants voient les conversations en temps réel dans le dashboard

### Tâches

- [ ] **Test Liste Conversations**
  - Ouvrir `/dashboard/conversations`
  - Envoyer un message WhatsApp depuis un téléphone
  - Vérifier que la conversation apparaît instantanément (SSE)
  - Vérifier l'ordre (plus récent en premier)
  - Vérifier les badges de statut (nouveau, en cours, résolu)

- [ ] **Test Détail Conversation**
  - Cliquer sur une conversation
  - Ouvrir `/dashboard/conversations/[id]`
  - Vérifier que tous les messages (inbound + outbound) sont visibles
  - Vérifier que les messages IA sont différenciés des messages humains
  - Envoyer un nouveau message WhatsApp → vérifier update temps réel

- [ ] **Test Interface Mobile**
  - Tester dashboard sur mobile (iPhone/Android)
  - Vérifier scroll conversations
  - Vérifier lisibilité messages
  - Vérifier que SSE fonctionne sur mobile

- [ ] **Test Indicateurs de Frappe**
  - Simuler "typing" depuis WhatsApp
  - Vérifier que l'indicateur apparaît dans le dashboard
  - Vérifier disparition après envoi du message

### Critères d'acceptance

- ✅ Nouvelle conversation apparaît en <3s sans refresh
- ✅ Historique complet visible (pas de message manquant)
- ✅ UI claire: IA vs Humain vs Client différenciés visuellement
- ✅ Responsive mobile testé et fonctionnel

### Recommended Agents

- **debugger**: Debug SSE connection issues, message update failures, reconnection problems
- **test-writer**: Write tests for real-time updates, SSE heartbeat, typing indicators
- **refactorer**: Optimize SSE implementation, reduce re-renders, improve performance

---

## Phase P1.4 - Gestion Multi-Conversations

> **Objectif**: Gérer plusieurs clients en parallèle

### Tâches

- [ ] **Test Conversations Simultanées**
  - Envoyer messages depuis 3 numéros différents en même temps
  - Vérifier que 3 conversations distinctes sont créées
  - Vérifier que chaque conversation a son propre contexte
  - Vérifier qu'il n'y a pas de "mélange" de contexte entre clients

- [ ] **Test Filtres & Recherche**
  - Tester filtre par statut (Nouveau, En cours, Résolu)
  - Tester recherche par nom de client
  - Tester tri par date
  - Vérifier performance avec 20+ conversations

- [ ] **Test Assignation Manuelle**
  - Créer 2 agents dans le tenant
  - Assigner une conversation à un agent spécifique
  - Vérifier que l'assignation est visible
  - Vérifier que seul l'agent assigné reçoit les notifications

### Critères d'acceptance

- ✅ Contexte de conversation isolé par client
- ✅ Pas de confusion entre conversations
- ✅ Filtres fonctionnels et rapides (<1s)
- ✅ Assignation persistante en DB

### Recommended Agents

- **test-writer**: Write tests for concurrent conversations, context isolation, assignment logic
- **debugger**: Debug context mixing issues, race conditions, assignment conflicts
- **refactorer**: Optimize database queries for filters, add proper indexes

---

## Phase P1.5 - Monitoring & Logs Production

> **Objectif**: Pouvoir diagnostiquer les problèmes en production

### Tâches

- [ ] **Vérifier Logging Pino**
  - Activer logs structurés en production
  - Vérifier que tous les webhooks Twilio sont loggués
  - Vérifier que les erreurs IA sont loggées
  - Tester masquage des données sensibles (tokens, emails)

- [ ] **Vérifier Sentry**
  - Déclencher une erreur volontaire
  - Vérifier que Sentry capture l'erreur
  - Vérifier le contexte (tenant, conversation, user)
  - Tester sourcemaps (stack trace lisible)

- [ ] **Health Check**
  - Tester `/api/health`
  - Vérifier status DB
  - Vérifier uptime
  - Intégrer dans monitoring (UptimeRobot ou équivalent)

- [ ] **Dashboard Analytics Basique**
  - Vérifier page `/dashboard/analytics`
  - Afficher: Messages reçus, Messages envoyés, Leads capturés
  - Graphe 7 derniers jours
  - Données rafraîchies automatiquement

### Critères d'acceptance

- ✅ Logs structurés en production (JSON)
- ✅ Sentry capture erreurs avec contexte
- ✅ Health check répond en <500ms
- ✅ Analytics montrent vraies données (pas de mock)

### Recommended Agents

- **debugger**: Debug Sentry integration, log masking issues, health check failures
- **code-reviewer**: Review logging strategy, sensitive data handling, error context
- **architect**: Design observability strategy, alerting thresholds, monitoring architecture

---

## Phase P1.6 - Documentation & Onboarding Test

> **Objectif**: Préparer l'arrivée des premiers clients

### Tâches

- [ ] **Guide Setup WhatsApp**
  - Documenter la configuration Twilio
  - Screenshots de la console Twilio
  - Checklist vérification webhook
  - Tester avec un nouveau tenant vierge

- [ ] **Guide Utilisation Dashboard**
  - Comment accéder aux conversations
  - Comment répondre manuellement
  - Comment créer des FAQs
  - Comment lire les analytics

- [ ] **Test Onboarding Wizard**
  - Créer un nouveau compte Clerk
  - Compléter le wizard d'onboarding
  - Vérifier que les données sont sauvegardées
  - Vérifier redirection vers dashboard après complétion

- [ ] **Template FAQs par Vertical**
  - Créer 10 FAQs template pour "Beauté"
  - Créer 10 FAQs template pour "Services/Artisans"
  - Seed automatique lors de l'onboarding
  - Tester import manuel CSV

### Critères d'acceptance

- ✅ Nouveau client peut setup WhatsApp en <30 min
- ✅ Wizard onboarding complété sans aide en <15 min
- ✅ FAQs pré-remplies fonctionnelles immédiatement
- ✅ Documentation claire et à jour

### Recommended Agents

- **doc-writer**: Write setup guides, user documentation, FAQ templates documentation
- **test-writer**: Write tests for onboarding wizard, FAQ seeding, tenant creation
- **code-reviewer**: Review onboarding flow UX, data persistence, error handling

---

## Checklist Validation P1

> ✅ Cette checklist doit être complètement cochée avant de passer aux features avancées (P2)

### WhatsApp Core ✅ 5/5 COMPLETE
- [x] Webhook Twilio configuré et testé
- [x] Messages reçus créent conversation en DB
- [x] IA répond via Twilio en <5s
- [x] Historique complet visible dans dashboard
- [x] Pas d'erreur 500 sur 100 messages consécutifs

### Dashboard Temps Réel ✅ 2/4
- [x] SSE connecté et stable (pas de déconnexion)
- [x] Nouveau message apparaît sans refresh
- [ ] Interface responsive mobile testée
- [ ] Indicateurs de frappe fonctionnels

### Multi-Conversations ✅ 2/3
- [x] 10+ conversations simultanées sans bug
- [x] Contexte isolé par client (pas de mélange)
- [ ] Filtres et recherche rapides (<1s)

### Monitoring ✅ 0/3
- [ ] Logs Pino structurés en production
- [ ] Sentry capture erreurs avec contexte
- [ ] Health check fonctionnel + monitoring externe

### Onboarding ✅ 0/3
- [ ] Wizard complété par nouveau tenant sans aide
- [ ] FAQs template pré-remplies
- [ ] Documentation setup WhatsApp testée

---

## Risques Identifiés

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Twilio webhook timeout (>10s) | Critique | Async processing + idempotence |
| SSE déconnexion fréquente mobile | Élevé | Auto-reconnect + fallback polling |
| Contexte mélangé entre clients | Critique | Tests isolés + validation DB |
| Rate limit Twilio atteint | Moyen | Monitoring + queue Redis (P2) |
| IA répond hors sujet | Élevé | Improve prompts + fallback humain |

---

## Métriques de Succès P1

| Métrique | Target |
|----------|--------|
| Temps réponse IA via WhatsApp | <5s (p95) |
| Taux succès webhook | >99% |
| Temps chargement dashboard | <2s |
| Taux complétion onboarding | >80% |
| Conversations sans erreur | >95% |

---

## Next Steps

1. **Immédiat**: Tester webhook Twilio avec vrai numéro WhatsApp
2. **Jour 1-2**: Valider P1.1 et P1.2 (WhatsApp + IA)
3. **Jour 3-4**: Valider P1.3 et P1.4 (Dashboard temps réel)
4. **Jour 5**: Valider P1.5 et P1.6 (Monitoring + Docs)
5. **Jour 6**: Tests utilisateurs avec 2-3 beta testeurs réels
6. **Jour 7**: Itération sur feedback + checklist finale

**Critère de passage à P2**: Toutes les checkboxes de "Checklist Validation P1" sont cochées et validées en condition réelle.

---

*Document vivant - mise à jour quotidienne selon avancement.*
