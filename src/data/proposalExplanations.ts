// Décodage en français courant de CHAQUE proposition. Aucune exception : les
// 311 mesures du catalogue ont leur ligne ici.
//
// La règle a changé, et l'histoire vaut d'être retenue. Une première version
// exigeait déjà une explication partout ; elle a produit des paraphrases —
// quarante explications sur cent soixante-cinq reprenaient plus de 60 % du
// vocabulaire de leur mesure — et l'obligation a été levée. Un cadre vide
// n'est pourtant pas mieux qu'une paraphrase : la carte annonce « EN CLAIR »,
// et le lecteur qui bute sur une mesure une fois sur deux cesse de chercher.
//
// L'obligation est donc revenue, mais avec le garde-fou qui manquait la
// première fois : `node scripts/check-data.js` REFUSE une explication qui
// reprend 60 % ou plus du vocabulaire de sa mesure. Autrement dit, il ne
// suffit plus de remplir la case ; il faut le faire avec d'autres mots. C'est
// précisément ce que veut dire « en clair », et c'est ce qui rend la
// contrainte tenable : sur une mesure déjà limpide, on la redit dans la
// langue de tous les jours, et l'écart de vocabulaire suit tout seul.
//
// LES SIGLES SONT UNE OBLIGATION, pas une option. Une mesure citée mot pour
// mot ne peut pas être corrigée : quand elle écrit « CJIP », « UMJ » ou
// « DPE » sans le développer, c'est ici et nulle part ailleurs que le lecteur
// peut l'apprendre. `check-data.js` échoue si un sigle n'est ni développé
// entre parenthèses dans la mesure, ni expliqué ici.
//
// Deux exceptions, tenues courtes : les sigles d'usage courant (ONU, UE, GPS,
// SMIC...), dont le développement n'apprendrait rien, et ceux que la mesure
// développe déjà elle-même. Dans le doute, on explique.
//
// ATTENTION — avec proposalArguments.ts, ce fichier est l'un des deux seuls
// où un texte est ÉCRIT PAR L'APP à propos du programme d'une personne
// réelle. Partout ailleurs les mesures sont citées mot pour mot et les
// notices viennent de Wikipédia. Deux règles bornent le risque :
//
//  1. ON NE DÉCODE QUE CE QUI EST ÉCRIT. Aucun chiffre, aucune date, aucune
//     conséquence absente de la mesure. Seule exception : expliquer un terme
//     technique qu'elle emploie (« impôts de production », « octroi de mer »,
//     « décote », « peine plancher ») — c'est précisément ce qui bloque.
//     Réécrire un pourcentage en toutes lettres (70 % → « sept dixièmes »)
//     reste permis : c'est le même nombre, pas un nombre de plus.
//  2. AUCUN JUGEMENT. Ce qui relève du pour et du contre a sa place à part,
//     dans proposalArguments.ts.
//
// Le texte d'origine reste affiché au-dessus, et l'écran présente ces phrases
// comme celles de l'app (« EN CLAIR »), pas comme celles du candidat. Une
// phrase, 160 caractères au maximum : la carte est une boîte de taille fixe
// (voir le budget de place dans components/SwipeCard.tsx).

