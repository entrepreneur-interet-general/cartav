# Cartographie des accidents et verbalisation

Ce projet permet d’explorer sur une carte les accidents et les verbalisations.

De nombreux filtres (date, type de véhicule, etc.) et représentations (par point, carte de chaleur,
agrégation par axe de voirie) permettent d’explorer plusieurs situations précises.

Il a pour vocation à être un outil opérationnel pour les forces de l’ordre pour les aider à
mieux comprendre l’accidentologie et faire des actions de prévention et répression en conséquence.

## Contexte de développement

Ce projet a initialement été développé par Francis Chabouis et Tristram Gräbener dans le cadre
du programme [Entrepreneurs d’Intérêt Général 2017](https://www.etalab.gouv.fr/entrepreneurs-dinteret-general).

Il est porté par le datalab de la MGMSIC du ministère de l’Intérieur.

## Source de données

Les données sont un ensemble de données ouvertes :

* Accidents de la route [fiches BAAC](http://www.data.gouv.fr/fr/datasets/base-de-donnees-accidents-corporels-de-la-circulation/),
* OpenStreetMap,
* Découpage territorial [Geofla IGN](http://www.data.gouv.fr/fr/datasets/geofla-r/),
* Historique des communes [Geohisto](http://www.data.gouv.fr/fr/reuses/geohisto-historique-des-niveaux-administratifs-francais/)
* Base adresse nationale [BAN](http://www.data.gouv.fr/fr/datasets/ban-base-adresse-nationale/)
* Base adresse nationale Ouverte [BANO](http://www.data.gouv.fr/fr/datasets/base-d-adresses-nationale-ouverte-bano/)

Ainsi que des données propriétaires :
* Position des radars fixes,
* Données de verbalisation annonymisées

## Traitement des données

Les données sont traités au travers de plusieurs projets Dataiku. Ces traitements consistent (entre autres) en :

* Nettoyer et interpréter les données
* Géolocaliser les adresses,
* Associer les coordonnées à un axe routier
* Injecter des données dans une base de production

Pour le traitement, des base de données _Vertica_ et _PostGis_ (pour le traitement spatial) sont utilisées.

Pour la production, les données sont injectées dans une base _ElasticSearch_ qui fait également office de
_backend_ à l’application.

## Développer

Il faut une installation de nodejs (versions 4 et 6 testées) avec npm.

``` bash
# installer les dépendances (au choix)
npm install
yarn

# Servir avec rechargement à chaud hot sur localhost:8080
npm run dev

# Construire pour la production avec minification
make prod

# Construire pour l’instance de pré-production avec minification
make pre-prod

## Déployer

Selon la cible, exécutez au choix :
```
make deploy-prod
make deploy-pre-prod
```

Il est nécessaire de configurer `~/.ssh/config` afin d’identifier le serveur et votre nom d’utilisateur.

Par exemple :

```
Host fa-gate-adm
    User grabenertr
    Hostname 10.237.7.16
```
