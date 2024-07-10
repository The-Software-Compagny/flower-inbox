<p align="center">
  <a href="http://the-software-compagny.github.io/flower-inbox" target="blank"><img src="./public/logo.png" width="200" alt="FlowerInboxLogo" /></a>
</p>
<p align="center">An email retrieval system with a REST API built with NestJS in NodeJS</p>
<p align="center">
  <img alt="GitHub all releases" src="https://img.shields.io/github/downloads/the-software-compagny/flower-inbox/total">
  <img alt="GitHub" src="https://img.shields.io/github/license/the-software-compagny/flower-inbox">
  <img alt="GitHub contributors" src="https://img.shields.io/github/contributors/the-software-compagny/flower-inbox">
  <a href="https://github.com/the-software-compagny/flower-inbox/actions/workflows/release.yml?event=workflow_dispatch"><img alt="GitHub contributors" src="https://github.com/the-software-compagny/flower-inbox/actions/workflows/release.yml/badge.svg"></a>
</p>
<br>

# FlowerInbox - Rest API for email retrieval

Flower Inbox est un projet open source polyvalent conçu pour simplifier les processus d'envoi et de réception de courriels. Il offre une API rest conviviale, permettant aux développeurs d'intégrer facilement des fonctionnalités de messagerie dans leurs applications. Flower Inbox vise à fournir une solution complète pour la gestion des courriels.

## Getting started

```bash
docker pull thesoftwarecompagny/flower-inbox
```

```env
# .env

#FLOWERINBOX_LOGGER=debug
FLOWERINBOX_JWT_SECRET=1212974
FLOWERINBOX_CRYPT_SECURITYKEY=78987946
```

```yml
# accounts.yml
version: "1"
accounts:
  - id: my-account-the-software-compagny
    name: my-account-the-software-compagny
    imap:
      maxIdleTime: 60000
      host: mail.the-software-compagny.fr
      port: 993
      auth:
        user: my-account@the-software-compagny.fr
        pass: ******
    smtp:
      host: mail.the-software-compagny.fr
      port: 465
      auth:
        user: my-account@the-software-compagny.fr
        pass: ******

```

```yml
# tokens.yml
version: "1"
tokens:
  - client_id: test
    key: '12212546ezaeaze5a4r65azer4ar56sq4'
    ip:
      - 127.0.0.1
    acls:
      - resource: tokens
        actions: ['create:any', 'read:any', 'update:any', 'delete:any']
        attributes: ['*']
      - resource: accounts
        actions: ['create:any', 'read:any', 'update:any', 'delete:any']
        attributes: ['*']
```

## Points d'accès API
- Défaut
  - GET / - Récupérer des informations de base sur le service Flower Inbox.
  - GET /cron/run - Déclencher un travail cron manuellement.
  - GET /cron/run/{account} - Déclencher un travail cron pour un compte spécifique.
- Comptes
  - GET /accounts - Récupérer une liste de tous les comptes.
  - POST /accounts - Créer un nouveau compte.
  - GET /accounts/{account} - Récupérer des informations sur un compte spécifique.
  - PATCH /accounts/{account} - Mettre à jour les informations d'un compte spécifique.
  - DELETE /accounts/{account} - Supprimer un compte spécifique.
  - POST /accounts/{account}/submit - Soumettre des données pour un compte spécifique.
  - GET /accounts/changes - Récupérer les changements liés aux comptes.
- Boîtes aux lettres
  - GET /accounts/{account}/mailboxes - Récupérer une liste des boîtes aux lettres pour un compte spécifique.
- Messages
  - GET /accounts/{account}/messages - Récupérer une liste de messages pour un compte spécifique.
  - GET /accounts/{account}/messages/{seq} - Récupérer un message spécifique par numéro de séquence.
  - DELETE /accounts/{account}/messages/{seq} - Supprimer un message spécifique par numéro de séquence.
  - GET /accounts/{account}/messages/{seq}/source - Récupérer la source d'un message spécifique par numéro de séquence.

## Support
FlowerInbox is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please read more here. For personalized support, please contact **The Software Compagny**.
## License
FlowerInbox is [MIT licensed](LICENSE).
If you require a license specific to your needs, please contact **The Software Compagny**.