export const PROPOSAL_EXPLANATIONS: Record<string, string> = {
  // --- Bernard Cazeneuve -------------------------------------------------------
  'cazeneuve-economie-instaurer-une-fiscalite-ciblant-':
    'Une rente financière est un revenu régulier tiré d’un capital placé. L’impôt viserait les patrimoines et les revenus de placement les plus élevés.',
  'cazeneuve-economie-mettre-en-place-un-plan-sur-dix-':
    'Un programme public de dix ans pour relancer l’industrie, avec des règles stables et des baisses d’impôt ciblées sur la recherche et les équipements.',
  'cazeneuve-economie-remplacer-l-exigence-d-equilibre':
    'La Sécurité sociale n’aurait plus à équilibrer ses comptes chaque année, mais sur cinq ans, avec des écarts permis en cas de crise.',
  'cazeneuve-emploi-generaliser-l-apprentissage-des-':
    'Apprentissage possible dès les premières années d’université, limites au recours aux stages, et retour du CDI comme contrat par défaut pour les jeunes.',
  'cazeneuve-retraites-retablir-le-droit-a-un-depart-an':
    'Rouvrir le droit de partir plus tôt aux salariés exposés aux postures difficiles, aux charges lourdes, aux vibrations ou aux produits chimiques.',
  'cazeneuve-solidarites-accorder-une-aide-supplementaire':
    'Un étudiant qui touche déjà une bourse recevrait un versement en plus, au début de son parcours dans le supérieur.',
  'cazeneuve-solidarites-creer-une-avance-jeunesse-de-tro':
    'Somme versée par anticipation aux jeunes adultes sans diplôme ni travail, attribuée selon leurs revenus ; régions et communes pourraient y ajouter.',
  'cazeneuve-sante-faire-de-la-prise-en-charge-des-':
    '« Grande cause nationale » est un label officiel qui donne à un sujet une priorité publique. Soignants et enseignants y seraient formés.',
  'cazeneuve-education-former-massivement-les-enseignan':
    'L’État créerait son propre service d’intelligence artificielle scolaire, formerait les professeurs aux outils informatiques et ouvrirait des labos mixtes.',
  'cazeneuve-education-lancer-un-plan-ecole-climat-soli':
    'Un plan de dix ans pour rénover les bâtiments scolaires et les rendre écologiques, en tenant compte des particularités de chaque territoire.',
  'cazeneuve-numerique-donner-force-de-loi-a-l-evaluati':
    'L’INESIA est l’institut public français chargé d’évaluer la sécurité des systèmes d’intelligence artificielle.',
  'cazeneuve-numerique-stocker-les-donnees-des-francais':
    'Les informations personnelles seraient conservées sur des ordinateurs installés en Europe, et relèveraient des lois de la France.',
  'cazeneuve-logement-lancer-un-grand-plan-de-construc':
    'Un grand plan de construction et de rénovation, à la fois social et écologique, avec de nouvelles façons de devenir propriétaire.',
  'cazeneuve-environnement-creer-une-datar-du-climat-rattac':
    'La DATAR était l’administration chargée de l’aménagement du territoire. Celle-ci recenserait les fragilités climatiques de chaque région.',
  'cazeneuve-securite-mettre-en-place-une-police-de-pr':
    'Des policiers affectés durablement à un quartier et formés pour y établir une relation de confiance.',
  'cazeneuve-defense-developper-une-reserve-citoyenne':
    'Ouvrir la réserve citoyenne à beaucoup plus de monde, pour rapprocher la société de son armée.',
  'cazeneuve-institutions-engager-une-revue-systematique-d':
    'Passer en revue toutes les règles existantes, et en supprimer deux chaque fois qu’on en crée une.',
  'cazeneuve-institutions-introduire-une-dose-de-proportio':
    'À la proportionnelle, les sièges se répartissent selon le nombre de voix. Une partie des députés serait élue ainsi, le reste comme aujourd’hui.',
  'cazeneuve-institutions-refonder-la-territorialite-de-la':
    'Répartir plus nettement les rôles entre communes, départements, régions et État, en confiant davantage de choix au niveau du terrain.',
  'cazeneuve-institutions-reformer-le-processus-decisionne':
    'Certaines décisions européennes requièrent aujourd’hui l’unanimité des États membres. Elles pourraient se prendre à la majorité.',

  // --- Bruno Retailleau --------------------------------------------------------
  'retailleau-economie-redonner-au-moins-30-milliards-d':
    'Le coût du travail est ce que l’employeur verse en plus du salaire net. La somme irait pour moitié aux revenus, pour moitié à cette charge.',
  'retailleau-economie-relever-tres-fortement-le-plafon':
    'Un parent ou un grand-parent pourrait transmettre beaucoup plus d’argent sans impôt, la limite variant avec l’âge de celui qui reçoit.',
  'retailleau-economie-supprimer-toutes-les-cotisations':
    'Au-delà de 1 623 heures travaillées dans l’année, plus aucune cotisation sociale ne serait prélevée, ni sur le salaire ni sur l’employeur.',
  'retailleau-emploi-encadrer-les-refus-d-offres-rais':
    'Un demandeur d’emploi qui décline trois propositions jugées acceptables cesserait de percevoir son allocation.',
  'retailleau-emploi-lever-les-obstacles-au-retour-a-':
    'Faciliter la reprise d’un poste pour qui n’en a pas, et lever ce qui dissuade une personne à la retraite de garder un métier.',
  'retailleau-emploi-limiter-la-duree-d-indemnisation':
    'Une rupture conventionnelle est un départ décidé d’un commun accord. L’allocation qui la suit serait versée moins longtemps et plafonnée.',
  'retailleau-emploi-mettre-en-place-une-annualisatio':
    'Annualiser, c’est compter les heures sur l’année entière plutôt que semaine par semaine : l’entreprise alterne périodes chargées et périodes creuses.',
  'retailleau-emploi-rapprocher-le-systeme-d-assuranc':
    'Aligner l’indemnisation des sans-emploi sur ce qui se pratique ailleurs en Europe, revoir les cas les plus onéreux et changer son pilotage.',
  'retailleau-solidarites-accompagner-les-six-premiers-moi':
    'Un suivi pendant le premier semestre du bébé, pour aider à créer l’attachement avec sa famille et organiser la reprise d’activité.',
  'retailleau-solidarites-creer-un-revenu-d-incitation-a-l':
    'Le RSA est le revenu des personnes sans ressources ; la prime d’activité complète les bas salaires ; l’allocation spécifique aide les chômeurs en fin de droits.',
  'retailleau-solidarites-exclure-de-l-apl-les-etudiants-i':
    'L’APL est l’aide personnalisée au logement. Les deux derniers déciles désignent les 20 % de familles aux revenus les plus élevés.',
  'retailleau-solidarites-fusionner-12-dispositifs-d-aide-':
    'Douze aides existantes seraient remplacées par 240 euros versés chaque mois et par enfant, de la naissance à 18 ans.',
  'retailleau-education-doubler-le-nombre-d-ingenieurs-s':
    'Deux fois plus de diplômés formés au calcul, aux machines qui apprennent, aux robots et aux réseaux qui font tourner l’informatique.',
  'retailleau-numerique-doubler-le-nombre-d-ingenieurs-s':
    'Former deux fois plus d’ingénieurs en intelligence artificielle, informatique, robotique et mathématiques.',
  'retailleau-logement-remettre-la-france-sur-une-traje':
    'Revenir à un rythme de 450 000 logements construits chaque année.',
  'retailleau-logement-rendre-aux-maires-la-liberte-de-':
    'La TVA est la taxe payée sur chaque achat. Une part de celle perçue sur les logements neufs irait à la commune qui les a autorisés.',
  'retailleau-logement-retablir-la-rotation-dans-le-par':
    'Le logement à loyer modéré ne serait plus occupé à vie : on y passerait un temps, avant de se loger ailleurs, pour libérer la place.',
  'retailleau-logement-supprimer-les-interdictions-de-l':
    'Le DPE est le diagnostic de performance énergétique, la note de A à G d’un logement. Un logement mal noté pourrait de nouveau être loué.',
  'retailleau-environnement-abroger-le-volet-electricite-de-':
    'La PPE, programmation pluriannuelle de l’énergie, est la feuille de route énergétique de la France. Sa partie électricité serait annulée.',
  'retailleau-environnement-consolider-le-parc-nucleaire-en-':
    'L’EPR2 est le modèle de réacteur que la France prévoit de construire. Il s’agit de suivre l’avancement des six chantiers annoncés.',
  'retailleau-environnement-inscrire-les-reacteurs-nucleaire':
    'Faire fonctionner les réacteurs nucléaires actuels jusqu’à 80 ans, avec un contrôle de leur état tous les dix ans.',
  'retailleau-environnement-proteger-le-parc-nucleaire-des-a':
    'Décarbonée veut dire produite sans rejeter de CO2. Éviter les coupures imprévues des centrales et ajuster leur production à la demande.',
  'retailleau-agriculture-autoriser-l-usage-de-neonicotino':
    'Les néonicotinoïdes sont une famille d’insecticides. Ils redeviendraient utilisables ici dès lors qu’un autre pays de l’Union les accepte.',
  'retailleau-agriculture-garantir-une-concurrence-effecti':
    'La chaîne de valeur va du champ à l’assiette : agriculteurs, industriels, magasins. Un examen plus poussé y surveillerait les règles du marché.',
  'retailleau-agriculture-generaliser-un-mecanisme-de-diss':
    'Le foncier, ce sont les terres. Un agriculteur qui débute pourrait cultiver sans les acheter, en n’acquérant que ce qui sert à travailler.',
  'retailleau-agriculture-reconnaitre-les-projets-de-stock':
    'Donner aux projets de retenue d’eau pour l’agriculture le statut juridique le plus protecteur, celui d’« intérêt général majeur ».',
  'retailleau-securite-autoriser-la-vision-par-ordinate':
    'Autoriser l’analyse automatique des images de vidéosurveillance contre la délinquance et le terrorisme, sans reconnaissance des visages en direct.',
  'retailleau-immigration-conditionner-le-benefice-plein-d':
    'Un étranger devrait résider et travailler cinq ans en France avant de toucher l’intégralité des aides aux familles.',
  'retailleau-defense-multiplier-par-cinq-les-moyens-c':
    'Cinq fois plus d’argent pour l’armée sur ces sujets : sécurité informatique, engins sans pilote à bord, machines et ordinateurs quantiques.',
  'retailleau-institutions-ne-pas-remplacer-125-000-departs':
    'Ne pas remplacer 125 000 fonctionnaires partant à la retraite, et déplacer autant d’agents des bureaux vers le terrain.',

  // --- Dominique de Villepin ---------------------------------------------------
  'villepin-economie-augmenter-les-impots-pour-que-le':
    'Faire payer davantage les plus fortunés, en fusionnant les impôts sur le patrimoine en un seul et en taxant ce qui pollue.',
  'villepin-economie-renforcer-la-souverainete-indust':
    'Aligner normes, certifications et procédures entre pays européens, pour que l’industrie du continent cesse d’accumuler du retard.',
  'villepin-economie-simplifier-radicalement-le-syste':
    'Les nombreux impôts et taxes existants seraient regroupés en neuf grandes catégories par une seule loi.',
  'villepin-emploi-conditionner-les-exonerations-de':
    'Les allégements de charges dont bénéficient les employeurs ne seraient maintenus qu’en échange de promesses sur l’embauche, l’apprentissage et les payes.',
  'villepin-emploi-faire-de-l-insertion-professionn':
    'L’alternance mêle cours et travail en entreprise. Aider les jeunes à entrer dans la vie active deviendrait la première mission du service de l’emploi.',
  'villepin-emploi-instaurer-un-28e-regime-fonde-su':
    'Créer un cadre européen optionnel, en plus des règles des vingt-sept pays, auquel on adhère volontairement et qui ne s’imposerait pas au droit français.',
  'villepin-retraites-lancer-une-reforme-des-retraites':
    'Refaire une réforme des retraites en dix-huit mois, en passant par les syndicats, un panel de citoyens tirés au sort, le Parlement, et un référendum si besoin.',
  'villepin-solidarites-creer-un-guichet-unique-numeriqu':
    'Un seul site web rassemblerait toutes les aides existantes, qu’elles viennent de l’État ou d’une collectivité, avec un espace propre à chacun.',
  'villepin-solidarites-garantir-un-revenu-mensuel-minim':
    'Garantir 1 000 euros par mois aux artistes qui débutent : l’État verserait la différence quand leurs autres revenus n’atteignent pas ce seuil.',
  'villepin-solidarites-instaurer-un-droit-au-repit-pour':
    'Un droit au répit est une pause garantie par la loi. Ici : pour les personnes fragiles, plusieurs heures par jour dans un lieu tenu au frais.',
  'villepin-sante-creer-un-conseil-scientifique-de':
    'Un groupe permanent de chercheurs, avec son propre budget, guetterait les prochaines épidémies et catastrophes naturelles pour y préparer le pays.',
  'villepin-sante-lancer-une-grande-campagne-d-inf':
    'Une campagne nationale d’information sur les dangers mortels que la canicule fait courir aux femmes.',
  'villepin-education-financer-la-politique-culturelle':
    'L’argent viendrait d’aides déjà versées ailleurs, et d’une taxe payée par les services de vidéo et de musique en ligne, élargie aux réseaux sociaux.',
  'villepin-education-garantir-l-acces-universel-a-la-':
    'Rendre la lecture, la musique et le théâtre accessibles à tous, sans condition.',
  'villepin-education-supprimer-l-utilisation-de-l-alg':
    'Parcoursup est la plateforme qui répartit les bacheliers dans les formations du supérieur. Ce n’est plus son calcul automatique qui déciderait.',
  'villepin-numerique-instaurer-une-regle-imperative-s':
    'Aucun déploiement d’intelligence artificielle sans qu’une personne en réponde et en garde le contrôle en permanence.',
  'villepin-numerique-mobiliser-des-centaines-de-milli':
    'Un consortium est un groupement d’acteurs. Plusieurs pays s’associeraient pour se réserver de la puissance de traitement, payée par dette et par épargne.',
  'villepin-logement-lancer-un-plan-historique-cible-':
    'Un grand plan de rénovation pour supprimer les logements les plus mal isolés, en commençant par ceux qu’occupent les ménages modestes.',
  'villepin-logement-soumettre-toute-decision-d-infra':
    'Avant de bâtir, il faudrait étudier les autres options : remettre en état, réemployer ou construire plus serré, au lieu de s’étaler sur des terres neuves.',
  'villepin-environnement-generaliser-l-ecoconception-logi':
    'Écoconcevoir un programme, c’est l’écrire pour qu’il consomme moins d’électricité. Sa dépense serait publiée dans un fichier ouvert à tous.',
  'villepin-environnement-mettre-en-place-un-plan-d-adapta':
    'Les territoires ultramarins sont les départements et collectivités d’outre-mer. Ils auraient leur propre programme face au climat et aux épidémies.',
  'villepin-environnement-prendre-des-mesures-de-coupes-pr':
    'Couper et débroussailler à l’avance la végétation des zones exposées, pour éviter les incendies hors de contrôle.',
  'villepin-agriculture-etablir-un-contrat-d-objectifs-p':
    'Un engagement de l’État sur plusieurs années, dont l’argent ne pourrait pas être réduit en cours de route, au profit de l’agriculture biologique.',
  'villepin-agriculture-instaurer-un-conseil-independant':
    'Un organisme indépendant conseillerait les agriculteurs, et chaque filière signerait un contrat pour organiser sa transition.',
  'villepin-defense-engager-une-negociation-verifiab':
    'Ouvrir des négociations contrôlées sur les armes nucléaires et les missiles, pour empêcher qu’elles se répandent.',
  'villepin-defense-exiger-l-ouverture-immediate-de-':
    'Un corridor humanitaire est un passage protégé par lequel acheminer des secours. L’appui accordé dépendrait du respect des règles de la guerre.',
  'villepin-defense-soutenir-fermement-l-initiative-':
    'Un cessez-le-feu est l’arrêt des combats convenu entre les belligérants. La démarche évoquée demande aussi le retour des personnes enlevées.',
  'villepin-institutions-etablir-une-loi-cadre-souple-ada':
    'Une loi unique et adaptable pour organiser la façon dont communes, départements et régions travaillent ensemble.',
  'villepin-institutions-instaurer-un-conseil-de-souverai':
    'Une instance installée auprès du chef de l’État, chargée d’édicter des règles, d’en vérifier l’application et de punir les manquements.',
  'villepin-institutions-redefinir-les-communes-comme-bas':
    'Un bassin de vie est la zone où l’on habite, travaille et fait ses courses. Les mairies gagneraient des pouvoirs sur le travail et la nature.',

  // --- Édouard Philippe --------------------------------------------------------
  'philippe-economie-conclure-un-pacte-fiscal-avec-le':
    'Un échange avec les entreprises : 50 milliards d’impôts en moins sur leur activité, contre 50 milliards d’aides publiques supprimées.',
  'philippe-economie-ramener-le-deficit-public-de-plu':
    'Le PIB est la richesse produite par le pays en un an. L’écart entre dépenses et recettes de l’État serait réduit de plus de moitié d’ici la fin du mandat.',
  'philippe-economie-reorganiser-massivement-l-etat-e':
    'Les agences et opérateurs sont des organismes publics distincts des ministères. Ils seraient fusionnés ou vendus au privé, et les démarches allégées.',
  'philippe-emploi-adapter-l-enseignement-le-recrut':
    'L’IA est l’intelligence artificielle. Les personnes dont le métier serait menacé par elle auraient un droit à se reconvertir.',
  'philippe-emploi-reequilibrer-le-financement-du-m':
    'La protection sociale est surtout payée par les cotisations prises sur les salaires. D’autres recettes prendraient le relais, et la paye monterait.',
  'philippe-retraites-confier-aux-partenaires-sociaux-':
    'Les partenaires sociaux sont les syndicats de salariés et les organisations d’employeurs. Ce sont eux qui piloteraient les pensions, sans déficit.',
  'philippe-retraites-creer-un-pilier-de-capitalisatio':
    'Une part de la retraite (10 à 15 %) viendrait d’un capital placé et investi, en plus des cotisations versées par les actifs.',
  'philippe-retraites-travailler-plus-pour-garantir-l-':
    'Allonger la durée d’activité pour que les pensions se financent, avec des règles différentes selon les parcours professionnels.',
  'philippe-solidarites-accorder-une-part-fiscale-des-le':
    'Une part fiscale allège l’impôt d’un foyer selon le nombre de personnes qui le composent. Le rang qui la déclenche passerait de trois à deux.',
  'philippe-solidarites-creer-le-temps-partiel-parental-':
    'Pendant deux mois après un congé parental, on ne travaillerait que quatre jours sur cinq tout en gardant l’intégralité de sa paye.',
  'philippe-solidarites-creer-une-aide-financiere-unique':
    'Les nombreuses allocations destinées aux parents seraient réunies en un seul versement, identique pour tous et plus simple à comprendre.',
  'philippe-sante-stabiliser-les-depenses-de-sante':
    'Ne plus augmenter le budget de la santé, mais le dépenser autrement : davantage de prévention et de technologies.',
  'philippe-education-concentrer-l-enseignement-primai':
    'À l’école élémentaire, la lecture, l’écriture et le calcul prendraient la place principale, le reste venant après.',
  'philippe-education-creer-un-service-public-universe':
    'Un soutien scolaire gratuit pour tous, mêlant un assistant par intelligence artificielle et des professeurs à la retraite ou des étudiants volontaires.',
  'philippe-education-faire-des-chefs-d-etablissement-':
    'Le principal ou le proviseur déciderait de l’organisation, du règlement, de la tenue vestimentaire, et recruterait puis noterait ses professeurs.',
  'philippe-numerique-developper-une-infrastructure-d-':
    'Souverain signifie ici maîtrisé par l’Europe, sans dépendre d’un autre continent. Deux fois plus de puissance de calcul en cinq ans.',
  'philippe-numerique-peser-a-l-echelle-europeenne-ave':
    '« Buy European Tech Act » désigne une loi qui obligerait les administrations à acheter européen. Les États passeraient commande ensemble.',
  'philippe-numerique-simplifier-le-cadre-juridique-eu':
    'L’IA est l’intelligence artificielle, c’est-à-dire des programmes capables d’apprendre et de décider seuls à partir de grandes quantités de données.',
  'philippe-logement-faciliter-le-demenagement-des-fa':
    'Un prêt sans intérêts à chaque naissance, pour permettre à la famille de déménager dans plus grand.',
  'philippe-environnement-assurer-notre-souverainete-energ':
    'Produire notre électricité sans dépendre d’autres pays : relance du nucléaire, développement des renouvelables, et passage massif à l’électrique.',
  'philippe-environnement-doubler-le-montant-du-fonds-vert':
    'Doubler l’aide de l’État aux collectivités pour l’écologie, en la réservant à l’adaptation et au rafraîchissement des bâtiments publics.',
  'philippe-environnement-instaurer-un-prix-du-carbone-aux':
    'Une taxe à l’entrée de l’Union, calculée sur les gaz rejetés pour fabriquer un produit, afin que les usines d’ici ne soient pas désavantagées.',
  'philippe-agriculture-creer-100-territoires-de-souvera':
    'Créer 100 zones dédiées à la production alimentaire, et cesser d’appliquer des règles plus strictes que celles de l’Union européenne.',
  'philippe-agriculture-lancer-un-grand-plan-de-transmis':
    'Un programme public pour aider les fermes à passer d’une génération à la suivante et à s’équiper de matériel récent.',
  'philippe-securite-donner-aux-maires-un-pouvoir-de-':
    'Le maire pourrait sanctionner lui-même les petites infractions du quotidien, sans passer par un tribunal.',
  'philippe-securite-renforcer-l-autorite-du-garde-de':
    'Le ministre de la Justice pourrait donner des instructions aux procureurs sur des affaires précises.',
  'philippe-immigration-denoncer-l-accord-de-1968-avec-l':
    'Mettre fin à l’accord franco-algérien de 1968, qui fixe des règles d’entrée et de séjour propres aux Algériens.',
  'philippe-immigration-mettre-en-place-une-veritable-po':
    'Faire apprendre le français aux personnes arrivées de l’étranger, les mener vers un emploi et leur enseigner les principes de la République.',
  'philippe-defense-massifier-notre-production-et-no':
    'Un drone tactique est un petit appareil sans pilote employé sur le terrain. Il s’agit d’en fabriquer et d’en commander bien davantage.',
  'philippe-defense-porter-le-nombre-de-reservistes-':
    'Un réserviste est un civil formé qui rejoint l’armée ponctuellement. Leur effectif, comme celui des engagés volontaires, augmenterait fortement.',

  // --- François Ruffin ---------------------------------------------------------
  'ruffin-economie-la-france-pourra-nationaliser-ce':
    'L’État pourrait devenir propriétaire d’entreprises jugées stratégiques, pour éviter que se répète l’affaire Alstom.',
  'ruffin-economie-realiser-20-millions-d-euros-d-e':
    'L’Élysée est la présidence de la République. Ses dépenses seraient réduites, à commencer par ses achats d’assiettes et de plats.',
  'ruffin-economie-rendre-publics-les-montants-vers':
    'Un cabinet de conseil est une société privée payée pour aider l’administration. Les sommes qui leur sont réglées seraient rendues publiques.',
  'ruffin-economie-un-systeme-d-alerte-sera-mis-en-':
    'Un canal officiel permettrait aux entreprises et aux syndicats de signaler les tentatives d’influence étrangère dont ils ont connaissance.',
  'ruffin-emploi-deployer-un-plan-de-formation-na':
    'Un plan national de formation pour les métiers essentiels, afin de permettre d’évoluer au sein de son entreprise.',
  'ruffin-emploi-instaurer-une-remuneration-doubl':
    'Les heures travaillées avant 8 h ou après 18 h seraient payées deux fois plus.',
  'ruffin-emploi-mieux-remunerer-les-travailleuse':
    'Augmenter la paye des métiers dont la société ne peut pas se passer : soignants, aides à domicile, agents d’entretien, cuisiniers.',
  'ruffin-emploi-systematiser-la-remuneration-for':
    'Une coupure est un temps mort non payé au milieu de la journée. Au-delà de deux heures, elle donnerait droit à une somme fixe.',
  'ruffin-retraites-reconnaitre-la-penibilite-des-me':
    'Un trimestre est l’unité qui sert à compter la durée cotisée. Ces métiers en gagneraient, avec la possibilité d’apprendre un autre travail.',
  'ruffin-solidarites-elargir-le-pass-culture-aux-adul':
    'Le Pass Culture est un crédit offert par l’État pour des livres ou des places de spectacle. Il ne serait plus réservé aux jeunes.',
  'ruffin-solidarites-garantir-l-acces-de-toutes-et-to':
    'Le Pass’Sport est une aide de l’État pour l’inscription en club. Au-delà, la moitié du reste à payer serait prise en charge.',
  'ruffin-solidarites-simplifier-l-acces-aux-aides-pou':
    'Un seul guichet pour les aides aux vacances et aux loisirs, qui préviendrait automatiquement les personnes y ayant droit.',
  'ruffin-education-creer-une-route-des-metiers-d-ar':
    'Un parcours touristique national autour des métiers d’art, pensé pour rester accessible à tous.',
  'ruffin-education-garantir-a-chaque-enfant-francai':
    'Une colonie ou une classe de découverte payée par l’État, au moins une fois durant l’école, attribuée sans que les parents aient à la réclamer.',
  'ruffin-education-mettre-en-place-une-politique-am':
    'Un emploi non délocalisable ne peut pas être transféré à l’étranger : un spectacle ou un centre de vacances se tient forcément sur place.',
  'ruffin-education-transformer-la-plateforme-du-pas':
    'Souverain veut dire maîtrisé par la puissance publique plutôt que par une société privée. L’application pousserait vers les activités en groupe.',
  'ruffin-logement-affirmer-la-vocation-sociale-du-':
    'La contribution des entreprises au logement servirait d’abord à loger les travailleurs des métiers essentiels.',
  'ruffin-logement-garantir-par-la-loi-le-maintien-':
    'Non lucratif veut dire sans recherche de profit : villages vacances associatifs, auberges. Les subventions dépendraient de prix contenus.',
  'ruffin-logement-garantir-un-droit-au-logement-ab':
    'Les métiers indispensables au quotidien auraient droit à un toit peu cher, près de là où ils exercent.',
  'ruffin-logement-permettre-aux-travailleuses-et-t':
    'Loger tout près de leur poste les métiers indispensables, pour leur épargner les longs trajets quotidiens et ce qu’ils coûtent en repos.',
  'ruffin-transports-baisser-les-tarifs-des-peages-en':
    'Reprendre les autoroutes aux sociétés privées à la fin de leurs contrats, et fixer soi-même des péages moins chers.',
  'ruffin-transports-mettre-en-place-un-billet-popula':
    'Les TER sont les trains express régionaux, qui desservent les villes d’une même région en dehors des grandes lignes.',
  'ruffin-transports-plafonner-le-prix-des-billets-d-':
    'Plafonner, c’est fixer une limite à ne pas dépasser. Aucun vol entre la métropole et l’Outre-mer ne pourrait coûter davantage que ce seuil.',
  'ruffin-securite-interdire-toute-intervention-des':
    'Un magistrat du parquet enquête et réclame les peines. Le gouvernement ne pourrait plus peser sur sa nomination ni sur son avancement.',
  'ruffin-securite-limiter-l-usage-de-la-convention':
    'La CJIP permet à une entreprise poursuivie de payer une amende négociée sans procès ni condamnation. L’extranéité désigne un lien avec l’étranger.',
  'ruffin-securite-renforcer-l-independance-du-parq':
    'Le gouvernement ne nommerait plus les procureurs.',
  'ruffin-securite-supprimer-la-convention-judiciai':
    'Cet accord permet à une entreprise poursuivie de payer une amende négociée sans procès ni condamnation pénale.',
  'ruffin-institutions-faire-de-la-probite-une-priorite':
    'La probité, c’est l’honnêteté dans l’exercice d’une fonction publique. Elle deviendrait une exigence centrale de l’action gouvernementale.',
  'ruffin-institutions-mettre-en-place-un-systeme-de-co':
    'Consulter les citoyens par défaut sur les décisions publiques, pour contrebalancer l’influence des lobbies.',
  'ruffin-institutions-soumettre-la-decision-du-ministr':
    'Une commission parlementaire est un groupe de députés spécialisé. Celui-ci examinerait le choix du ministre avant qu’il ne devienne définitif.',

  // --- Gabriel Attal -----------------------------------------------------------
  'attal-economie-lancer-le-plan-france-2050-a-hau':
    'Un investissement public de 100 milliards d’euros concentré sur dix secteurs industriels et technologiques jugés décisifs.',
  'attal-economie-passer-la-tva-sur-les-vehicules-':
    'La TVA sur une voiture électrique passerait de 20 % à 5,5 % pendant cinq ans, en remplacement d’une partie de la prime à l’achat.',
  'attal-economie-ramener-les-impots-de-production':
    'Plafonner les impôts que les entreprises paient sur leur activité, qu’elles fassent des bénéfices ou non, à moins de 3 % de la richesse qu’elles produisent.',
  'attal-emploi-creer-un-conge-de-naissance-de-6':
    'Le plafond de la Sécurité sociale est un montant de référence qui sert à calculer les prestations. L’arrêt serait payé aux sept dixièmes de ce repère.',
  'attal-emploi-creer-un-contrat-reussite-etudia':
    'Un contrat réservé aux étudiants : 15 heures par semaine au maximum, charges allégées pour l’employeur, et pause pendant les examens.',
  'attal-emploi-former-10-millions-de-salaries-e':
    'Dix millions d’actifs seraient initiés en trois ans aux logiciels qui produisent seuls du texte ou des images, et à l’informatique en général.',
  'attal-solidarites-garantir-un-filet-de-securite-po':
    'Une caution personnelle engage les biens propres du dirigeant. Un patron pourrait cotiser contre la perte d’activité et risquerait moins en cas de faillite.',
  'attal-solidarites-mettre-en-place-un-droit-opposab':
    'Un droit à une place de garde qu’on pourrait faire valoir : si la commune n’en propose aucune, la CAF s’en chargerait.',
  'attal-solidarites-recentrer-l-aide-sociale-a-l-enf':
    'La protection des mineurs en danger est aujourd’hui confiée aux départements. L’État reprendrait la main, pour des règles identiques partout.',
  'attal-sante-creer-des-centres-de-prise-en-ch':
    'Les UMJ, unités médico-judiciaires, sont les services hospitaliers qui constatent officiellement les blessures pour la justice.',
  'attal-sante-instaurer-un-bilan-psychologique':
    'M’T dents est le rendez-vous dentaire gratuit proposé aux enfants à âges fixes. Sur le même principe, deux séances chez un psychologue avant la majorité.',
  'attal-sante-prevoir-une-couverture-sante-obl':
    'Une complémentaire santé obligatoire pour les personnes employées directement par des particuliers : ménage, aide à domicile, garde d’enfants.',
  'attal-education-former-des-generations-d-ingenie':
    'L’IA désigne l’intelligence artificielle : des programmes capables d’exécuter des tâches qui demandaient jusque-là un raisonnement humain.',
  'attal-education-introduire-des-cours-optionnels-':
    'Une matière facultative où l’élève monterait lui-même une petite société, proposée au collège et au lycée.',
  'attal-education-maintenir-la-trajectoire-de-rein':
    'Le PIB est la richesse produite par le pays en un an. L’engagement d’y consacrer 3 % pour la recherche d’ici 2030 serait tenu.',
  'attal-numerique-integrer-l-ia-dans-le-quotidien-':
    'L’IA est l’intelligence artificielle. Les tâches à faible valeur ajoutée sont les travaux répétitifs qu’un logiciel peut exécuter à la place d’une personne.',
  'attal-logement-creer-jusqu-a-500-000-logements-':
    'Créer des logements sans étendre les villes : en surélevant les immeubles, en divisant les terrains et en construisant derrière les maisons existantes.',
  'attal-environnement-garantir-un-prix-maximal-de-l-el':
    'Décarboner, c’est réduire les gaz rejetés. Les usines paieraient leur courant sous un plafond, à condition de s’y engager et de passer à l’électrique.',
  'attal-environnement-reussir-la-transition-ecologique':
    'Décarboner, c’est cesser de rejeter des gaz à effet de serre. Il s’agirait d’y parvenir sans perdre en richesse ni en protection sociale.',
  'attal-environnement-tenir-l-objectif-de-14-epr-d-ici':
    'Un EPR est un réacteur nucléaire de nouvelle génération. L’éolien en mer serait développé avec des autorisations instruites en deux ans.',
  'attal-agriculture-mettre-en-place-des-contrats-de-':
    'Des contrats liant l’État, la filière et l’agriculteur, portant sur le bien-être animal et la réduction de moitié des pesticides d’ici 2030.',
  'attal-securite-eviter-les-parcours-delinquants-':
    'Intervenir dès le premier écart plutôt qu’après plusieurs : une punition proportionnée, et un accompagnement pour revenir dans le droit chemin.',
  'attal-securite-mettre-en-place-un-suivi-en-lign':
    'Comme pour un colis, on pourrait consulter sur internet où en est son dossier, depuis le dépôt jusqu’à la décision du tribunal.',
  'attal-securite-rendre-systematique-la-police-mu':
    'Toute commune de plus de 10 000 habitants devrait avoir une police municipale, sauf vote contraire de son conseil.',
  'attal-immigration-creer-3000-places-supplementaire':
    'La rétention administrative enferme un étranger le temps d’organiser son renvoi. Trois mille places de plus seraient bâties, plus rapidement.',
  'attal-immigration-instaurer-un-systeme-d-admission':
    'Les étrangers seraient sélectionnés selon un barème (diplôme, âge, maîtrise du français, promesse d’embauche), dans des limites votées par le Parlement.',
  'attal-immigration-rendre-plus-operationnelle-la-bo':
    '« Border force » est le nom donné au dispositif de garde des frontières. Il serait dirigé depuis un commandement central et des antennes en région.',
  'attal-defense-instaurer-un-buy-european-tech-a':
    'Réserver les commandes publiques de défense et de technologie aux entreprises européennes et à celles des pays signataires des accords de l’OMC.',
  'attal-institutions-mener-une-revue-des-entites-de-r':
    'Les autorités de régulation surveillent un secteur au nom de l’État. Elles seraient passées en revue, et certaines fermées.',
  'attal-institutions-ouvrir-le-chatbot-albert-a-tous-':
    'Albert est l’assistant conversationnel de l’administration : un robot qui répond par écrit. Un humain reprendrait la main sur les cas particuliers.',

  // --- Jean-Luc Mélenchon ------------------------------------------------------
  'melenchon-economie-etablir-une-taxe-permanente-sur-':
    'Un superprofit est un bénéfice bien supérieur à celui des années ordinaires. Toutes les branches y seraient soumises, pas seulement l’énergie.',
  'melenchon-economie-retablir-et-renforcer-l-impot-de':
    'Rétablir un impôt annuel payé sur les grands patrimoines, alourdi pour ceux qui reposent sur des activités polluantes.',
  'melenchon-emploi-garantir-les-droits-des-represen':
    'Un salarié protégé exerce un mandat, syndical ou électif, qui rend son renvoi soumis à autorisation. Cette garantie serait consolidée.',
  'melenchon-emploi-interdire-les-licenciements-bour':
    'Un dividende est la part du gain reversée aux actionnaires. Une société qui en verse, ou qui touche de l’argent public, ne pourrait plus renvoyer.',
  'melenchon-retraites-garantir-aux-agricultrices-et-ag':
    'Réformer les retraites agricoles pour garantir un niveau de pension décent aux agriculteurs.',
  'melenchon-retraites-supprimer-la-decote-qui-represen':
    'La décote ampute définitivement la pension de qui part sans avoir tous ses trimestres. Elle disparaîtrait.',
  'melenchon-solidarites-creer-un-service-public-de-la-pe':
    'L’accueil des tout-petits deviendrait une mission de l’État, avec un demi-million de places supplémentaires ouvertes en cinq ans.',
  'melenchon-solidarites-organiser-l-election-des-adminis':
    'Les assurés éliraient eux-mêmes les dirigeants de la Sécurité sociale, qui pourraient fixer le niveau des cotisations.',
  'melenchon-sante-ajouter-le-droit-de-mourir-dans-':
    'Les soins palliatifs soulagent la douleur en fin de vie sans chercher à guérir. Ce droit, et celui d’être aidé à partir, entreraient dans la Constitution.',
  'melenchon-sante-proteger-la-recherche-de-la-fina':
    'Écarter les intérêts financiers et les entreprises privées de la recherche médicale et de l’hôpital.',
  'melenchon-education-geler-les-ouvertures-de-places-d':
    'Lucratif veut dire qui vise le profit. Aucune nouvelle place n’y serait autorisée, et l’argent irait vers les structures publiques.',
  'melenchon-education-renforcer-le-controle-pedagogiqu':
    'Soumettre tous les établissements privés d’enseignement supérieur au contrôle du ministère.',
  'melenchon-numerique-garantir-l-hebergement-des-donne':
    'Héberger, c’est stocker sur des machines. Celles des administrations et des sociétés vitales devraient se trouver sur le sol national.',
  'melenchon-numerique-garantir-l-utilisation-de-galile':
    'Galileo est le système européen de positionnement par satellite, le GPS son équivalent américain. La double compatibilité permet d’utiliser les deux.',
  'melenchon-logement-lancer-un-plan-d-urgence-de-prev':
    'Éradiquer, c’est faire disparaître complètement. Des équipes créées par les collectivités seraient chargées de ces insectes.',
  'melenchon-logement-requisitionner-les-logements-vid':
    'L’État pourrait prendre les logements laissés vides pour les remettre en location, une fois rendus décents.',
  'melenchon-transports-lancer-des-grands-travaux-de-ren':
    'Rénover le réseau ferré et rouvrir les lignes et les gares fermées depuis trente ans.',
  'melenchon-transports-repenser-la-mobilite-individuell':
    'Une mobilité douce est un déplacement sans moteur. Il s’agit d’encourager le covoiturage, l’autopartage et les trajets à bicyclette.',
  'melenchon-environnement-agir-contre-les-consequences-des':
    'Un transfert de technologie, c’est céder un savoir-faire à un autre pays. S’y ajouteraient des versements et des équipements.',
  'melenchon-environnement-atteindre-le-tres-bon-etat-ecolo':
    'Une réserve souterraine, ou nappe, est l’eau retenue dans le sous-sol. L’objectif porte sur sa qualité comme sur celle des eaux de surface.',
  'melenchon-agriculture-determiner-de-nouvelles-normes-p':
    'Fixer de nouvelles règles d’élevage : accès à l’extérieur, pâturage, nombre d’animaux et surface minimale par bête.',
  'melenchon-agriculture-instaurer-un-moratoire-sur-les-e':
    'Un moratoire est une suspension provisoire. Les céphalopodes sont les poulpes, seiches et calmars : leur élevage serait proscrit d’emblée.',
  'melenchon-securite-garantir-des-sessions-de-formati':
    'Un juge nommé dans un département d’Outre-mer dont il n’est pas issu suivrait des cours sur son passé, sa géographie et ses questions propres.',
  'melenchon-securite-interdire-la-publicite-pour-les-':
    'Un agrément est l’autorisation d’exercer délivrée par l’État. Une société de paris qui continuerait à faire de la réclame la perdrait.',
  'melenchon-immigration-garantir-le-droit-du-sol-integra':
    'Le droit du sol accorde la nationalité en raison du lieu de naissance. Il vaudrait partout et sans condition, et devenir français serait plus simple.',
  'melenchon-immigration-instituer-la-carte-de-sejour-de-':
    'Régulariser, c’est donner des papiers à une personne qui vit ici sans en avoir. Le permis de dix ans deviendrait la règle plutôt que l’exception.',
  'melenchon-defense-agir-pour-l-adoption-a-l-onu-d-u':
    'Une multinationale est une société implantée dans plusieurs pays. Un texte mondial l’obligerait à des règles de travail et de protection de la nature.',
  'melenchon-defense-renforcer-l-aide-au-developpemen':
    'Le Sahel est la bande de pays qui borde le sud du Sahara. Les versements y augmenteraient, mais cesseraient en cas de manquement.',
  'melenchon-institutions-reconnaitre-le-vote-blanc-mettre':
    'Compter le vote blanc, rendre le vote obligatoire, et exiger un minimum de votes exprimés pour qu’une élection soit valable.',
  'melenchon-institutions-rendre-obligatoire-le-recours-au':
    'Toute réécriture de la loi fondamentale, ou tout nouvel accord signé avec l’Union, devrait passer par un vote de tous les citoyens.',

  // --- Marine Le Pen -----------------------------------------------------------
  'lepen-economie-autoriser-l-etat-a-intervenir-da':
    'Un indice est un repère chiffré qui sert de base au calcul d’un tarif. La puissance publique pèserait sur sa construction dans quelques secteurs.',
  'lepen-economie-creer-sous-l-egide-de-la-caisse-':
    'Un fonds souverain est une réserve d’argent gérée par la puissance publique pour investir. Celui-ci se constituerait sur l’épargne des Français.',
  'lepen-economie-flecher-prioritairement-les-effo':
    'Les baisses d’impôts, les aides et les commandes de l’État iraient d’abord aux entreprises et aux foyers français.',
  'lepen-emploi-appliquer-a-competence-egale-une':
    'À qualification identique, un candidat français passerait devant. Les profils venus d’ailleurs et introuvables ici resteraient recrutables.',
  'lepen-emploi-stabiliser-la-legislation-sur-le':
    'Ne plus modifier les règles sur le temps de travail, et conserver les avantages fiscaux des heures supplémentaires.',
  'lepen-retraites-alleger-les-dispositifs-de-cumul':
    'Faciliter la poursuite d’activité des médecins et des infirmiers déjà retraités.',
  'lepen-retraites-indexer-l-age-d-ouverture-des-dr':
    'Plus on a commencé à travailler tôt, plus on partirait tôt : le moment du départ et le nombre de trimestres exigés suivraient l’entrée dans la vie active.',
  'lepen-solidarites-controler-l-existence-des-benefi':
    'Vérifier que les personnes qui touchent une aide sont toujours en vie, surtout quand elles habitent hors de France.',
  'lepen-solidarites-suspendre-les-allocations-famili':
    'Couper les allocations familiales des parents dont l’enfant mineur récidive dans la délinquance.',
  'lepen-sante-le-modele-de-l-hopital-de-valenc':
    'Étendre à tous les hôpitaux une organisation où les postes administratifs ne dépassent pas 10 % des effectifs.',
  'lepen-sante-mettre-en-place-des-2026-une-pro':
    'Une complémentaire prend en charge ce que la Sécurité sociale ne rembourse pas. Le personnel des hôpitaux publics en obtiendrait une.',
  'lepen-education-donner-dans-l-enseignement-prima':
    'À l’école élémentaire, ces trois matières passeraient avant toutes les autres dans l’emploi du temps.',
  'lepen-education-experimenter-un-service-national':
    'Un service national facultatif consacré à l’entretien des monuments et des espaces naturels.',
  'lepen-numerique-taxer-l-utilisation-des-reseaux-':
    'Faire payer aux géants du numérique l’usage qu’ils font des réseaux, pour un rendement annoncé de 550 millions d’euros en 2026.',
  'lepen-logement-instaurer-dans-l-acces-au-logeme':
    'L’attribution d’un logement social donnerait la priorité aux Français, puis tiendrait compte du métier exercé.',
  'lepen-logement-remplacer-maprimerenov-par-un-di':
    'MaPrimeRénov’ est l’aide de l’État pour les travaux d’isolation et de chauffage. Elle céderait la place à un autre système, moins onéreux.',
  'lepen-transports-investir-dans-les-infrastructure':
    'Investir partout dans les réseaux numériques et les transports, avec notamment de nouvelles sorties d’autoroute.',
  'lepen-transports-supprimer-les-zones-a-faibles-em':
    'Ces zones interdisent aux véhicules les plus polluants de rouler dans certaines agglomérations. Elles seraient abolies.',
  'lepen-environnement-laisser-les-parcs-eoliens-actuel':
    'Ne plus prolonger les parcs éoliens existants, et démonter ceux qui abîment un paysage ou un monument.',
  'lepen-environnement-prolonger-et-optimiser-les-react':
    'Un EPR2 est un réacteur nucléaire de nouvelle génération ; les SMR sont de petits réacteurs modulaires, assemblés en usine.',
  'lepen-agriculture-annuler-la-baisse-de-500-million':
    'Une mission désigne un bloc du budget de l’État. Celle consacrée aux campagnes garderait la somme qu’il était prévu de lui retirer.',
  'lepen-agriculture-defendre-une-exception-agricultu':
    'Le libre-échange supprime droits de douane et quotas entre pays signataires. Les produits des fermes en seraient tenus à l’écart.',
  'lepen-securite-identifier-des-lieux-pouvant-etr':
    'Repérer des bâtiments transformables en prisons allégées, pour les mineurs et les courtes peines.',
  'lepen-securite-mettre-en-place-des-peines-planc':
    'Une peine plancher est un minimum sous lequel le juge ne peut pas descendre. Elle viserait les repris de justice et les agressions d’agents publics.',
  'lepen-immigration-mettre-fin-a-l-accord-franco-alg':
    'Ce texte fixe aux Algériens des règles propres pour venir, travailler et s’installer, distinctes du droit commun. Il serait dénoncé.',
  'lepen-immigration-negocier-avec-les-partenaires-eu':
    'L’espace Schengen permet de passer d’un pays à l’autre sans contrôle aux frontières. Il serait fermé aux personnes venues d’ailleurs.',
  'lepen-defense-faire-de-la-lutte-contre-les-ing':
    'Une ingérence, c’est l’intervention d’une puissance extérieure dans les affaires du pays. Espionnage et diplomatie en feraient leur cible.',
  'lepen-defense-renforcer-les-controles-sur-les-':
    'Un fonds souverain est une réserve d’argent public destinée à investir. Il servirait à empêcher qu’une activité sensible passe à des mains étrangères.',
  'lepen-institutions-inscrire-dans-la-constitution-un':
    'Un référendum d’initiative citoyenne permet aux électeurs eux-mêmes de provoquer un vote sur un texte. Ce droit serait gravé dans la loi fondamentale.',
  'lepen-institutions-supprimer-une-large-partie-des-a':
    'Supprimer une grande partie des agences et autorités indépendantes, et rendre leurs missions à l’administration.',

  // --- Marine Tondelier --------------------------------------------------------
  'tondelier-economie-augmenter-le-taux-de-la-taxe-sur':
    'Cet impôt frappe les grands magasins au mètre carré. Son produit, relevé, servirait à maintenir les petites boutiques et les bistrots.',
  'tondelier-economie-mettre-en-place-une-taxe-zucman-':
    'Un impôt annuel de 2 % sur la part d’un patrimoine qui dépasse 100 millions d’euros.',
  'tondelier-economie-renforcer-le-fonds-barnier-pour-':
    'Le Fonds Barnier est la caisse publique qui paie la protection contre les risques naturels. Il serait doté davantage.',
  'tondelier-emploi-augmenter-les-salaires-des-ensei':
    'La rémunération des professeurs progresserait de quinze pour cent, la hausse étant répartie sur cinq années.',
  'tondelier-emploi-garantir-des-amenagements-d-hora':
    'La vigilance orange est le troisième niveau d’alerte de Météo-France. Ces jours-là, on pourrait décaler ses heures et souffler plus souvent, payé pareil.',
  'tondelier-emploi-passer-le-salaire-minimum-a-2-00':
    'Le brut est le montant avant retenue des cotisations : ce que touche vraiment l’employé est inférieur. Ce plancher légal serait relevé.',
  'tondelier-solidarites-garantir-systematiquement-aux-fa':
    'Une famille monoparentale, c’est un seul adulte élevant ses enfants. Un mode de garde lui serait assuré, avec un accompagnement.',
  'tondelier-solidarites-garantir-une-puissance-electriqu':
    'Le courant ne serait jamais totalement interrompu : il en resterait assez pour faire tourner le frigo et de quoi brasser l’air.',
  'tondelier-solidarites-renforcer-les-demarches-d-aller-':
    '« Aller-vers » désigne le fait que les services publics se déplacent au-devant des gens, au lieu d’attendre qu’ils poussent la porte.',
  'tondelier-sante-creer-2-000-nouveaux-centres-de-':
    'Un centre de santé emploie des soignants salariés, sans dépassement d’honoraires. Deux mille ouvriraient, surtout loin des villes.',
  'tondelier-sante-former-regulierement-les-profess':
    'Les adultes qui encadrent les enfants apprendraient ce que ceux-ci font sur les écrans, et ce que cela produit sur leur équilibre psychique.',
  'tondelier-sante-garantir-un-soutien-psychologiqu':
    'Un sinistré est quelqu’un dont les biens ont été détruits. Lui comme les pompiers seraient suivis dans le temps par un psychologue.',
  'tondelier-education-integrer-une-education-critique-':
    'Apprendre à l’école à se méfier de ce qu’on lit sur les écrans et à repérer une fausse information ; les professeurs y seraient formés aussi.',
  'tondelier-education-reduire-la-taille-des-classes-de':
    'Pas plus de 19 élèves par classe en primaire d’ici 2032, et 12 dans les écoles les plus défavorisées.',
  'tondelier-numerique-faire-respecter-des-criteres-de-':
    'Les grands réseaux sociaux devraient rendre leurs algorithmes neutres, et couper les fils personnalisés pendant les campagnes électorales.',
  'tondelier-numerique-imposer-la-diversification-des-c':
    'Une bulle de filtres, c’est quand un site ne montre plus que ce qui conforte l’usager. Les réseaux devraient varier ce qu’ils proposent.',
  'tondelier-logement-atteindre-500-000-renovations-pe':
    'La précarité énergétique, c’est ne pas pouvoir se chauffer correctement faute de moyens. Un demi-million de logements seraient rénovés par an.',
  'tondelier-logement-generaliser-ameliorer-et-perenni':
    'Rendre permanent et étendre à tout le pays le plafonnement des loyers.',
  'tondelier-transports-ajouter-un-milliard-d-euros-en-2':
    'Le leasing social est une location longue durée à petit prix, financée par la collectivité. Son budget serait augmenté d’un milliard.',
  'tondelier-transports-creer-une-offre-de-location-soci':
    'Un million de voitures électriques proposées en location à tarif social sur cinq ans, en privilégiant les modèles européens.',
  'tondelier-environnement-financer-par-le-fonds-vert-des-s':
    'Le Fonds vert est une enveloppe d’État pour les projets écologiques des communes. Il paierait un minimum de verdure et de sols qui absorbent l’eau.',
  'tondelier-environnement-modifier-la-ppe3-pour-que-la-par':
    'Porter à 44 % la part des renouvelables dans l’électricité consommée en 2030, en modifiant la feuille de route énergétique.',
  'tondelier-agriculture-organiser-des-dispositifs-veteri':
    'Des équipes de soins pour animaux seraient dépêchées sur les lieux, pour prendre en charge les bêtes atteintes par le feu.',
  'tondelier-agriculture-planifier-une-sortie-progressive':
    'Arrêter progressivement les pesticides chimiques et les engrais azotés, d’ici 2050.',
  'tondelier-securite-consacrer-260-millions-d-euros-e':
    'Un Canadair est un avion qui écope dans la mer ou un lac pour larguer l’eau sur un feu. Deux de plus seraient achetés, avec deux hélicoptères.',
  'tondelier-securite-creer-9-000-postes-de-magistrats':
    'Un greffier consigne ce qui se dit à l’audience et tient les dossiers ; un attaché de justice seconde le juge. Ces effectifs augmenteraient tous.',
  'tondelier-immigration-regulariser-les-travailleurs-les':
    'Régulariser travailleurs, étudiants et parents d’élèves selon des critères fixes : durée de présence, liens familiaux et activité professionnelle.',
  'tondelier-defense-creer-un-commandement-militaire-':
    'Un état-major européen commun, placé sous l’autorité des États membres, qui ne pourrait pas engager seul les armées nationales.',
  'tondelier-institutions-creer-une-delegation-interminist':
    'Une délégation interministérielle est une équipe qui travaille pour plusieurs ministères à la fois. Celle-ci s’occuperait de l’isolement.',
  'tondelier-institutions-instaurer-la-proportionnelle-int':
    'Élire les députés à la proportionnelle par région, sans sièges bonus pour le vainqueur, et réduire ce bonus à 25 % aux municipales.',

  // --- Raphaël Glucksmann ------------------------------------------------------
  'glucksmann-economie-donner-aux-territoires-notamment':
    'Entrer au capital, c’est acheter des parts d’une société et siéger parmi ses propriétaires. Les collectivités pourraient le faire.',
  'glucksmann-economie-flecher-une-part-des-revenus-de-':
    'L’octroi de mer est la taxe perçue sur les marchandises entrant en Outre-mer. Une fraction garantie de son produit irait aux équipements locaux.',
  'glucksmann-economie-instaurer-une-contribution-solid':
    'Une contribution est un prélèvement obligatoire. Son produit servirait à remettre en état des installations et à soutenir la vie associative.',
  'glucksmann-emploi-creer-des-guichets-pour-booster-':
    'Des lieux uniques où un jeune trouverait gratuitement, au même endroit, de l’aide sur l’emploi, le logement, la santé et ses droits.',
  'glucksmann-emploi-proteger-les-salaries-en-redonna':
    'Une branche regroupe toutes les sociétés d’un même métier. Ses règles primeraient de nouveau sur celles négociées société par société.',
  'glucksmann-retraites-creer-un-haut-conseil-du-pilotag':
    'Les partenaires sociaux sont les syndicats et les organisations patronales. Ils détiendraient la majorité dans cette nouvelle instance.',
  'glucksmann-retraites-travailler-a-une-reforme-d-ample':
    'Remettre à plat le système de retraites, en le construisant avec les syndicats et les organisations patronales plutôt que sans eux.',
  'glucksmann-solidarites-automatiser-l-acces-aux-droits-s':
    'Les aides seraient versées sans qu’on ait à les demander : un fichier commun aux administrations suffirait à les déclencher.',
  'glucksmann-solidarites-rendre-l-accessibilite-universel':
    'Un handicap sensoriel touche la vue ou l’ouïe, un handicap cognitif la mémoire ou l’attention. L’adaptation des lieux les viserait tous.',
  'glucksmann-sante-assurer-la-contraception-gratuit':
    'Les protections périodiques sont les serviettes, tampons et coupes menstruelles. Elles seraient prises en charge, comme les moyens d’éviter une grossesse.',
  'glucksmann-sante-generaliser-le-pass-sport-sante-':
    'Ce dispositif aide à payer la pratique d’une activité physique. Il ne serait plus réservé à certaines tranches d’âge, mais ouvert à tous.',
  'glucksmann-education-freiner-les-fermetures-d-ecoles-':
    'Un regroupement réunit plusieurs villages autour d’une même classe. Ces fusions seraient réexaminées, et les petites structures maintenues.',
  'glucksmann-education-repenser-en-profondeur-parcoursu':
    'Parcoursup est la plateforme qui affecte les bacheliers dans le supérieur. Sa refonte serait discutée avec les familles et les établissements.',
  'glucksmann-numerique-combattre-les-algorithmes-toxiqu':
    'Un algorithme est la recette qui décide de l’ordre des publications affichées. Les plateformes devraient l’encadrer dès la fabrication du service.',
  'glucksmann-numerique-contrecarrer-les-monopoles-techn':
    'GAFAM désigne les grandes plateformes américaines (Google, Apple, Facebook, Amazon, Microsoft), BATX leurs équivalentes chinoises.',
  'glucksmann-logement-retablir-l-obligation-d-accessib':
    'Le BTP est le secteur du bâtiment et des travaux publics. L’accessibilité universelle vise des logements utilisables par les personnes handicapées.',
  'glucksmann-transports-relancer-les-trains-de-nuit-acce':
    'Rouvrir des trajets où l’on dort à bord, hâter les chantiers de voies rapides, et mieux relier entre eux les réseaux ferrés du continent.',
  'glucksmann-transports-rendre-l-accessibilite-universel':
    'Rendre bus, métros et gares utilisables par tous, quel que soit le handicap, pour n’être empêché ni de travailler ni de se soigner.',
  'glucksmann-environnement-conforter-le-role-du-nucleaire-e':
    'La sûreté désigne la prévention des accidents dans une installation atomique. Les réacteurs actuels seraient surveillés, d’autres bâtis sans retard.',
  'glucksmann-environnement-deployer-des-conventions-citoyen':
    'Réunir dans chaque région des citoyens tirés au sort, et des assemblées locales, pour décider des mesures climatiques.',
  'glucksmann-agriculture-garantir-le-revenu-des-agriculte':
    'Un prix plancher est un minimum d’achat sous lequel nul ne peut descendre. Il serait fixé assez haut pour faire vivre celui qui produit.',
  'glucksmann-agriculture-instaurer-un-revenu-de-transitio':
    'Une somme versée le temps du changement de méthode, pour que se convertir au biologique ne prive pas de ressources ceux qui s’y engagent.',
  'glucksmann-securite-deployer-massivement-la-justice-':
    'La justice restaurative fait dialoguer l’auteur et la victime ; le travail d’intérêt général est une peine effectuée gratuitement pour la collectivité.',
  'glucksmann-securite-doubler-le-nombre-de-maisons-du-':
    'Ce sont des lieux où l’on obtient gratuitement des conseils juridiques, sans passer par un tribunal. Il y en aurait deux fois plus.',
  'glucksmann-immigration-creer-une-force-europeenne-de-sa':
    'Des navires financés par plusieurs pays iraient au secours des bateaux en perdition, avec l’obligation d’intervenir inscrite dans les textes.',
  'glucksmann-immigration-mettre-en-place-des-guichets-uni':
    'Un primo-arrivant est une personne installée en France depuis peu. Un seul lieu regrouperait ses démarches, au lieu d’un service par sujet.',
  'glucksmann-defense-augmenter-drastiquement-l-aide-m':
    'Livrer beaucoup plus d’armes et d’équipements à l’Ukraine, et apporter un appui aux deux autres pays cités.',
  'glucksmann-defense-proposer-aux-partenaires-de-l-ue':
    'La dissuasion nucléaire est la menace de représailles atomiques qui décourage une attaque. Elle couvrirait les voisins, la décision restant nationale.',
  'glucksmann-institutions-engager-une-refondation-democrat':
    'Déconcentrer, c’est éloigner l’État de Paris ; décentraliser, c’est confier des compétences aux élus locaux. Les deux seraient menés de front.',
  'glucksmann-institutions-renouer-avec-l-esprit-des-accord':
    'Les accords de Nouméa organisent le transfert progressif de compétences de l’État vers la Nouvelle-Calédonie. On repartirait de leur méthode.',

  // --- Xavier Bertrand ---------------------------------------------------------
  'bertrand-economie-mettre-fin-aux-differences-de-jo':
    'Aligner le nombre de jours d’arrêt maladie non payés entre les fonctionnaires et les salariés du privé.',
  'bertrand-economie-relever-le-prelevement-forfaitai':
    'Augmenter le taux d’imposition unique qui s’applique aux revenus de l’épargne et des placements.',
  'bertrand-retraites-developper-la-retraite-par-capit':
    'Développer les retraites financées par un capital placé, en complément des cotisations versées par les actifs.',
  'bertrand-sante-adopter-une-loi-pluriannuelle-de':
    'Fixer le budget de la santé sur plusieurs années par une loi, au lieu de le rediscuter chaque année.',
  'bertrand-sante-creer-en-corse-un-centre-hospita':
    'Doter la Corse d’un centre hospitalier universitaire réparti sur plusieurs sites, monté avec des partenaires privés.',
  'bertrand-education-developper-le-mecenat-culturel-e':
    'Le mécénat, c’est le soutien d’une entreprise ou d’un particulier à une œuvre. Il viendrait s’ajouter à l’argent de l’État.',
  'bertrand-education-garantir-a-chaque-eleve-de-l-eco':
    'Chaque élève verrait au moins une œuvre ou un spectacle au cours de sa scolarité.',
  'bertrand-education-porter-a-1-la-part-du-budget-de-':
    'Un euro sur cent dépensé par la puissance publique irait aux arts et au patrimoine.',
  'bertrand-education-soutenir-le-developpement-des-la':
    'Une langue régionale est un parler propre à un territoire, comme le breton ou l’occitan. Leur usage serait encouragé.',
  'bertrand-environnement-deployer-la-telesurveillance-et-':
    'Surveiller les forêts par caméras et par drones, pour repérer les incendies dès leur départ.',
  'bertrand-agriculture-supprimer-les-surtranspositions-':
    'Cesser d’imposer à l’agriculture française des règles plus strictes que celles décidées au niveau européen.',
  'bertrand-securite-durcir-les-sanctions-contre-les-':
    'Alourdir les peines encourues par les auteurs d’incendies.',
  'bertrand-securite-instaurer-des-peines-minimales-p':
    'Fixer une peine plancher, sous laquelle un juge ne pourrait pas descendre, pour les agressions d’élus et de forces de secours.',
  'bertrand-defense-proposer-avec-le-danemark-un-par':
    'Le Groenland est un territoire autonome rattaché au Danemark, mais hors de l’Union. Les liens entre les deux seraient resserrés.',
  'bertrand-defense-saisir-la-cour-de-justice-de-l-u':
    'Attaquer l’accord commercial avec le Mercosur devant la justice européenne s’il entre en vigueur.',
  'bertrand-institutions-accorder-a-la-corse-une-autonomi':
    'L’autonomie législative permettrait à l’île d’écrire elle-même certaines de ses règles, dans des limites fixées d’avance.',
  'bertrand-institutions-donner-un-cadre-pluriannuel-a-l-':
    'La continuité territoriale finance les liaisons entre l’île et le continent. Son budget serait arrêté pour plusieurs années au lieu d’une seule.',
  'bertrand-institutions-fusionner-une-partie-des-mandats':
    'Un même élu siégerait à la fois au département et à la région, ce qui supprimerait quatre sièges sur dix.',
  'bertrand-institutions-permettre-l-adaptation-des-lois-':
    'Une même règle nationale pourrait s’appliquer différemment selon les particularités d’un endroit.',
  'bertrand-institutions-soumettre-l-autonomie-de-la-cors':
    'Un référendum est un vote direct sur une question posée. Ce sont les Corses eux-mêmes qui trancheraient sur leur statut.',
  'bertrand-institutions-transferer-aux-territoires-la-re':
    'Ce ne serait plus l’État mais les collectivités locales qui décideraient en matière de toit et de soins.',
};
