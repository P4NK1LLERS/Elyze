// Ce qu'en disent les partisans, ce qu'en disent les opposants.
//
// CE QUE CE FICHIER FAIT, ET SURTOUT CE QU'IL NE FAIT PAS
//
// Il ne dit pas si une mesure est bonne. Il rapporte le débat qu'elle
// suscite : l'argument principal avancé par ceux qui la défendent, celui
// avancé par ceux qui s'y opposent. C'est une position tenable — résumer une
// controverse existante — là où « points positifs / points négatifs » aurait
// engagé l'app à prédire des effets que personne ne connaît. Une app de
// comparaison électorale qui trancherait à la place du lecteur ne vaudrait
// plus rien.
//
// Cinq règles, dont trois sont vérifiées par node scripts/check-data.js :
//
//  1. LES DEUX CÔTÉS, TOUJOURS. Une mesure sans son objection ferait pencher
//     l'app. Le contrôle refuse un argument isolé. [vérifié]
//
//  2. AUCUN NOM DE CANDIDAT. Le paquet est aveugle : nommer quelqu'un
//     révélerait l'auteur de la carte qu'on est en train de juger. [vérifié]
//
//  3. LONGUEURS COMPARABLES. Un « pour » de dix mots face à un « contre » de
//     quarante est un jugement déguisé. Plafond commun. [vérifié]
//
//  4. DES ARGUMENTS RÉELLEMENT AVANCÉS, pas inventés pour faire nombre. Quand
//     l'objection principale est technique (« inapplicable sans rouvrir tel
//     traité »), c'est celle-là qu'on donne, pas une objection de principe
//     plus commode.
//
//  5. AUCUN ADJECTIF ÉVALUATIF de la part de l'app. On écrit « ses opposants
//     avancent que », jamais « malheureusement » ni « à juste titre ».
//
// L'écran présente ces textes derrière un bouton, jamais sur la carte
// elle-même : le swipe doit rester rapide, et lire les arguments doit être un
// choix. Voir components/ProposalDebateDialog.tsx.

export type ProposalDebate = {
  // Ce qu'avancent ceux qui défendent la mesure.
  pour: string;
  // Ce qu'objectent ceux qui s'y opposent.
  contre: string;
};

export const PROPOSAL_ARGUMENTS: Record<string, ProposalDebate> = {
  // --- Bernard Cazeneuve -----------------------------------------------------
  'cazeneuve-economie-instaurer-une-fiscalite-ciblant-': {
    pour:
      'Les revenus du capital sont aujourd\'hui moins taxés que ceux du travail : rééquilibrer rapporterait sans peser sur les salaires.',
    contre:
      'Les grands patrimoines sont mobiles. Si les plus gros contribuables s\'installent ailleurs, le rendement attendu s\'effondre.',
  },
  'cazeneuve-economie-mettre-en-place-un-plan-sur-dix-': {
    pour:
      'C\'est la visibilité qui manque aux industriels : les à-coups fiscaux découragent des projets qui s\'amortissent sur quinze ans.',
    contre:
      'Un plan d\'État choisit les filières à la place du marché, et l\'argent public peut se figer sur des secteurs déjà dépassés.',
  },
  'cazeneuve-economie-remplacer-l-exigence-d-equilibre': {
    pour:
      'La règle annuelle force à couper pendant les récessions, au pire moment. Lisser sur un cycle évite cette austérité automatique.',
    contre:
      'Repousser l\'équilibre revient souvent à ne jamais l\'atteindre, et la dette sociale finit payée par les générations suivantes.',
  },
  'cazeneuve-emploi-generaliser-l-apprentissage-des-': {
    pour:
      'Trop de jeunes enchaînent stages et contrats courts pendant des années : ramener le CDI comme norme raccourcit cette période d\'attente.',
    contre:
      'Imposer le CDI pousse les employeurs à embaucher moins, faute de pouvoir se séparer d\'un salarié qui ne convient pas.',
  },
  'cazeneuve-retraites-retablir-le-droit-a-un-depart-an': {
    pour:
      'Certains métiers usent le corps au point de réduire l\'espérance de vie : partir plus tôt y rétablit une égalité réelle.',
    contre:
      'Définir la pénibilité par une liste de critères revient à en oublier d\'autres, et ouvre un contentieux sans fin.',
  },
  'cazeneuve-solidarites-accorder-une-aide-supplementaire': {
    pour:
      'Les deux premières années sont celles où l\'on décroche le plus, souvent pour des raisons matérielles plutôt que scolaires.',
    contre:
      'L\'aide ne traite pas la dépense principale, le logement, dont le coût dépasse largement ce montant dans les villes universitaires.',
  },
  'cazeneuve-solidarites-creer-une-avance-jeunesse-de-tro': {
    pour:
      'Les 18-24 ans sans diplôme ni emploi n\'ont droit à presque rien : cette avance comble un trou de la protection sociale.',
    contre:
      'Verser une somme sans accompagnement change rarement la situation, et le dispositif se superposerait au contrat d\'engagement jeune.',
  },
  'cazeneuve-sante-faire-de-la-prise-en-charge-des-': {
    pour:
      'Les troubles psychiques touchent un adulte sur cinq et sont repérés tard, faute de formation des adultes qui côtoient les jeunes.',
    contre:
      'Le label de grande cause nationale n\'apporte pas de moyens, alors que le manque de pédopsychiatres est le vrai goulot.',
  },
  'cazeneuve-education-former-massivement-les-enseignan': {
    pour:
      'Les élèves utilisent déjà ces outils : sans formation, l\'écart se creuse entre ce qu\'enseignent les professeurs et ce qui se passe en classe.',
    contre:
      'Le numérique éducatif a déjà englouti des budgets sans effet mesuré sur les apprentissages.',
  },
  'cazeneuve-education-lancer-un-plan-ecole-climat-soli': {
    pour:
      'Des milliers d\'écoles sont des passoires thermiques, invivables l\'été et coûteuses l\'hiver : les rénover agit sur les deux.',
    contre:
      'Les bâtiments appartiennent aux communes et aux départements : un plan d\'État suppose un cofinancement rarement au rendez-vous.',
  },
  'cazeneuve-numerique-donner-force-de-loi-a-l-evaluati': {
    pour:
      'Les systèmes les plus puissants sont déployés sans qu\'aucune autorité ne puisse les examiner avant leur mise sur le marché.',
    contre:
      'Un examen préalable retarde l\'arrivée des services en Europe et suppose une expertise que peu d\'agences possèdent.',
  },
  'cazeneuve-numerique-stocker-les-donnees-des-francais': {
    pour:
      'Des lois étrangères permettent à des autorités d\'accéder aux données détenues par leurs entreprises, où qu\'elles soient stockées.',
    contre:
      'L\'offre européenne reste limitée : imposer une localisation renchérit le service et retarde certains projets publics.',
  },
  'cazeneuve-logement-lancer-un-grand-plan-de-construc': {
    pour:
      'L\'offre est insuffisante et le parc mal isolé : traiter les deux dans un même plan évite de construire ce qu\'il faudra rénover.',
    contre:
      'L\'annonce ne dit ni combien de logements ni avec quel financement, alors que le blocage est d\'abord foncier et bancaire.',
  },
  'cazeneuve-environnement-creer-une-datar-du-climat-rattac': {
    pour:
      'L\'adaptation demande une vision de long terme que des ministères remaniés tous les deux ans ne peuvent pas porter.',
    contre:
      'Une structure de coordination de plus ne remplace pas les moyens d\'agir, qui restent dans les ministères.',
  },
  'cazeneuve-securite-mettre-en-place-une-police-de-pr': {
    pour:
      'Des policiers connus des habitants recueillent l\'information qui permet d\'anticiper, au lieu d\'intervenir après coup.',
    contre:
      'Ces effectifs seront prélevés sur d\'autres missions, et l\'expérience précédente a été abandonnée faute de résultats mesurés.',
  },
  'cazeneuve-defense-developper-une-reserve-citoyenne': {
    pour:
      'Le lien entre la société et son armée s\'est distendu depuis la fin de la conscription, et la réserve le reconstitue.',
    contre:
      'Une réserve élargie demande des cadres d\'active pour l\'encadrer, prélevés sur des unités déjà très sollicitées.',
  },
  'cazeneuve-institutions-engager-une-revue-systematique-d': {
    pour:
      'L\'inflation normative pèse sur les entreprises comme sur les communes : une règle de compensation force à trancher.',
    contre:
      'Compter les normes ne dit rien de leur utilité : on peut en supprimer deux inoffensives pour en créer une très lourde.',
  },
  'cazeneuve-institutions-introduire-une-dose-de-proportio': {
    pour:
      'Des millions d\'électeurs n\'ont aucun député qui les représente : une part de proportionnelle corrige cette distorsion.',
    contre:
      'La proportionnelle rend les majorités plus difficiles à réunir, au risque de l\'instabilité des républiques précédentes.',
  },
  'cazeneuve-institutions-refonder-la-territorialite-de-la': {
    pour:
      'L\'enchevêtrement des compétences fait qu\'aucun échelon n\'est clairement responsable devant l\'électeur.',
    contre:
      'Chaque réforme territoriale a ajouté une strate au lieu d\'en retirer, et celle-ci ne dit pas laquelle disparaîtrait.',
  },
  'cazeneuve-institutions-reformer-le-processus-decisionne': {
    pour:
      'L\'unanimité permet à un seul État de bloquer les vingt-six autres, notamment en politique étrangère et en fiscalité.',
    contre:
      'Renoncer à l\'unanimité, c\'est accepter d\'être mis en minorité sur des sujets qui touchent à la souveraineté.',
  },

  // --- Bruno Retailleau ------------------------------------------------------
  'retailleau-economie-redonner-au-moins-30-milliards-d': {
    pour:
      'Baisser en même temps le coût du travail et les prélèvements sur les salaires soutient l\'emploi et le pouvoir d\'achat.',
    contre:
      'Trente milliards de recettes en moins doivent être trouvés ailleurs, et la mesure ne dit pas dans quel budget.',
  },
  'retailleau-economie-relever-tres-fortement-le-plafon': {
    pour:
      'Faire circuler l\'épargne des plus âgés vers les jeunes actifs finance logement et création d\'entreprise au bon moment.',
    contre:
      'L\'avantage ne profite qu\'aux familles déjà patrimoniales, et creuse l\'écart avec celles qui n\'ont rien à transmettre.',
  },
  'retailleau-economie-supprimer-toutes-les-cotisations': {
    pour:
      'Au-delà du seuil, chaque heure rapporte nettement plus au salarié sans rien coûter de plus à l\'employeur.',
    contre:
      'Les cotisations financent retraites et assurance maladie : les supprimer sur une part du travail creuse un trou à combler.',
  },
  'retailleau-emploi-encadrer-les-refus-d-offres-rais': {
    pour:
      'L\'assurance chômage est financée par ceux qui travaillent : refuser trois emplois adaptés sans conséquence pose un problème d\'équité.',
    contre:
      'La notion d\'offre raisonnable reste floue, et couper l\'indemnisation peut contraindre à accepter un poste éloigné ou sous-payé.',
  },
  'retailleau-emploi-lever-les-obstacles-au-retour-a-': {
    pour:
      'Certains dispositifs font qu\'un retour à l\'emploi rapporte à peine plus que l\'inactivité : lever ces effets de seuil est un gain net.',
    contre:
      'L\'obstacle principal est souvent la garde d\'enfants ou le transport, que la mesure ne traite pas.',
  },
  'retailleau-emploi-limiter-la-duree-d-indemnisation': {
    pour:
      'Une indemnisation plus courte accélère le retour à l\'emploi, comme l\'ont montré plusieurs réformes menées en Europe.',
    contre:
      'Six mois suffisent rarement après cinquante ans ou dans un bassin sinistré, où la recherche dure bien plus longtemps.',
  },
  'retailleau-emploi-mettre-en-place-une-annualisatio': {
    pour:
      'Beaucoup d\'activités sont saisonnières : lisser sur l\'année évite de licencier en creux et de refuser des commandes en pointe.',
    contre:
      'L\'annualisation transfère l\'imprévisibilité sur le salarié, dont les semaines et les revenus deviennent irréguliers.',
  },
  'retailleau-emploi-rapprocher-le-systeme-d-assuranc': {
    pour:
      'Le régime français est parmi les plus longs d\'Europe en durée d\'indemnisation : converger réduirait son déficit.',
    contre:
      'Comparer les seules durées ignore les écarts de salaire, de coût du logement et de protection entre pays.',
  },
  'retailleau-solidarites-accompagner-les-six-premiers-moi': {
    pour:
      'Le lien qui se noue les premiers mois conditionne la suite, et beaucoup de parents reprennent le travail sans y être préparés.',
    contre:
      'La mesure reste imprécise sur le contenu de cet accompagnement, sur ses moyens et sur qui l\'assurerait.',
  },
  'retailleau-solidarites-creer-un-revenu-d-incitation-a-l': {
    pour:
      'Trois aides distinctes créent des seuils où reprendre un travail fait perdre plus qu\'il ne rapporte : une allocation unique les supprime.',
    contre:
      'Fusionner trois dispositifs aux règles différentes fait toujours des perdants, rarement identifiés avant la réforme.',
  },
  'retailleau-solidarites-exclure-de-l-apl-les-etudiants-i': {
    pour:
      'Une aide au logement versée à des étudiants dont les parents sont parmi les plus aisés manque sa cible.',
    contre:
      'Cette aide ignore les revenus des parents parce que l\'étudiant est un foyer distinct : y revenir prolonge la dépendance familiale.',
  },
  'retailleau-solidarites-fusionner-12-dispositifs-d-aide-': {
    pour:
      'Douze dispositifs se recoupent et personne ne sait à quoi il a droit : un montant unique dès le premier enfant est lisible.',
    contre:
      'Un montant identique pour tous supprime la modulation selon les revenus, au détriment des familles les plus modestes.',
  },
  'retailleau-education-doubler-le-nombre-d-ingenieurs-s': {
    pour:
      'Le pays forme trop peu d\'ingénieurs dans ces domaines, et les entreprises recrutent à l\'étranger faute de candidats.',
    contre:
      'Doubler les diplômés suppose des enseignants-chercheurs qu\'on ne forme pas en cinq ans, et une demande qui suive.',
  },
  'retailleau-numerique-doubler-le-nombre-d-ingenieurs-s': {
    pour:
      'Les entreprises recrutent à l\'étranger faute de candidats formés ici dans ces spécialités.',
    contre:
      'Doubler les diplômés suppose des enseignants-chercheurs qu\'on ne forme pas en cinq ans, et une demande qui suive.',
  },
  'retailleau-logement-remettre-la-france-sur-une-traje': {
    pour:
      'La production est tombée bien en dessous des besoins, ce qui nourrit la hausse des prix et l\'allongement des files d\'attente.',
    contre:
      'Fixer un chiffre ne lève aucun des obstacles réels : coût du foncier, taux d\'intérêt, refus de permis.',
  },
  'retailleau-logement-rendre-aux-maires-la-liberte-de-': {
    pour:
      'Un maire qui accueille des logements en supporte le coût sans recette en face : lui rendre une part de la TVA change ce calcul.',
    contre:
      'Intéresser financièrement à la construction encourage l\'étalement là où le foncier est le moins cher, donc le plus éloigné.',
  },
  'retailleau-logement-retablir-la-rotation-dans-le-par': {
    pour:
      'Des logements sociaux restent occupés par des ménages dont les revenus ont beaucoup augmenté, pendant que d\'autres attendent des années.',
    contre:
      'Obliger à partir déracine des familles installées, et le parc privé n\'offre pas d\'alternative abordable pour les reloger.',
  },
  'retailleau-logement-supprimer-les-interdictions-de-l': {
    pour:
      'Interdire la location des logements mal notés retire du marché des biens que rien ne remplace, surtout en zone tendue.',
    contre:
      'Ces logements coûtent cher à chauffer et deviennent invivables l\'été : l\'interdiction protège d\'abord les locataires.',
  },
  'retailleau-environnement-abroger-le-volet-electricite-de-': {
    pour:
      'La programmation actuelle impose un rythme de renouvelables jugé coûteux et déconnecté des besoins réels du réseau.',
    contre:
      'Abroger sans remplacer laisse la filière sans visibilité et bloque des investissements déjà engagés.',
  },
  'retailleau-environnement-consolider-le-parc-nucleaire-en-': {
    pour:
      'Le nucléaire fournit une électricité pilotable et décarbonée : les chantiers lancés doivent aboutir sans nouvelle dérive.',
    contre:
      'Les chantiers récents ont connu des retards et des surcoûts considérables : reproduire le modèle expose au même risque.',
  },
  'retailleau-environnement-inscrire-les-reacteurs-nucleaire': {
    pour:
      'Prolonger un réacteur existant coûte bien moins cher que d\'en construire un neuf, si la sûreté le permet.',
    contre:
      'Aucun réacteur au monde n\'a fonctionné aussi longtemps : la trajectoire est fixée avant la démonstration de sûreté.',
  },
  'retailleau-environnement-proteger-le-parc-nucleaire-des-a': {
    pour:
      'Les arrêts imprévus obligent à importer une électricité plus chère et plus carbonée.',
    contre:
      'La disponibilité dépend d\'abord de l\'état du parc et de la maintenance, que la mesure ne détaille pas.',
  },
  'retailleau-agriculture-autoriser-l-usage-de-neonicotino': {
    pour:
      'Interdire en France ce qui est autorisé chez les voisins fait perdre des marchés sans réduire l\'usage à l\'échelle européenne.',
    contre:
      'Ces substances sont mises en cause dans l\'effondrement des pollinisateurs, dont dépend une partie des cultures.',
  },
  'retailleau-agriculture-garantir-une-concurrence-effecti': {
    pour:
      'Le rapport de force est déséquilibré entre des centaines de milliers de producteurs et quelques centrales d\'achat.',
    contre:
      'Le contrôle de la concurrence existe déjà : sans moyens supplémentaires, un renforcement resterait théorique.',
  },
  'retailleau-agriculture-generaliser-un-mecanisme-de-diss': {
    pour:
      'Le prix des terres est devenu inaccessible : séparer le foncier de l\'exploitation permet de s\'installer sans tout acheter.',
    contre:
      'Dissocier fait entrer des investisseurs dans le foncier agricole, avec le risque d\'y voir un placement plutôt qu\'un métier.',
  },
  'retailleau-agriculture-reconnaitre-les-projets-de-stock': {
    pour:
      'Les sécheresses se répètent : stocker l\'eau de l\'hiver sécurise les récoltes de l\'été.',
    contre:
      'Ce statut permet de passer outre des protections environnementales, et prélever en amont assèche les milieux en aval.',
  },
  'retailleau-securite-autoriser-la-vision-par-ordinate': {
    pour:
      'Analyser automatiquement les images permet de repérer un comportement dangereux là où aucun opérateur ne peut tout regarder.',
    contre:
      'La frontière avec la reconnaissance faciale est technique et mouvante : l\'exclure par principe ne l\'empêche pas en pratique.',
  },
  'retailleau-immigration-conditionner-le-benefice-plein-d': {
    pour:
      'Lier l\'accès aux aides à une durée de résidence et de travail rapproche les droits ouverts de la contribution versée.',
    contre:
      'Retarder l\'accès aux aides familiales touche d\'abord des enfants, qui n\'ont aucune part dans la situation de leurs parents.',
  },
  'retailleau-defense-multiplier-par-cinq-les-moyens-c': {
    pour:
      'Les conflits récents montrent que drones et guerre électronique décident autant que les blindés.',
    contre:
      'Multiplier le budget par cinq suppose une base industrielle et des ingénieurs qui restent à constituer.',
  },
  'retailleau-institutions-ne-pas-remplacer-125-000-departs': {
    pour:
      'La masse salariale publique est le premier poste de dépense : ne pas remplacer une partie des départs la réduit sans licencier.',
    contre:
      'Les départs ne surviennent pas là où les effectifs sont excédentaires, et le redéploiement suppose des compétences transférables.',
  },

  // --- Dominique de Villepin -------------------------------------------------
  'villepin-economie-augmenter-les-impots-pour-que-le': {
    pour:
      'Un impôt unique remplace un empilement illisible, et la part environnementale fait payer ce qui abîme plutôt que ce qui produit.',
    contre:
      'Taxer le patrimoine plutôt que le revenu frappe des biens qui ne rapportent rien, et pousse les capitaux à sortir du pays.',
  },
  'villepin-economie-renforcer-la-souverainete-indust': {
    pour:
      'Des normes communes évitent aux entreprises de refaire vingt-sept fois les mêmes démarches, et créent un marché à leur taille.',
    contre:
      'Harmoniser demande des années de négociation, et l\'alignement se fait parfois sur les exigences des pays les moins-disants.',
  },
  'villepin-economie-simplifier-radicalement-le-syste': {
    pour:
      'Un système à neuf impôts serait compréhensible sans expert, et supprimerait des taxes qui coûtent plus à collecter qu\'elles ne rapportent.',
    contre:
      'Chaque impôt supprimé a ses bénéficiaires : regrouper fait mécaniquement des perdants, rarement annoncés à l\'avance.',
  },
  'villepin-emploi-conditionner-les-exonerations-de': {
    pour:
      'Des dizaines de milliards d\'exonérations sont versées sans contrepartie vérifiable : les conditionner rend cet argent traçable.',
    contre:
      'Ajouter des conditions alourdit les démarches des petites entreprises, qui n\'ont pas de service dédié pour les remplir.',
  },
  'villepin-emploi-faire-de-l-insertion-professionn': {
    pour:
      'Le chômage des jeunes reste très supérieur à la moyenne, et l\'accès aux stages dépend encore du carnet d\'adresses familial.',
    contre:
      'Faire d\'un public la priorité absolue en déclasse d\'autres, notamment les seniors, déjà les plus longs à retrouver un emploi.',
  },
  'villepin-emploi-instaurer-un-28e-regime-fonde-su': {
    pour:
      'Une entreprise présente dans plusieurs pays n\'aurait plus à s\'adapter à vingt-sept droits du travail différents.',
    contre:
      'Un régime parallèle risque d\'être choisi pour ce qu\'il permet d\'éviter, et de vider les règles nationales de leur portée.',
  },
  'villepin-retraites-lancer-une-reforme-des-retraites': {
    pour:
      'La dernière réforme a été adoptée sans vote, laissant une plaie ouverte : la délibération lui donnerait la légitimité qui manque.',
    contre:
      'Empiler quatre étapes en dix-huit mois est très optimiste, et un référendum peut rejeter sans dessiner d\'alternative.',
  },
  'villepin-solidarites-creer-un-guichet-unique-numeriqu': {
    pour:
      'Une part importante des aides n\'est jamais réclamée faute de savoir qu\'elles existent : les réunir en un point les rend visibles.',
    contre:
      'Tout faire passer par un compte en ligne écarte ceux qui en sont le plus éloignés, souvent ceux qui en ont le plus besoin.',
  },
  'villepin-solidarites-garantir-un-revenu-mensuel-minim': {
    pour:
      'Un artiste qui débute alterne petits cachets et périodes sans rien : un complément automatique stabilise sans assister.',
    contre:
      'Définir qui est un artiste en émergence relève de l\'arbitraire, et le dispositif peut se prolonger sans terme.',
  },
  'villepin-solidarites-instaurer-un-droit-au-repit-pour': {
    pour:
      'Les canicules tuent d\'abord les personnes isolées et âgées : garantir un lieu frais quelques heures est une mesure simple.',
    contre:
      'Cela suppose que chaque commune dispose d\'un local climatisé et de personnel pour l\'ouvrir, ce que beaucoup n\'ont pas.',
  },
  'villepin-sante-creer-un-conseil-scientifique-de': {
    pour:
      'La dernière crise sanitaire a montré qu\'aucune instance permanente n\'était chargée d\'anticiper ni de préparer le pays.',
    contre:
      'Des agences sanitaires existent déjà : en créer une nouvelle ajoute un avis de plus sans clarifier qui décide.',
  },
  'villepin-sante-lancer-une-grande-campagne-d-inf': {
    pour:
      'La surmortalité pendant les canicules frappe davantage les femmes âgées, sans que ce risque soit connu du public.',
    contre:
      'Une campagne d\'information ne remplace pas des logements rafraîchis, qui est la réponse au fond du problème.',
  },
  'villepin-education-financer-la-politique-culturelle': {
    pour:
      'Les plateformes tirent une part de leur audience de contenus culturels sans contribuer à leur financement.',
    contre:
      'Étendre la contribution aux réseaux sociaux se heurte au droit européen, et le coût finit répercuté sur les abonnés.',
  },
  'villepin-education-garantir-l-acces-universel-a-la-': {
    pour:
      'L\'accès à la culture reste très inégal selon le territoire et le revenu, et l\'écart se creuse dès le plus jeune âge.',
    contre:
      'L\'intention est large mais la mesure ne dit ni par quels moyens ni avec quel budget elle deviendrait effective.',
  },
  'villepin-education-supprimer-l-utilisation-de-l-alg': {
    pour:
      'L\'opacité du classement nourrit un sentiment d\'arbitraire chez des familles qui ne comprennent pas les refus reçus.',
    contre:
      'Sans outil de tri, il faut un autre moyen de départager des candidatures plus nombreuses que les places offertes.',
  },
  'villepin-numerique-instaurer-une-regle-imperative-s': {
    pour:
      'Une décision automatisée sans responsable identifié laisse la personne concernée sans interlocuteur ni recours.',
    contre:
      'Exiger un contrôle humain permanent est inapplicable aux systèmes qui traitent des millions d\'opérations par jour.',
  },
  'villepin-numerique-mobiliser-des-centaines-de-milli': {
    pour:
      'Sans capacité de calcul propre, l\'Europe dépend d\'infrastructures étrangères pour ses données les plus sensibles.',
    contre:
      'Des centaines de milliards levés par emprunt européen supposent un accord des États, loin d\'être acquis.',
  },
  'villepin-logement-lancer-un-plan-historique-cible-': {
    pour:
      'Cibler les ménages modestes agit là où la facture pèse le plus lourd, et où le reste à charge empêche les travaux.',
    contre:
      'Les rénovations complètes butent sur le manque d\'artisans qualifiés, que le financement ne crée pas.',
  },
  'villepin-logement-soumettre-toute-decision-d-infra': {
    pour:
      'Réparer ou densifier coûte moins cher et consomme moins de sol que construire du neuf plus loin.',
    contre:
      'Un examen préalable systématique allonge des projets parfois indispensables, comme une ligne ferroviaire ou un hôpital.',
  },
  'villepin-environnement-generaliser-l-ecoconception-logi': {
    pour:
      'Le numérique consomme une part croissante de l\'électricité, sans que personne ne mesure ce que chaque service coûte.',
    contre:
      'Imposer des indicateurs à tous les éditeurs est une charge lourde pour un gain énergétique difficile à établir.',
  },
  'villepin-environnement-mettre-en-place-un-plan-d-adapta': {
    pour:
      'Ces territoires subissent cyclones, montée des eaux et épidémies plus tôt et plus fort que le reste du pays.',
    contre:
      'Un plan spécifique ne vaut que par ses moyens, dont la mesure ne dit rien.',
  },
  'villepin-environnement-prendre-des-mesures-de-coupes-pr': {
    pour:
      'Les grands incendies se propagent par une végétation continue : la couper est le moyen le plus direct de les arrêter.',
    contre:
      'Le débroussaillage est déjà obligatoire et peu appliqué faute de contrôle : ajouter une mesure ne change pas cela.',
  },
  'villepin-agriculture-etablir-un-contrat-d-objectifs-p': {
    pour:
      'La filière bio décroche faute de débouchés stables, après avoir été encouragée à se développer.',
    contre:
      'Soutenir une filière dont la demande recule revient à financer une production qui ne trouve pas preneur.',
  },
  'villepin-agriculture-instaurer-un-conseil-independant': {
    pour:
      'Le conseil agricole est souvent assuré par ceux qui vendent les produits de traitement, ce qui crée un conflit d\'intérêts.',
    contre:
      'Créer une structure de conseil supplémentaire ajoute un interlocuteur sans garantir un changement de pratiques.',
  },
  'villepin-defense-engager-une-negociation-verifiab': {
    pour:
      'Les traités de désarmement expirent les uns après les autres sans être renouvelés : relancer la discussion est urgent.',
    contre:
      'Négocier suppose des partenaires disposés à le faire, ce que le contexte international ne laisse guère espérer.',
  },
  'villepin-defense-exiger-l-ouverture-immediate-de-': {
    pour:
      'Le droit humanitaire s\'impose à tous, et conditionner un soutien est l\'un des rares leviers dont dispose la diplomatie.',
    contre:
      'Conditionner un soutien réduit l\'influence sur les décisions, sans garantir pour autant l\'ouverture des accès humanitaires.',
  },
  'villepin-defense-soutenir-fermement-l-initiative-': {
    pour:
      'Un cessez-le-feu est la condition préalable à toute aide humanitaire comme à la libération des otages.',
    contre:
      'Une position de principe pèse peu sans levier concret sur les parties au conflit.',
  },
  'villepin-institutions-etablir-une-loi-cadre-souple-ada': {
    pour:
      'Les collectivités passent un temps considérable à démêler qui est compétent : un cadre unique simplifie la coopération.',
    contre:
      'Une loi-cadre volontairement souple laisse la répartition floue, ce qui est précisément le problème qu\'elle prétend résoudre.',
  },
  'villepin-institutions-instaurer-un-conseil-de-souverai': {
    pour:
      'Les crises récentes ont montré l\'absence d\'une instance capable d\'anticiper et de coordonner face aux menaces hybrides.',
    contre:
      'Un conseil doté d\'un pouvoir de sanction placé auprès du Président échappe largement au contrôle du Parlement.',
  },
  'villepin-institutions-redefinir-les-communes-comme-bas': {
    pour:
      'Les habitants s\'adressent d\'abord à leur mairie : lui donner les compétences correspondantes rapproche la décision du terrain.',
    contre:
      'L\'emploi et la sécurité demandent des moyens qu\'une commune moyenne n\'a pas, ce qui creuserait les écarts entre territoires.',
  },

  // --- Édouard Philippe ------------------------------------------------------
  'philippe-economie-conclure-un-pacte-fiscal-avec-le': {
    pour:
      'Les impôts de production frappent l\'entreprise avant tout bénéfice. Les échanger contre des aides mal ciblées simplifie le circuit.',
    contre:
      'Les aides supprimées soutiennent aussi des activités fragiles, et rien ne garantit que les deux montants se compensent.',
  },
  'philippe-economie-ramener-le-deficit-public-de-plu': {
    pour:
      'Réduire le déficit redonne des marges pour la prochaine crise et allège la charge des intérêts, devenue un des premiers postes.',
    contre:
      'Un tel effort en cinq ans suppose des coupes ou des hausses d\'impôts dont la mesure ne dit rien.',
  },
  'philippe-economie-reorganiser-massivement-l-etat-e': {
    pour:
      'L\'empilement d\'agences produit des doublons et dilue les responsabilités : regrouper clarifie qui décide et qui rend des comptes.',
    contre:
      'Privatiser un opérateur déplace le contrôle hors de l\'État, et les économies annoncées sont rarement au rendez-vous.',
  },
  'philippe-emploi-adapter-l-enseignement-le-recrut': {
    pour:
      'Les métiers menacés par l\'automatisation sont identifiables à l\'avance : former avant la suppression coûte moins que d\'indemniser après.',
    contre:
      'Personne ne sait quels métiers seront réellement supprimés, et un droit à la reconversion sans emploi à la clé reste une promesse.',
  },
  'philippe-emploi-reequilibrer-le-financement-du-m': {
    pour:
      'Faire reposer la protection sociale sur les seuls salaires renchérit le travail : élargir l\'assiette augmente le net sans baisser les droits.',
    contre:
      'Déplacer le financement vers l\'impôt ou la consommation fait payer les ménages autrement, y compris les plus modestes.',
  },
  'philippe-retraites-confier-aux-partenaires-sociaux-': {
    pour:
      'Ceux qui cotisent sont les mieux placés pour arbitrer, et le sujet cesserait d\'être un enjeu de campagne tous les cinq ans.',
    contre:
      'C\'est leur déléguer des décisions impopulaires que l\'État devrait de toute façon reprendre en cas de blocage.',
  },
  'philippe-retraites-creer-un-pilier-de-capitalisatio': {
    pour:
      'Un complément par capitalisation réduit la dépendance au seul rapport entre actifs et retraités, qui se dégrade.',
    contre:
      'La capitalisation expose les pensions aux marchés, et la transition fait cotiser deux fois la génération qui la met en place.',
  },
  'philippe-retraites-travailler-plus-pour-garantir-l-': {
    pour:
      'Avec l\'allongement de la vie, la durée de cotisation n\'a pas suivi : travailler plus longtemps est le levier le plus direct.',
    contre:
      'Tous les métiers ne permettent pas de tenir jusqu\'au bout, et beaucoup sont déjà sans emploi avant l\'âge légal.',
  },
  'philippe-solidarites-accorder-une-part-fiscale-des-le': {
    pour:
      'Le deuxième enfant coûte autant que le troisième, mais la fiscalité ne reconnaît cette charge qu\'à partir du troisième.',
    contre:
      'Le quotient familial profite surtout aux foyers les plus imposés : l\'étendre creuse cet avantage.',
  },
  'philippe-solidarites-creer-le-temps-partiel-parental-': {
    pour:
      'La reprise après un congé parental est le moment où beaucoup de mères quittent l\'emploi : un palier facilite le retour.',
    contre:
      'Deux mois payés au-delà du travail effectué ont un coût que la mesure ne chiffre pas, et qui pèse sur l\'employeur ou la branche famille.',
  },
  'philippe-solidarites-creer-une-aide-financiere-unique': {
    pour:
      'L\'empilement actuel est illisible : beaucoup ignorent leurs droits, et le non-recours atteint des niveaux élevés.',
    contre:
      'Universelle signifie versée aussi aux foyers aisés : à budget constant, cela réduit ce que touchent les plus modestes.',
  },
  'philippe-sante-stabiliser-les-depenses-de-sante': {
    pour:
      'Les dépenses augmentent plus vite que la richesse produite : sans réorganisation, le système devient insoutenable.',
    contre:
      'Stabiliser le budget dans un pays qui vieillit revient à réduire les moyens par patient, alors que l\'hôpital est déjà tendu.',
  },
  'philippe-education-concentrer-l-enseignement-primai': {
    pour:
      'Les évaluations montrent un recul en lecture et en calcul ; sans ces bases, aucun autre apprentissage ne tient.',
    contre:
      'Recentrer se fait au détriment des sciences, des arts et du sport, qui donnent aussi le goût d\'apprendre.',
  },
  'philippe-education-creer-un-service-public-universe': {
    pour:
      'Le soutien scolaire privé coûte cher et creuse les écarts : le rendre gratuit rétablit une égalité réelle.',
    contre:
      'Un service public reposant sur des bénévoles devient inégal selon les territoires, et l\'IA ne remplace pas un enseignant.',
  },
  'philippe-education-faire-des-chefs-d-etablissement-': {
    pour:
      'Un chef d\'établissement qui choisit son équipe peut porter un projet cohérent, comme dans les réseaux qui réussissent.',
    contre:
      'Le recrutement local ouvre la porte à l\'arbitraire et creuserait l\'écart entre établissements attractifs et les autres.',
  },
  'philippe-numerique-developper-une-infrastructure-d-': {
    pour:
      'La capacité de calcul est devenue un facteur de production : en manquer, c\'est dépendre de fournisseurs extérieurs.',
    contre:
      'Ces infrastructures consomment énormément d\'électricité et d\'eau, ce que la mesure n\'aborde pas.',
  },
  'philippe-numerique-peser-a-l-echelle-europeenne-ave': {
    pour:
      'Acheter groupé donne aux États un pouvoir de négociation qu\'aucun d\'eux n\'a seul face aux grands fournisseurs.',
    contre:
      'La préférence européenne peut priver les administrations des meilleurs outils quand aucun équivalent n\'existe.',
  },
  'philippe-numerique-simplifier-le-cadre-juridique-eu': {
    pour:
      'Un cadre trop complexe pénalise surtout les jeunes entreprises, qui n\'ont pas de service juridique pour s\'y retrouver.',
    contre:
      'Simplifier une régulation à peine adoptée revient souvent à l\'affaiblir avant d\'avoir mesuré ses effets.',
  },
  'philippe-logement-faciliter-le-demenagement-des-fa': {
    pour:
      'Une famille qui s\'agrandit reste souvent bloquée dans un logement trop petit, faute d\'apport pour déménager.',
    contre:
      'Solvabiliser la demande sans augmenter l\'offre alimente surtout la hausse des prix.',
  },
  'philippe-environnement-assurer-notre-souverainete-energ': {
    pour:
      'Combiner les deux sources et électrifier les usages réduit à la fois les émissions et la dépendance aux importations.',
    contre:
      'Mener les deux fronts de front disperse des moyens financiers et industriels qui sont limités.',
  },
  'philippe-environnement-doubler-le-montant-du-fonds-vert': {
    pour:
      'Écoles et maisons de retraite deviennent invivables l\'été : les rafraîchir relève de l\'urgence sanitaire.',
    contre:
      'Recentrer le fonds sur la climatisation le détourne de la réduction des émissions, que la climatisation augmente.',
  },
  'philippe-environnement-instaurer-un-prix-du-carbone-aux': {
    pour:
      'Sans ce mécanisme, décarboner en Europe revient à faire produire ailleurs, avec plus d\'émissions et moins d\'emplois.',
    contre:
      'Il renchérit les importations pour le consommateur et expose à des mesures de rétorsion commerciales.',
  },
  'philippe-agriculture-creer-100-territoires-de-souvera': {
    pour:
      'Appliquer des règles plus strictes que les voisins pénalise les producteurs sans bénéfice sanitaire démontré.',
    contre:
      'Ces règles protègent parfois la santé ou l\'environnement : les supprimer en bloc revient à y renoncer sans examen.',
  },
  'philippe-agriculture-lancer-un-grand-plan-de-transmis': {
    pour:
      'La moitié des agriculteurs partira à la retraite dans dix ans, sans repreneur identifié pour beaucoup d\'exploitations.',
    contre:
      'Le plan reste une annonce : ni son financement ni les leviers de transmission ne sont précisés.',
  },
  'philippe-securite-donner-aux-maires-un-pouvoir-de-': {
    pour:
      'Les petites infractions ne sont presque jamais poursuivies : le maire est le mieux placé pour y répondre vite.',
    contre:
      'Confier une sanction pénale à un élu confond l\'exécutif local et le juge, sans les garanties d\'un procès.',
  },
  'philippe-securite-renforcer-l-autorite-du-garde-de': {
    pour:
      'Le ministre est responsable de la politique pénale devant le Parlement : il doit pouvoir la faire appliquer.',
    contre:
      'Les instructions individuelles ont été supprimées précisément parce qu\'elles permettaient de peser sur des affaires particulières.',
  },
  'philippe-immigration-denoncer-l-accord-de-1968-avec-l': {
    pour:
      'Cet accord crée un régime dérogatoire au droit commun, que les gouvernements successifs n\'ont pas réussi à renégocier.',
    contre:
      'Une dénonciation unilatérale dégraderait des relations dont dépendent la coopération sécuritaire et les laissez-passer consulaires.',
  },
  'philippe-immigration-mettre-en-place-une-veritable-po': {
    pour:
      'Sans maîtrise de la langue ni accès à l\'emploi, l\'intégration échoue quelles que soient les intentions affichées.',
    contre:
      'L\'énoncé ne décrit aucun dispositif, alors que les moyens des cours de français ont baissé ces dernières années.',
  },
  'philippe-defense-massifier-notre-production-et-no': {
    pour:
      'Les drones bon marché ont changé la nature des combats, et les armées européennes en produisent beaucoup trop peu.',
    contre:
      'Transposer un programme conçu pour une autre échelle industrielle expose à commander sans capacité de produire.',
  },
  'philippe-defense-porter-le-nombre-de-reservistes-': {
    pour:
      'Une réserve nombreuse est ce qui permet de tenir dans la durée en cas d\'engagement majeur.',
    contre:
      'Multiplier par cinq suppose équipement, encadrement et disponibilité des employeurs : aucun des trois n\'est réglé.',
  },

  // --- François Ruffin -------------------------------------------------------
  'ruffin-economie-la-france-pourra-nationaliser-ce': {
    pour:
      'Certaines technologies critiques ne doivent pas dépendre d\'un acheteur étranger, et l\'État est seul à pouvoir bloquer une vente.',
    contre:
      'Racheter coûte cher, et l\'État actionnaire n\'a pas toujours fait la preuve d\'une meilleure gestion industrielle.',
  },
  'ruffin-economie-realiser-20-millions-d-euros-d-e': {
    pour:
      'L\'exemplarité au sommet conditionne l\'acceptation des efforts demandés au reste du pays.',
    contre:
      'Vingt millions ne pèsent rien sur un budget de l\'État qui se compte en centaines de milliards : le geste est symbolique.',
  },
  'ruffin-economie-rendre-publics-les-montants-vers': {
    pour:
      'Publier les montants permet de vérifier ce que l\'État achète et à qui, ce qui suffit souvent à faire reculer les excès.',
    contre:
      'La transparence ne réduit pas le recours en elle-même, et certaines missions sensibles supportent mal une publication intégrale.',
  },
  'ruffin-economie-un-systeme-d-alerte-sera-mis-en-': {
    pour:
      'Les entreprises repèrent les tentatives d\'influence avant l\'État : leur ouvrir un canal officiel accélère la réaction.',
    contre:
      'Un dispositif de signalement peut servir à dénoncer un concurrent, et suppose un tri qui mobilise des moyens.',
  },
  'ruffin-emploi-deployer-un-plan-de-formation-na': {
    pour:
      'Ces métiers offrent peu de perspectives : la formation est ce qui permet d\'y faire carrière plutôt que d\'y rester bloqué.',
    contre:
      'La formation ne crée pas les postes qualifiés vers lesquels évoluer, et bute sur des horaires déjà fragmentés.',
  },
  'ruffin-emploi-instaurer-une-remuneration-doubl': {
    pour:
      'Les horaires décalés abîment la santé et la vie familiale : les payer davantage en fait un choix plutôt qu\'une contrainte subie.',
    contre:
      'Le surcoût pousse à réduire ces plages horaires, donc les heures et le revenu de ceux qui en dépendent.',
  },
  'ruffin-emploi-mieux-remunerer-les-travailleuse': {
    pour:
      'Ces métiers ne peuvent être ni automatisés ni délocalisés, et peinent à recruter faute de salaires suffisants.',
    contre:
      'Beaucoup dépendent de financements publics : la revalorisation suppose un budget que la mesure ne chiffre pas.',
  },
  'ruffin-emploi-systematiser-la-remuneration-for': {
    pour:
      'Une journée coupée immobilise le salarié sans le payer : la compenser décourage les plannings à trous.',
    contre:
      'Certaines activités ont une charge concentrée matin et soir ; renchérir la coupure peut supprimer ces postes.',
  },
  'ruffin-retraites-reconnaitre-la-penibilite-des-me': {
    pour:
      'Ces métiers cumulent horaires décalés, port de charges et bas salaires, sans que rien n\'en tienne compte au moment de la retraite.',
    contre:
      'Élargir les trimestres accordés creuse le déficit du régime, sans que la mesure dise comment le financer.',
  },
  'ruffin-solidarites-elargir-le-pass-culture-aux-adul': {
    pour:
      'L\'isolement et la précarité éloignent durablement de toute pratique culturelle, et rien n\'existe pour les adultes.',
    contre:
      'Le dispositif pour les jeunes a surtout servi à acheter des biens : l\'étendre sans le corriger reproduirait ce travers.',
  },
  'ruffin-solidarites-garantir-l-acces-de-toutes-et-to': {
    pour:
      'Le coût d\'une licence écarte des familles entières, alors que le sport reste un des rares lieux de mixité.',
    contre:
      'Prendre en charge la moitié des licences et financer des postes d\'animateurs suppose un budget que la mesure ne précise pas.',
  },
  'ruffin-solidarites-simplifier-l-acces-aux-aides-pou': {
    pour:
      'Prévenir automatiquement ceux qui y ont droit est le seul moyen réellement efficace contre le non-recours.',
    contre:
      'Croiser les fichiers pour détecter les droits concentre des données personnelles sensibles.',
  },
  'ruffin-education-creer-une-route-des-metiers-d-ar': {
    pour:
      'Ces savoir-faire sont un patrimoine vivant, et un tourisme de proximité fait vivre des territoires délaissés.',
    contre:
      'Le dispositif reste marginal face aux difficultés de transmission, qui tiennent d\'abord au manque de formation.',
  },
  'ruffin-education-garantir-a-chaque-enfant-francai': {
    pour:
      'Un enfant sur trois ne part jamais en vacances : le départ automatique supprime la barrière de la démarche à accomplir.',
    contre:
      'Financer un séjour pour toute une classe d\'âge représente un budget considérable, sans effet mesuré sur la scolarité.',
  },
  'ruffin-education-mettre-en-place-une-politique-am': {
    pour:
      'Ces emplois s\'exercent sur place et ne peuvent pas partir ailleurs, contrairement à ceux de l\'industrie.',
    contre:
      'Le secteur dépend fortement de la subvention : les emplois créés durent le temps du financement public.',
  },
  'ruffin-education-transformer-la-plateforme-du-pas': {
    pour:
      'Le dispositif actuel profite surtout aux grandes plateformes et à l\'achat de biens, pas à la pratique artistique.',
    contre:
      'Restreindre les usages réduit la liberté de choix des jeunes, qui est précisément ce qui a fait le succès du dispositif.',
  },
  'ruffin-logement-affirmer-la-vocation-sociale-du-': {
    pour:
      'Cette contribution a été créée pour loger les salariés : la recentrer sur ceux qui en ont le plus besoin renoue avec son objet.',
    contre:
      'Réserver ce financement à une catégorie de salariés en prive d\'autres, tout aussi mal logés.',
  },
  'ruffin-logement-garantir-par-la-loi-le-maintien-': {
    pour:
      'Les villages de vacances associatifs disparaissent, et avec eux la possibilité de partir pour les familles modestes.',
    contre:
      'Conditionner les aides à des tarifs modérés peut décourager les opérateurs et réduire l\'offre au lieu de la maintenir.',
  },
  'ruffin-logement-garantir-un-droit-au-logement-ab': {
    pour:
      'Les métiers essentiels s\'exercent là où les loyers sont les plus élevés : leurs salariés sont repoussés toujours plus loin.',
    contre:
      'Un droit sans logements supplémentaires ne fait que déplacer la file d\'attente entre catégories de demandeurs.',
  },
  'ruffin-logement-permettre-aux-travailleuses-et-t': {
    pour:
      'Deux heures de transport par jour usent la santé et désorganisent la vie familiale de ceux dont la ville dépend.',
    contre:
      'Cela suppose un parc dédié en centre-ville, là où le foncier est justement le plus rare et le plus cher.',
  },
  'ruffin-transports-baisser-les-tarifs-des-peages-en': {
    pour:
      'Les concessions arrivent à échéance et ont rapporté bien plus que prévu : les reprendre permettrait de baisser les tarifs.',
    contre:
      'L\'État devrait alors financer l\'entretien du réseau, aujourd\'hui à la charge des concessionnaires.',
  },
  'ruffin-transports-mettre-en-place-un-billet-popula': {
    pour:
      'Un tarif unique et lisible remplit des trains qui roulent à moitié vides l\'été et rend le train accessible.',
    contre:
      'Le coût retombe sur les régions, qui financent déjà le TER, et les lignes saturées ne peuvent pas absorber la demande.',
  },
  'ruffin-transports-plafonner-le-prix-des-billets-d-': {
    pour:
      'Le prix des billets rend le lien avec l\'hexagone inaccessible à une part des habitants, sans alternative possible.',
    contre:
      'Un plafond sans compensation pousse les compagnies à réduire les fréquences sur des lignes déjà peu rentables.',
  },
  'ruffin-securite-interdire-toute-intervention-des': {
    pour:
      'Un magistrat dont l\'avancement dépend du pouvoir ne peut pas enquêter librement sur ce pouvoir.',
    contre:
      'Couper tout lien pose la question du contrôle démocratique d\'un corps qui ne rendrait alors de comptes à personne.',
  },
  'ruffin-securite-limiter-l-usage-de-la-convention': {
    pour:
      'Cette convention permet à de grandes entreprises de payer pour éviter un procès, ce qu\'aucun particulier ne peut faire.',
    contre:
      'Elle a permis de recouvrer des sommes considérables que des procès longs et incertains n\'auraient pas rapportées.',
  },
  'ruffin-securite-renforcer-l-independance-du-parq': {
    pour:
      'Tant que le gouvernement nomme les procureurs, le soupçon d\'intervention politique pèse sur chaque affaire sensible.',
    contre:
      'Un parquet sans lien avec l\'exécutif conduit une politique pénale sans mandat électif ni contrôle.',
  },
  'ruffin-securite-supprimer-la-convention-judiciai': {
    pour:
      'Supprimer ce mécanisme rétablit une justice identique pour tous, sans transaction négociée à l\'abri d\'un procès.',
    contre:
      'Sans elle, ces affaires très techniques aboutissent rarement : l\'État perd le procès et les sommes qu\'il récupérait.',
  },
  'ruffin-institutions-faire-de-la-probite-une-priorite': {
    pour:
      'La défiance envers les responsables publics nourrit l\'abstention : la probité conditionne tout le reste.',
    contre:
      'L\'affirmation reste générale et ne décrit aucun mécanisme : rien n\'y est vérifiable ni opposable.',
  },
  'ruffin-institutions-mettre-en-place-un-systeme-de-co': {
    pour:
      'Les groupes d\'intérêt disposent d\'un accès permanent aux décideurs que les citoyens n\'ont pas : la consultation rétablit un équilibre.',
    contre:
      'Consulter systématiquement allonge chaque décision, et ce sont les groupes les mieux organisés qui répondent le plus.',
  },
  'ruffin-institutions-soumettre-la-decision-du-ministr': {
    pour:
      'Des décisions industrielles majeures se prennent aujourd\'hui sans que le Parlement en soit seulement saisi.',
    contre:
      'Un avis préalable ralentit des décisions parfois urgentes, notamment face à une offre de rachat hostile.',
  },

  // --- Gabriel Attal ---------------------------------------------------------
  'attal-economie-lancer-le-plan-france-2050-a-hau': {
    pour:
      'Concentrer l\'effort sur dix domaines évite le saupoudrage qui a dispersé les plans d\'investissement précédents.',
    contre:
      'Choisir dix priorités aujourd\'hui, c\'est parier sur des technologies qui peuvent être dépassées avant la fin du plan.',
  },
  'attal-economie-passer-la-tva-sur-les-vehicules-': {
    pour:
      'Une TVA réduite baisse le prix affiché pour tout le monde, sans dossier à remplir contrairement à une prime.',
    contre:
      'La baisse profite aussi à ceux qui auraient acheté de toute façon, et ampute durablement les recettes de TVA.',
  },
  'attal-economie-ramener-les-impots-de-production': {
    pour:
      'Ces impôts sont dus même à perte, ce qui pénalise l\'industrie plus que les services : les plafonner rétablit l\'équilibre.',
    contre:
      'Ils financent les collectivités, qu\'il faudra compenser. Sans compensation, ce sont les services locaux qui paient.',
  },
  'attal-emploi-creer-un-conge-de-naissance-de-6': {
    pour:
      'Le congé actuel est trop court pour la garde et trop peu payé pour être pris par les pères : allonger et mieux rémunérer change les deux.',
    contre:
      'Six mois de plus coûtent cher à la Sécurité sociale et éloignent durablement du marché du travail celui qui les prend.',
  },
  'attal-emploi-creer-un-contrat-reussite-etudia': {
    pour:
      'Au-delà de quinze heures par semaine, les chances de réussite d\'un étudiant chutent nettement : encadrer protège les études.',
    contre:
      'Plafonner les heures réduit le revenu de ceux qui travaillent par nécessité, sans rien prévoir pour compenser cette perte.',
  },
  'attal-emploi-former-10-millions-de-salaries-e': {
    pour:
      'L\'écart se creuse entre ceux qui maîtrisent ces outils et les autres : une formation de masse évite un décrochage durable.',
    contre:
      'Former dix millions de personnes en trois ans suppose des formateurs et des heures libérées dont le pays ne dispose pas.',
  },
  'attal-solidarites-garantir-un-filet-de-securite-po': {
    pour:
      'Un entrepreneur qui échoue perd tout et reste marqué des années : réduire les sanctions encourage à retenter.',
    contre:
      'Alléger les sanctions et protéger les cautions déplace le risque vers les créanciers, souvent d\'autres petites entreprises.',
  },
  'attal-solidarites-mettre-en-place-un-droit-opposab': {
    pour:
      'L\'absence de place de crèche est la première raison qui empêche un parent, le plus souvent la mère, de reprendre un emploi.',
    contre:
      'Un droit opposable sans places supplémentaires ne produit que du contentieux : les communes n\'ont ni locaux ni personnel.',
  },
  'attal-solidarites-recentrer-l-aide-sociale-a-l-enf': {
    pour:
      'La protection de l\'enfance varie énormément d\'un département à l\'autre : un enfant n\'est pas protégé selon son adresse.',
    contre:
      'Recentraliser éloigne la décision du terrain, alors que le suivi d\'un enfant repose sur une connaissance locale.',
  },
  'attal-sante-creer-des-centres-de-prise-en-ch': {
    pour:
      'Beaucoup de victimes renoncent parce qu\'il faut aller de l\'hôpital au commissariat : tout réunir en un lieu lève cet obstacle.',
    contre:
      'Ces centres supposent médecins légistes et enquêteurs disponibles en permanence, dans des effectifs déjà comptés.',
  },
  'attal-sante-instaurer-un-bilan-psychologique': {
    pour:
      'La souffrance psychique des jeunes progresse et se repère tard : deux rendez-vous automatiques la détectent avant la crise.',
    contre:
      'Il manque déjà des professionnels pour les jeunes qui vont mal : généraliser un bilan à tous allongerait leur attente.',
  },
  'attal-sante-prevoir-une-couverture-sante-obl': {
    pour:
      'Ces salariés sont les seuls à ne pas bénéficier de la complémentaire obligatoire dont profitent tous les autres.',
    contre:
      'Le coût retombe sur des particuliers employeurs, ce qui peut réduire le nombre d\'heures déclarées.',
  },
  'attal-education-former-des-generations-d-ingenie': {
    pour:
      'Les transitions numérique et climatique demandent des compétences d\'ingénierie que le pays ne produit pas en nombre.',
    contre:
      'L\'annonce ne dit ni combien d\'ingénieurs, ni avec quels moyens, ni comment remplir des filières qui se vident.',
  },
  'attal-education-introduire-des-cours-optionnels-': {
    pour:
      'Découvrir comment se monte une activité ouvre une voie à des élèves que la filière générale ne retient pas.',
    contre:
      'Le temps scolaire est déjà contraint : ajouter une option se fait au détriment d\'un autre enseignement.',
  },
  'attal-education-maintenir-la-trajectoire-de-rein': {
    pour:
      'Le pays stagne sous cet objectif depuis vingt ans, et le décrochage se lit sur les brevets et les publications.',
    contre:
      'Tenir la trajectoire dépend surtout de l\'effort privé, sur lequel l\'État n\'a qu\'un levier indirect.',
  },
  'attal-numerique-integrer-l-ia-dans-le-quotidien-': {
    pour:
      'Automatiser les tâches répétitives libère du temps d\'agent pour les situations qui demandent vraiment un humain.',
    contre:
      'L\'automatisation des tâches simples supprime aussi les postes qui servaient de porte d\'entrée dans l\'emploi.',
  },
  'attal-logement-creer-jusqu-a-500-000-logements-': {
    pour:
      'Construire sur l\'existant produit des logements sans consommer de terres agricoles ni étendre les réseaux.',
    contre:
      'Surélever suppose l\'accord des copropriétés et une structure porteuse : le potentiel réel est très inférieur à l\'objectif.',
  },
  'attal-environnement-garantir-un-prix-maximal-de-l-el': {
    pour:
      'Le prix de l\'électricité est devenu un facteur de délocalisation : le plafonner contre des engagements retient les usines.',
    contre:
      'Un prix garanti aux industriels se paie soit par les autres consommateurs, soit par le budget de l\'État.',
  },
  'attal-environnement-reussir-la-transition-ecologique': {
    pour:
      'Lier climat et prospérité répond à l\'objection principale faite à la transition : son coût social.',
    contre:
      'L\'énoncé reste une intention générale, sans objectif chiffré ni mécanisme identifiable.',
  },
  'attal-environnement-tenir-l-objectif-de-14-epr-d-ici': {
    pour:
      'Doubler le parc pilotable et l\'éolien en mer couvre la hausse attendue de la consommation d\'électricité.',
    contre:
      'Quatorze réacteurs d\'ici 2030 est hors de portée au vu des délais constatés sur les chantiers en cours.',
  },
  'attal-agriculture-mettre-en-place-des-contrats-de-': {
    pour:
      'Engager l\'État, la filière et l\'agriculteur ensemble évite de faire porter le coût de la transition au seul producteur.',
    contre:
      'L\'objectif de réduction de moitié a déjà été fixé deux fois et jamais atteint, faute d\'alternatives disponibles.',
  },
  'attal-securite-eviter-les-parcours-delinquants-': {
    pour:
      'Les parcours de délinquance commencent tôt : une réponse immédiate évite l\'installation dans la récidive.',
    contre:
      'Une réponse systématique dès la première faute peut enclencher un engrenage judiciaire pour des actes bénins.',
  },
  'attal-securite-mettre-en-place-un-suivi-en-lign': {
    pour:
      'Les victimes restent souvent des mois sans nouvelle de leur plainte, ce qui nourrit le sentiment d\'abandon.',
    contre:
      'Rendre l\'avancement visible ne l\'accélère pas, et peut exposer des informations sensibles en cours d\'enquête.',
  },
  'attal-securite-rendre-systematique-la-police-mu': {
    pour:
      'La présence sur la voie publique rassure et décharge la police nationale des missions du quotidien.',
    contre:
      'L\'obligation transfère aux communes une charge que les plus pauvres d\'entre elles ne pourront pas financer.',
  },
  'attal-immigration-creer-3000-places-supplementaire': {
    pour:
      'Les mesures d\'éloignement sont peu exécutées, faute de places pour retenir les personnes concernées.',
    contre:
      'La rétention coûte cher, et l\'allongement de sa durée n\'a pas fait progresser le nombre d\'éloignements effectifs.',
  },
  'attal-immigration-instaurer-un-systeme-d-admission': {
    pour:
      'Un barème transparent voté par le Parlement remplace des décisions au cas par cas, peu lisibles et contestées.',
    contre:
      'Un système à points sélectionne les diplômés et laisse sans réponse les métiers peu qualifiés, où le manque est réel.',
  },
  'attal-immigration-rendre-plus-operationnelle-la-bo': {
    pour:
      'La surveillance des frontières est répartie entre plusieurs administrations qui coordonnent mal leurs moyens.',
    contre:
      'Créer des états-majors ajoute une strate de commandement sans augmenter les effectifs présents sur le terrain.',
  },
  'attal-defense-instaurer-un-buy-european-tech-a': {
    pour:
      'Les commandes publiques européennes financent souvent des industriels non européens, au détriment de la base industrielle.',
    contre:
      'Fermer les marchés publics expose à des mesures symétriques et peut renchérir des équipements sans équivalent européen.',
  },
  'attal-institutions-mener-une-revue-des-entites-de-r': {
    pour:
      'La multiplication des régulateurs produit des règles qui se contredisent et un coût d\'entrée pour les entreprises nouvelles.',
    contre:
      'Juger un régulateur à sa contribution à l\'innovation ignore sa mission première, qui est le plus souvent de protéger.',
  },
  'attal-institutions-ouvrir-le-chatbot-albert-a-tous-': {
    pour:
      'Une réponse immédiate à une question courante évite un déplacement ou une attente téléphonique de plusieurs heures.',
    contre:
      'Un agent conversationnel se trompe, et une erreur sur un droit social a des conséquences directes pour l\'usager.',
  },

  // --- Jean-Luc Mélenchon ----------------------------------------------------
  'melenchon-economie-etablir-une-taxe-permanente-sur-': {
    pour:
      'Des profits nés d\'une crise ou d\'une rente, et non d\'un effort, peuvent être partagés sans décourager l\'investissement.',
    contre:
      'Définir un « superprofit » hors énergie reste juridiquement flou, et l\'incertitude fiscale pèse sur les décisions d\'implantation.',
  },
  'melenchon-economie-retablir-et-renforcer-l-impot-de': {
    pour:
      'Le patrimoine s\'est concentré depuis la suppression de cet impôt : le rétablir vise ceux dont la contribution a le plus baissé.',
    contre:
      'L\'ancien impôt rapportait peu au regard des départs qu\'il provoquait, et frappait des patrimoines difficiles à vendre.',
  },
  'melenchon-emploi-garantir-les-droits-des-represen': {
    pour:
      'Les délégués sont exposés à des représailles déguisées : les protéger est la condition d\'une négociation réelle.',
    contre:
      'Une protection étendue rend difficile de se séparer d\'un salarié même pour un motif étranger à son mandat.',
  },
  'melenchon-emploi-interdire-les-licenciements-bour': {
    pour:
      'Licencier tout en versant des dividendes revient à faire porter l\'ajustement aux seuls salariés.',
    contre:
      'L\'interdiction peut retarder des restructurations nécessaires et fragiliser l\'entreprise entière plutôt qu\'une partie.',
  },
  'melenchon-retraites-garantir-aux-agricultrices-et-ag': {
    pour:
      'Les pensions agricoles comptent parmi les plus faibles, après une vie de travail sans interruption.',
    contre:
      'Ce régime est déjà financé en grande partie par la solidarité nationale : relever les pensions accroît ce transfert.',
  },
  'melenchon-retraites-supprimer-la-decote-qui-represen': {
    pour:
      'La décote frappe deux fois ceux qui ont une carrière incomplète, souvent des femmes et des travailleurs précaires.',
    contre:
      'Elle incite à cotiser plus longtemps : la supprimer avance les départs et alourdit la charge du régime.',
  },
  'melenchon-solidarites-creer-un-service-public-de-la-pe': {
    pour:
      'Il manque des centaines de milliers de places, et le secteur privé n\'a pas comblé ce manque malgré les aides reçues.',
    contre:
      'Ouvrir 500 000 places en cinq ans suppose de recruter des dizaines de milliers de professionnels dans un métier déjà en pénurie.',
  },
  'melenchon-solidarites-organiser-l-election-des-adminis': {
    pour:
      'La Sécurité sociale a été conçue pour être gérée par ceux qui la financent : leur rendre ce pouvoir renoue avec son principe.',
    contre:
      'Laisser fixer les cotisations hors du Parlement sort de son contrôle une part majeure des prélèvements obligatoires.',
  },
  'melenchon-sante-ajouter-le-droit-de-mourir-dans-': {
    pour:
      'Inscrire ce droit dans la Constitution le met à l\'abri des alternances, et garantit du même coup l\'accès aux soins palliatifs.',
    contre:
      'Constitutionnaliser fige un sujet qui évolue, et une partie des soignants redoute une pression sur les patients les plus vulnérables.',
  },
  'melenchon-sante-proteger-la-recherche-de-la-fina': {
    pour:
      'Le financement privé oriente la recherche vers ce qui est rentable plutôt que vers ce qui est le plus utile.',
    contre:
      'Le privé finance une part majeure des essais cliniques : l\'écarter sans le remplacer ralentirait l\'accès aux traitements.',
  },
  'melenchon-education-geler-les-ouvertures-de-places-d': {
    pour:
      'Le supérieur privé lucratif s\'est développé sans contrôle, avec des diplômes parfois sans valeur reconnue.',
    contre:
      'Le privé absorbe une demande que le public ne peut pas accueillir : geler sans ouvrir ailleurs laisse des jeunes sans place.',
  },
  'melenchon-education-renforcer-le-controle-pedagogiqu': {
    pour:
      'Des établissements facturent des milliers d\'euros pour des formations dont le contenu n\'est vérifié par personne.',
    contre:
      'Un contrôle systématique demande des moyens d\'inspection considérables, et peut fermer des formations sans solution de repli.',
  },
  'melenchon-numerique-garantir-l-hebergement-des-donne': {
    pour:
      'Les données des services publics touchent à la souveraineté : sous droit français, elles échappent aux lois étrangères.',
    contre:
      'Peu d\'acteurs français atteignent le niveau de service attendu : la contrainte risque de dégrader les outils publics.',
  },
  'melenchon-numerique-garantir-l-utilisation-de-galile': {
    pour:
      'Dépendre d\'un seul système de positionnement expose à une interruption décidée ailleurs, y compris pour des usages critiques.',
    contre:
      'Imposer une double compatibilité renchérit tous les appareils, pour un risque que beaucoup jugent théorique.',
  },
  'melenchon-logement-lancer-un-plan-d-urgence-de-prev': {
    pour:
      'L\'infestation s\'étend, coûte cher aux ménages et touche d\'abord les logements les plus modestes.',
    contre:
      'Créer un service public dédié mobilise des moyens permanents pour un problème qu\'un dispositif d\'aide suffirait à traiter.',
  },
  'melenchon-logement-requisitionner-les-logements-vid': {
    pour:
      'Des centaines de milliers de logements restent vides pendant que des personnes dorment dehors.',
    contre:
      'La réquisition se heurte au droit de propriété, et beaucoup de ces logements sont vides pour cause de travaux ou de succession.',
  },
  'melenchon-transports-lancer-des-grands-travaux-de-ren': {
    pour:
      'Le réseau vieillit plus vite qu\'il n\'est rénové, et des territoires entiers ont perdu tout accès au train.',
    contre:
      'Rouvrir une ligne coûte très cher pour une fréquentation souvent faible, au détriment du réseau principal.',
  },
  'melenchon-transports-repenser-la-mobilite-individuell': {
    pour:
      'Les voitures circulent aux trois quarts vides : le partage et le vélo réduisent le trafic sans construire d\'infrastructure.',
    contre:
      'Ces solutions fonctionnent en zone dense mais restent inadaptées là où la voiture est la seule option.',
  },
  'melenchon-environnement-agir-contre-les-consequences-des': {
    pour:
      'Les pays les moins responsables du réchauffement en subissent les effets les plus violents, sans moyens d\'y faire face.',
    contre:
      'L\'aide au développement est déjà sous tension, et les transferts de technologie posent des questions de propriété industrielle.',
  },
  'melenchon-environnement-atteindre-le-tres-bon-etat-ecolo': {
    pour:
      'La qualité de l\'eau se dégrade et conditionne autant l\'eau potable que la biodiversité.',
    contre:
      'Le très bon état est plus exigeant que ce qu\'impose le droit européen, et suppose de revoir profondément les pratiques agricoles.',
  },
  'melenchon-agriculture-determiner-de-nouvelles-normes-p': {
    pour:
      'Les conditions d\'élevage intensif sont mal acceptées par le public et font aussi peser un risque sanitaire.',
    contre:
      'Des normes plus strictes qu\'ailleurs, sans équivalent aux frontières, remplacent la production locale par des importations.',
  },
  'melenchon-agriculture-instaurer-un-moratoire-sur-les-e': {
    pour:
      'Interdire avant l\'installation d\'une filière évite d\'avoir à la démanteler ensuite, avec des emplois en jeu.',
    contre:
      'Interdire par anticipation une activité légale ailleurs prive le pays d\'une production qu\'il importera de toute façon.',
  },
  'melenchon-securite-garantir-des-sessions-de-formati': {
    pour:
      'Juger sans connaître l\'histoire ni les réalités locales conduit à des décisions mal comprises et mal acceptées.',
    contre:
      'Une formation ne compense pas la rotation rapide des magistrats, qui est le problème de fond.',
  },
  'melenchon-securite-interdire-la-publicite-pour-les-': {
    pour:
      'La publicité cible les jeunes et les publics fragiles, alors que l\'addiction aux paris progresse rapidement.',
    contre:
      'L\'interdiction prive le sport de financements et déplace les joueurs vers des sites non régulés.',
  },
  'melenchon-immigration-garantir-le-droit-du-sol-integra': {
    pour:
      'Un enfant né et grandi ici n\'a pas d\'autre pays : lui reconnaître la nationalité ne fait qu\'entériner la réalité.',
    contre:
      'Ses opposants y voient un facteur d\'attractivité migratoire et un droit détaché de tout choix d\'appartenance.',
  },
  'melenchon-immigration-instituer-la-carte-de-sejour-de-': {
    pour:
      'Renouveler un titre chaque année occupe les préfectures et maintient les personnes dans une précarité permanente.',
    contre:
      'Généraliser un titre long et régulariser largement revient, pour ses opposants, à valider l\'entrée irrégulière.',
  },
  'melenchon-defense-agir-pour-l-adoption-a-l-onu-d-u': {
    pour:
      'Les engagements volontaires n\'ont empêché ni les atteintes aux droits ni les dommages environnementaux.',
    contre:
      'Un texte contraignant suppose l\'accord d\'États qui s\'y opposent, ce qui rend son adoption improbable.',
  },
  'melenchon-defense-renforcer-l-aide-au-developpemen': {
    pour:
      'L\'aide sans condition a soutenu des régimes dont les pratiques ont nourri le rejet de la France dans la région.',
    contre:
      'Conditionner l\'aide laisse le champ libre à d\'autres puissances qui, elles, ne posent aucune condition.',
  },
  'melenchon-institutions-reconnaitre-le-vote-blanc-mettre': {
    pour:
      'Reconnaître le vote blanc donne une expression à ceux qui se déplacent sans se reconnaître dans l\'offre politique.',
    contre:
      'Rendre le vote obligatoire sanctionne l\'abstention sans en traiter la cause, et un seuil de validité peut bloquer une élection.',
  },
  'melenchon-institutions-rendre-obligatoire-le-recours-au': {
    pour:
      'Modifier la Constitution ou signer un traité engage durablement le pays : le faire ratifier directement en renforce la légitimité.',
    contre:
      'Un référendum se transforme souvent en vote sur celui qui le convoque, et rendrait toute révision quasi impossible.',
  },

  // --- Marine Le Pen ---------------------------------------------------------
  'lepen-economie-autoriser-l-etat-a-intervenir-da': {
    pour:
      'Des prix garantis protègent les producteurs des variations brutales du marché mondial, qu\'ils ne maîtrisent pas.',
    contre:
      'Fixer administrativement un prix fausse la concurrence et expose la France à des recours devant la justice européenne.',
  },
  'lepen-economie-creer-sous-l-egide-de-la-caisse-': {
    pour:
      'Mobiliser l\'épargne des Français pour financer l\'appareil productif évite de dépendre de capitaux étrangers.',
    contre:
      'L\'épargne réglementée finance déjà le logement social : la réorienter se fait forcément au détriment d\'un autre emploi.',
  },
  'lepen-economie-flecher-prioritairement-les-effo': {
    pour:
      'L\'argent public prélevé en France peut légitimement soutenir d\'abord l\'activité et les emplois situés en France.',
    contre:
      'Une préférence nationale dans la commande publique contrevient aux règles du marché intérieur et expose à des rétorsions.',
  },
  'lepen-emploi-appliquer-a-competence-egale-une': {
    pour:
      'À compétence égale, la mesure réserve l\'emploi aux nationaux dans un pays où le chômage reste élevé.',
    contre:
      'Une préférence fondée sur la nationalité contrevient au droit européen et au principe d\'égalité, et serait censurée.',
  },
  'lepen-emploi-stabiliser-la-legislation-sur-le': {
    pour:
      'Employeurs comme salariés ont besoin de règles qui ne changent pas à chaque législature pour s\'organiser.',
    contre:
      'Figer la règle empêche aussi de corriger ce qui ne marche pas, et l\'exonération des heures supplémentaires coûte à la Sécurité sociale.',
  },
  'lepen-retraites-alleger-les-dispositifs-de-cumul': {
    pour:
      'Des soignants retraités souhaitent poursuivre mais y renoncent, leurs cotisations ne leur ouvrant plus aucun droit.',
    contre:
      'La mesure traite un symptôme du manque de soignants sans agir sur la formation, qui en est la cause.',
  },
  'lepen-retraites-indexer-l-age-d-ouverture-des-dr': {
    pour:
      'Celui qui commence à 18 ans cotise bien plus longtemps que celui qui commence à 25 : indexer rétablit l\'équité entre carrières.',
    contre:
      'Définir l\'entrée dans un emploi stable est très complexe pour des parcours faits de contrats courts et d\'alternance.',
  },
  'lepen-solidarites-controler-l-existence-des-benefi': {
    pour:
      'Des pensions continuent d\'être versées après un décès non signalé à l\'étranger : le contrôle porte sur une fraude documentée.',
    contre:
      'Les sommes en jeu sont faibles au regard du coût des contrôles, qui peuvent suspendre des droits parfaitement légitimes.',
  },
  'lepen-solidarites-suspendre-les-allocations-famili': {
    pour:
      'La responsabilité des parents doit avoir une traduction concrète lorsqu\'un mineur récidive.',
    contre:
      'Retirer une allocation appauvrit une famille déjà fragile et frappe aussi les frères et sœurs, qui n\'ont rien fait.',
  },
  'lepen-sante-le-modele-de-l-hopital-de-valenc': {
    pour:
      'La part administrative a crû plus vite que le soin : la ramener libère des moyens pour les équipes soignantes.',
    contre:
      'Un ratio uniforme ignore la taille et la mission de chaque hôpital, et une partie de l\'administratif est imposée par la loi.',
  },
  'lepen-sante-mettre-en-place-des-2026-une-pro': {
    pour:
      'Les agents hospitaliers sont moins bien couverts que les salariés du privé, alors qu\'ils sont plus exposés.',
    contre:
      'La mesure engage une dépense récurrente pour l\'État employeur, dont le financement n\'est pas précisé.',
  },
  'lepen-education-donner-dans-l-enseignement-prima': {
    pour:
      'Les résultats en français et en mathématiques baissent : concentrer les heures sur ces matières est la réponse la plus directe.',
    contre:
      'Réduire la place des autres disciplines appauvrit la formation, et l\'histoire enseignée devient un enjeu politique.',
  },
  'lepen-education-experimenter-un-service-national': {
    pour:
      'Beaucoup de monuments et de sites se dégradent faute de bras, et l\'engagement crée du lien entre générations.',
    contre:
      'Le volontariat suppose un encadrement coûteux, et une restauration demande des compétences de métier.',
  },
  'lepen-numerique-taxer-l-utilisation-des-reseaux-': {
    pour:
      'Quelques services concentrent l\'essentiel du trafic sans participer au coût des réseaux qu\'ils saturent.',
    contre:
      'La taxe se répercute sur les abonnements, et remet en cause le principe de neutralité du réseau.',
  },
  'lepen-logement-instaurer-dans-l-acces-au-logeme': {
    pour:
      'Le parc social est financé par la collectivité nationale, ce qui justifierait d\'en réserver l\'accès en priorité.',
    contre:
      'Un critère de nationalité dans l\'attribution contrevient au principe d\'égalité et serait censuré.',
  },
  'lepen-logement-remplacer-maprimerenov-par-un-di': {
    pour:
      'Le dispositif actuel est illisible, mal contrôlé et a nourri des fraudes : le remplacer permet de repartir sur des bases saines.',
    contre:
      'L\'économie annoncée suppose de rénover moins, alors que le parc mal isolé reste considérable.',
  },
  'lepen-transports-investir-dans-les-infrastructure': {
    pour:
      'Certains bassins d\'emploi restent mal reliés, ce qui décourage l\'installation d\'entreprises.',
    contre:
      'De nouvelles sorties autoroutières encouragent l\'étalement urbain et la circulation, à rebours des objectifs climatiques.',
  },
  'lepen-transports-supprimer-les-zones-a-faibles-em': {
    pour:
      'Ces zones excluent de fait ceux qui ne peuvent pas changer de véhicule, souvent sans transport alternatif.',
    contre:
      'Elles répondent à une pollution de l\'air responsable de dizaines de milliers de décès prématurés par an.',
  },
  'lepen-environnement-laisser-les-parcs-eoliens-actuel': {
    pour:
      'Des parcs ont été implantés sans considération pour les paysages et le patrimoine, parfois contre l\'avis des habitants.',
    contre:
      'Renoncer à l\'éolien prive le pays de la capacité de production la plus rapide à installer, alors que la demande augmente.',
  },
  'lepen-environnement-prolonger-et-optimiser-les-react': {
    pour:
      'Un programme de long terme redonne à la filière la visibilité industrielle qu\'elle a perdue depuis trente ans.',
    contre:
      'Vingt réacteurs représentent un investissement colossal, et les petits réacteurs modulaires ne sont pas encore éprouvés.',
  },
  'lepen-agriculture-annuler-la-baisse-de-500-million': {
    pour:
      'Réduire le budget agricole au moment où les revenus s\'effondrent envoie un signal difficile à tenir.',
    contre:
      'Maintenir l\'enveloppe sans dire ce qu\'elle finance ne règle pas la question de l\'efficacité de ces aides.',
  },
  'lepen-agriculture-defendre-une-exception-agricultu': {
    pour:
      'Exposer l\'agriculture à des concurrents qui n\'ont pas les mêmes normes revient à lui demander l\'impossible.',
    contre:
      'Sortir l\'agriculture des accords prive aussi les exportateurs français de débouchés, notamment vins et fromages.',
  },
  'lepen-securite-identifier-des-lieux-pouvant-etr': {
    pour:
      'Les prisons sont surpeuplées, et mélanger courtes peines et détenus dangereux favorise la récidive.',
    contre:
      'Ouvrir des lieux allégés sans personnel supplémentaire déplace le problème au lieu de le résoudre.',
  },
  'lepen-securite-mettre-en-place-des-peines-planc': {
    pour:
      'Une peine minimale garantit une réponse ferme pour les récidivistes et ceux qui s\'en prennent aux agents publics.',
    contre:
      'Ces peines, déjà expérimentées puis abandonnées, ont surtout rempli les prisons sans faire baisser la récidive.',
  },
  'lepen-immigration-mettre-fin-a-l-accord-franco-alg': {
    pour:
      'Ce régime particulier échappe au droit commun des étrangers et n\'a jamais pu être renégocié depuis sa signature.',
    contre:
      'Le dénoncer sans accord de remplacement risque de bloquer la délivrance des laissez-passer nécessaires aux éloignements.',
  },
  'lepen-immigration-negocier-avec-les-partenaires-eu': {
    pour:
      'La libre circulation a été conçue entre États européens : la réserver à leurs ressortissants revient à son intention initiale.',
    contre:
      'Contrôler la nationalité aux frontières intérieures suppose de vérifier chaque passage, ce qui paralyserait la circulation.',
  },
  'lepen-defense-faire-de-la-lutte-contre-les-ing': {
    pour:
      'L\'espionnage économique vise directement les entreprises innovantes, souvent sans qu\'elles s\'en aperçoivent.',
    contre:
      'La mesure affirme une priorité sans indiquer les moyens supplémentaires ni la réorganisation nécessaires.',
  },
  'lepen-defense-renforcer-les-controles-sur-les-': {
    pour:
      'Le rachat d\'entreprises stratégiques par des capitaux étrangers a déjà fait perdre des technologies critiques.',
    contre:
      'Un contrôle trop large décourage l\'investissement étranger, dont dépendent aussi des emplois.',
  },
  'lepen-institutions-inscrire-dans-la-constitution-un': {
    pour:
      'Ce référendum permet de soumettre au vote un sujet que les élus refusent d\'inscrire à l\'ordre du jour.',
    contre:
      'Selon le seuil retenu, il peut servir à remettre en cause des droits fondamentaux par une majorité de circonstance.',
  },
  'lepen-institutions-supprimer-une-large-partie-des-a': {
    pour:
      'Beaucoup d\'autorités se sont ajoutées sans que leurs missions soient réévaluées, avec leurs budgets et leurs doublons.',
    contre:
      'Ces autorités existent précisément pour échapper au pouvoir politique : les réinternaliser supprime cette garantie.',
  },

  // --- Marine Tondelier ------------------------------------------------------
  'tondelier-economie-augmenter-le-taux-de-la-taxe-sur': {
    pour:
      'Les grandes surfaces captent une fréquentation que les centres-villes perdent : la taxe fait financer par les unes ce que les autres perdent.',
    contre:
      'Le surcoût se répercute sur les prix en rayon, payés aussi par les clients les plus modestes.',
  },
  'tondelier-economie-mettre-en-place-une-taxe-zucman-': {
    pour:
      'Les très grands patrimoines déclarent peu de revenus imposables : taxer l\'actif lui-même contourne cet écueil.',
    contre:
      'Évaluer chaque année un patrimoine non coté est complexe, et un taux annuel peut dépasser ce que le bien rapporte.',
  },
  'tondelier-economie-renforcer-le-fonds-barnier-pour-': {
    pour:
      'Prévenir une inondation coûte moins cher que la réparer, et les collectivités n\'ont pas les moyens d\'avancer ces travaux.',
    contre:
      'Ce fonds est alimenté par une part des primes d\'assurance : le renforcer se traduit tôt ou tard par des cotisations plus élevées.',
  },
  'tondelier-emploi-augmenter-les-salaires-des-ensei': {
    pour:
      'Le métier ne recrute plus : des académies terminent la rentrée avec des postes vacants, faute de candidats.',
    contre:
      'Quinze pour cent sur près d\'un million d\'agents représentent plusieurs milliards par an, sans garantie que les vocations reviennent.',
  },
  'tondelier-emploi-garantir-des-amenagements-d-hora': {
    pour:
      'Les épisodes de forte chaleur se multiplient et tuent au travail : adapter les horaires est une mesure de sécurité.',
    contre:
      'Aménager les horaires désorganise chantiers et production, et la contrainte pèse surtout sur les petites structures.',
  },
  'tondelier-emploi-passer-le-salaire-minimum-a-2-00': {
    pour:
      'Le salaire minimum actuel ne suit plus le coût du logement et de l\'alimentation dans les grandes agglomérations.',
    contre:
      'Une hausse brutale renchérit le bas de l\'échelle, peut supprimer les emplois les moins qualifiés et tasse toute la grille.',
  },
  'tondelier-solidarites-garantir-systematiquement-aux-fa': {
    pour:
      'Une famille monoparentale sans mode de garde n\'a aucune possibilité de travailler : la priorité y est la plus utile.',
    contre:
      'Créer une priorité sans créer de places revient à la prendre à d\'autres familles également en difficulté.',
  },
  'tondelier-solidarites-garantir-une-puissance-electriqu': {
    pour:
      'Une coupure totale prive de réfrigérateur et de ventilateur, ce qui devient dangereux pendant un épisode de chaleur.',
    contre:
      'Un service minimal garanti supprime le levier de recouvrement des impayés, dont le coût se reporte sur les autres abonnés.',
  },
  'tondelier-solidarites-renforcer-les-demarches-d-aller-': {
    pour:
      'Ceux qui ne demandent rien sont souvent ceux qui vont le plus mal : aller vers eux est le seul moyen de les atteindre.',
    contre:
      'Ces démarches reposent sur des travailleurs sociaux et des bénévoles dont le nombre est déjà insuffisant.',
  },
  'tondelier-sante-creer-2-000-nouveaux-centres-de-': {
    pour:
      'Les centres qui salarient leurs médecins attirent là où le libéral ne s\'installe plus, et pratiquent le tiers payant.',
    contre:
      'Ouvrir des murs ne crée pas de médecins : en situation de pénurie, ces centres se disputeraient les mêmes praticiens.',
  },
  'tondelier-sante-former-regulierement-les-profess': {
    pour:
      'Les adultes qui encadrent les enfants ne savent pas repérer les usages qui abîment leur sommeil ou leur attention.',
    contre:
      'C\'est une formation de plus qui s\'ajoute à des obligations déjà nombreuses, sans temps dégagé pour la suivre.',
  },
  'tondelier-sante-garantir-un-soutien-psychologiqu': {
    pour:
      'Perdre sa maison ou combattre un feu laisse des traces durables que rien n\'accompagne aujourd\'hui.',
    contre:
      'Le dispositif dépend de psychologues disponibles sur place, souvent absents des zones rurales concernées.',
  },
  'tondelier-education-integrer-une-education-critique-': {
    pour:
      'Les élèves passent des heures sur des contenus conçus pour capter leur attention, sans jamais apprendre à les décrypter.',
    contre:
      'C\'est un enseignement de plus à caser dans des programmes saturés, sans professeurs formés pour le porter.',
  },
  'tondelier-education-reduire-la-taille-des-classes-de': {
    pour:
      'L\'effet d\'un effectif réduit est mesuré et durable sur les premières années, surtout pour les élèves les plus fragiles.',
    contre:
      'Cela suppose des dizaines de milliers de postes et de salles, alors que le métier peine déjà à recruter.',
  },
  'tondelier-numerique-faire-respecter-des-criteres-de-': {
    pour:
      'Un classement personnalisé enferme chacun dans ce qui le conforte, ce qui pèse particulièrement pendant une campagne.',
    contre:
      'Définir la neutralité d\'un algorithme est très difficile, et un fil non trié devient vite inutilisable.',
  },
  'tondelier-numerique-imposer-la-diversification-des-c': {
    pour:
      'Les recommandations poussent vers des contenus toujours plus extrêmes, parce que ce sont eux qui retiennent l\'attention.',
    contre:
      'Imposer une diversité de contenus revient à confier à la loi le soin de décider ce que chacun doit voir.',
  },
  'tondelier-logement-atteindre-500-000-renovations-pe': {
    pour:
      'Seule une rénovation complète fait vraiment baisser la facture : les gestes isolés ne suffisent pas.',
    contre:
      'Le rythme visé est plusieurs fois supérieur au rythme actuel, dans un secteur qui manque déjà de main-d\'œuvre.',
  },
  'tondelier-logement-generaliser-ameliorer-et-perenni': {
    pour:
      'Là où il s\'applique, l\'encadrement a freiné la hausse des loyers sans faire disparaître l\'offre.',
    contre:
      'Plafonner le loyer décourage la mise en location et l\'entretien, et pousse vers la location de courte durée.',
  },
  'tondelier-transports-ajouter-un-milliard-d-euros-en-2': {
    pour:
      'Le dispositif a été saturé en quelques jours : la demande existe, c\'est l\'enveloppe qui manquait.',
    contre:
      'Subventionner des voitures neuves profite d\'abord aux constructeurs, et un milliard finance relativement peu de véhicules.',
  },
  'tondelier-transports-creer-une-offre-de-location-soci': {
    pour:
      'Beaucoup de ménages ne peuvent pas acheter électrique mais pourraient louer : la location lève la barrière du prix d\'achat.',
    contre:
      'Un million de véhicules sur cinq ans suppose une production européenne qui n\'existe pas encore à ce volume.',
  },
  'tondelier-environnement-financer-par-le-fonds-vert-des-s': {
    pour:
      'Un arbre fait baisser la température ressentie de plusieurs degrés : c\'est le moyen le moins cher de rendre les villes vivables.',
    contre:
      'Des seuils uniformes ignorent la diversité des sols et des contraintes, et le fonds ne peut pas tout financer.',
  },
  'tondelier-environnement-modifier-la-ppe3-pour-que-la-par': {
    pour:
      'Les renouvelables s\'installent en quelques années là où un réacteur demande plus d\'une décennie.',
    contre:
      'Une part élevée d\'électricité intermittente suppose du stockage et du réseau que la mesure ne finance pas.',
  },
  'tondelier-agriculture-organiser-des-dispositifs-veteri': {
    pour:
      'Les incendies laissent des milliers d\'animaux blessés sans que personne ne soit chargé de les prendre en charge.',
    contre:
      'Mobiliser des vétérinaires en urgence suppose une organisation permanente pour un besoin très ponctuel.',
  },
  'tondelier-agriculture-planifier-une-sortie-progressive': {
    pour:
      'Un horizon lointain et annoncé laisse à la recherche et aux filières le temps de s\'adapter sans rupture brutale.',
    contre:
      'Aucune alternative n\'existe pour certaines cultures : fixer une date sans solution fait porter le risque aux producteurs.',
  },
  'tondelier-securite-consacrer-260-millions-d-euros-e': {
    pour:
      'La flotte actuelle est vieillissante et insuffisante lorsque plusieurs incendies se déclarent en même temps.',
    contre:
      'Les délais de fabrication de ces appareils se comptent en années : le budget ne garantit pas la livraison.',
  },
  'tondelier-securite-creer-9-000-postes-de-magistrats': {
    pour:
      'Les délais de jugement atteignent plusieurs années, et le pays compte beaucoup moins de magistrats que ses voisins.',
    contre:
      'Recruter à ce rythme suppose de former pendant des années et de disposer de tribunaux pour les accueillir.',
  },
  'tondelier-immigration-regulariser-les-travailleurs-les': {
    pour:
      'Des critères écrits remplacent le pouvoir d\'appréciation des préfectures, qui produit aujourd\'hui des décisions très inégales.',
    contre:
      'Des critères connus d\'avance constituent, pour ses opposants, une régularisation permanente et prévisible.',
  },
  'tondelier-defense-creer-un-commandement-militaire-': {
    pour:
      'Les Européens dépensent beaucoup pour des armées qui ne savent pas opérer ensemble : un commandement commun y remédie.',
    contre:
      'Un commandement dépourvu du pouvoir de mobiliser les armées reste une structure symbolique de plus.',
  },
  'tondelier-institutions-creer-une-delegation-interminist': {
    pour:
      'L\'isolement touche des millions de personnes et aggrave la santé physique et mentale, sans qu\'aucun ministère ne le porte.',
    contre:
      'Créer une délégation ajoute une structure sans moyens propres : une réponse administrative à un problème social.',
  },
  'tondelier-institutions-instaurer-la-proportionnelle-int': {
    pour:
      'La proportionnelle intégrale fait correspondre la composition de l\'Assemblée aux voix réellement exprimées.',
    contre:
      'Sans prime majoritaire, aucune majorité ne se dégage et le pouvoir passe aux négociations d\'après-scrutin.',
  },

  // --- Raphaël Glucksmann ----------------------------------------------------
  'glucksmann-economie-donner-aux-territoires-notamment': {
    pour:
      'Une région peut ainsi peser contre la fermeture d\'un site dont dépend tout un bassin d\'emploi.',
    contre:
      'Les collectivités n\'ont ni les moyens ni le métier d\'actionnaire, et engagent l\'argent public sur un risque industriel.',
  },
  'glucksmann-economie-flecher-une-part-des-revenus-de-': {
    pour:
      'Cette taxe est payée sur place : en réserver une part garantit qu\'elle finance des équipements sur place.',
    contre:
      'Elle finance déjà le budget de fonctionnement des communes, dont la marge se réduit d\'autant.',
  },
  'glucksmann-economie-instaurer-une-contribution-solid': {
    pour:
      'Les sommes en jeu sont sans commune mesure avec les moyens des clubs amateurs qui forment les joueurs.',
    contre:
      'Une contribution propre à la France pousse à conclure les opérations ailleurs, et son rendement s\'évapore.',
  },
  'glucksmann-emploi-creer-des-guichets-pour-booster-': {
    pour:
      'Un jeune qui cherche un emploi bute d\'abord sur le logement et la santé : traiter le tout au même endroit évite l\'abandon.',
    contre:
      'Ces guichets s\'ajoutent aux missions locales et à France Travail, et empilent une structure de plus.',
  },
  'glucksmann-emploi-proteger-les-salaries-en-redonna': {
    pour:
      'L\'accord de branche protège les salariés des petites entreprises, où il n\'y a personne pour négocier.',
    contre:
      'La branche impose une règle unique à des entreprises très différentes, et empêche des accords adaptés au terrain.',
  },
  'glucksmann-retraites-creer-un-haut-conseil-du-pilotag': {
    pour:
      'Un pilotage permanent permet d\'ajuster en continu plutôt que de procéder par réformes brutales tous les dix ans.',
    contre:
      'Créer une instance ne tranche aucune question de fond : l\'âge, la durée et le niveau des pensions restent entiers.',
  },
  'glucksmann-retraites-travailler-a-une-reforme-d-ample': {
    pour:
      'Une réforme construite avec les syndicats a plus de chances d\'être appliquée durablement qu\'une réforme imposée.',
    contre:
      'La concertation a déjà échoué sur ce sujet, et la mesure ne dit rien de son contenu ni de son calendrier.',
  },
  'glucksmann-solidarites-automatiser-l-acces-aux-droits-s': {
    pour:
      'Le non-recours atteint un tiers des ayants droit pour certaines aides : le versement automatique supprime la démarche.',
    contre:
      'Un dossier partagé entre tous les acteurs concentre des données très sensibles en un point unique.',
  },
  'glucksmann-solidarites-rendre-l-accessibilite-universel': {
    pour:
      'L\'accessibilité s\'est longtemps limitée au fauteuil roulant ; les handicaps cognitifs et sensoriels restent des angles morts.',
    contre:
      'Étendre l\'obligation à tous les handicaps représente un coût de mise aux normes considérable pour les communes et les commerces.',
  },
  'glucksmann-sante-assurer-la-contraception-gratuit': {
    pour:
      'Le coût des protections écarte des femmes précaires d\'un besoin qui n\'a rien d\'optionnel.',
    contre:
      'La gratuité pour toutes coûte sensiblement plus cher qu\'un dispositif ciblé sur celles qui en ont besoin.',
  },
  'glucksmann-sante-generaliser-le-pass-sport-sante-': {
    pour:
      'L\'activité physique est le moyen le mieux documenté de prévenir les maladies chroniques, et coûte moins cher que de les soigner.',
    contre:
      'Le dispositif profite surtout à ceux qui pratiquent déjà : toucher les sédentaires demande autre chose qu\'une aide financière.',
  },
  'glucksmann-education-freiner-les-fermetures-d-ecoles-': {
    pour:
      'La fermeture d\'une école accélère le départ des familles et éteint le village : la maintenir retient la population.',
    contre:
      'Maintenir une classe à très faible effectif coûte cher et prive les élèves d\'une vie collective plus riche ailleurs.',
  },
  'glucksmann-education-repenser-en-profondeur-parcoursu': {
    pour:
      'La plateforme est contestée par tous ceux qui l\'utilisent : la refonder avec eux vaut mieux qu\'une retouche de plus.',
    contre:
      'Une concertation ne règle pas le problème de fond : il y a plus de candidats que de places dans les filières demandées.',
  },
  'glucksmann-numerique-combattre-les-algorithmes-toxiqu': {
    pour:
      'Corriger après coup n\'a jamais fonctionné : encadrer dès la conception s\'attaque à la cause plutôt qu\'aux symptômes.',
    contre:
      'L\'énoncé reste général : sans définir ce qu\'est un algorithme toxique, la règle est inapplicable.',
  },
  'glucksmann-numerique-contrecarrer-les-monopoles-techn': {
    pour:
      'Quelques entreprises fixent seules les règles d\'accès à des marchés entiers, et les amendes n\'y changent rien.',
    contre:
      'Ces sanctions relèvent de la Commission européenne : une position nationale a peu de portée à elle seule.',
  },
  'glucksmann-logement-retablir-l-obligation-d-accessib': {
    pour:
      'Rendre accessible dès la construction coûte une fraction d\'une adaptation ultérieure, et la population vieillit.',
    contre:
      'L\'obligation renchérit chaque logement neuf et réduit les surfaces habitables, dans un marché déjà tendu.',
  },
  'glucksmann-transports-relancer-les-trains-de-nuit-acce': {
    pour:
      'Le train de nuit remplace l\'avion sur des trajets où la grande vitesse ne serait pas rentable.',
    contre:
      'Le matériel de nuit a été démantelé et coûte cher à reconstituer, pour un nombre de voyageurs limité.',
  },
  'glucksmann-transports-rendre-l-accessibilite-universel': {
    pour:
      'Sans transport accessible, l\'emploi et les soins restent hors d\'atteinte quels que soient les autres droits reconnus.',
    contre:
      'Mettre aux normes des réseaux anciens représente des coûts que les collectivités ne peuvent pas absorber seules.',
  },
  'glucksmann-environnement-conforter-le-role-du-nucleaire-e': {
    pour:
      'Le parc existant fournit l\'essentiel de l\'électricité décarbonée : en assurer la sûreté et le renouvellement est la priorité.',
    contre:
      'La position reste générale : elle ne tranche ni entre prolongation et construction, ni sur le rythme à tenir.',
  },
  'glucksmann-environnement-deployer-des-conventions-citoyen': {
    pour:
      'Les mesures climatiques passent mieux quand des citoyens en ont délibéré que lorsqu\'elles sont imposées d\'en haut.',
    contre:
      'La précédente convention a vu ses propositions largement écartées : répéter l\'exercice sans engagement nourrit la déception.',
  },
  'glucksmann-agriculture-garantir-le-revenu-des-agriculte': {
    pour:
      'Un prix plancher empêche la vente à perte, ce que les lois successives n\'ont pas réussi à faire respecter.',
    contre:
      'Un prix garanti détaché du marché encourage la surproduction et se heurte aux règles de concurrence européennes.',
  },
  'glucksmann-agriculture-instaurer-un-revenu-de-transitio': {
    pour:
      'Le passage au bio fait chuter les rendements plusieurs années : accompagner ce creux est précisément ce qui manque.',
    contre:
      'Le dispositif finance la conversion sans garantir les débouchés, alors que la demande en bio a reculé.',
  },
  'glucksmann-securite-deployer-massivement-la-justice-': {
    pour:
      'La confrontation aux conséquences de l\'acte réduit la récidive plus efficacement qu\'une courte peine de prison.',
    contre:
      'Ces dispositifs demandent un encadrement important et restent mal compris des victimes comme du public.',
  },
  'glucksmann-securite-doubler-le-nombre-de-maisons-du-': {
    pour:
      'Dans beaucoup de territoires, le premier lieu où poser une question juridique est à des dizaines de kilomètres.',
    contre:
      'Ouvrir des lieux ne sert que s\'ils sont dotés en personnel qualifié, ce que le recrutement actuel ne permet pas.',
  },
  'glucksmann-immigration-creer-une-force-europeenne-de-sa': {
    pour:
      'Des milliers de personnes meurent chaque année en Méditerranée, et le sauvetage repose surtout sur des navires associatifs.',
    contre:
      'Ses opposants estiment qu\'un dispositif permanent de secours encourage les départs et l\'activité des passeurs.',
  },
  'glucksmann-immigration-mettre-en-place-des-guichets-uni': {
    pour:
      'Un parcours éclaté entre préfecture, sécurité sociale et école retarde l\'intégration de plusieurs mois.',
    contre:
      'Regrouper ces services suppose des moyens supplémentaires, alors que les préfectures peinent déjà à traiter les dossiers.',
  },
  'glucksmann-defense-augmenter-drastiquement-l-aide-m': {
    pour:
      'Un conflit réglé par la force aux frontières de l\'Union fixerait un précédent pour tout le continent.',
    contre:
      'L\'effort financier est considérable et engage le pays sur une durée que personne ne peut estimer.',
  },
  'glucksmann-defense-proposer-aux-partenaires-de-l-ue': {
    pour:
      'La garantie américaine n\'est plus certaine : une dissuasion à l\'échelle européenne comblerait ce vide.',
    contre:
      'Étendre la dissuasion sans partager la décision n\'a rien de crédible, et la partager reviendrait à céder la souveraineté.',
  },
  'glucksmann-institutions-engager-une-refondation-democrat': {
    pour:
      'La concentration du pouvoir nourrit le sentiment que les décisions se prennent loin de ceux qu\'elles concernent.',
    contre:
      'L\'annonce reste une intention : elle ne dit ni quels pouvoirs seraient transférés, ni à quel échelon.',
  },
  'glucksmann-institutions-renouer-avec-l-esprit-des-accord': {
    pour:
      'Le retour au dialogue est la seule issue après des affrontements qui ont montré l\'échec d\'une décision imposée.',
    contre:
      'Rouvrir la discussion sans cadre clair prolonge une incertitude qui pèse sur l\'économie et la sécurité de l\'archipel.',
  },

  // --- Xavier Bertrand -------------------------------------------------------
  'bertrand-economie-mettre-fin-aux-differences-de-jo': {
    pour:
      'Une même règle pour tous les salariés met fin à une différence de traitement que peu de gens savent justifier.',
    contre:
      'Aligner par le bas revient à réduire la protection de millions d\'agents plutôt qu\'à relever celle du privé.',
  },
  'bertrand-economie-relever-le-prelevement-forfaitai': {
    pour:
      'Un taux unique bas rend les revenus du capital moins imposés que le salaire : le relever rapproche les deux.',
    contre:
      'Ce taux unique avait mis fin à la fuite de l\'épargne ; le relever peut relancer les arbitrages vers l\'étranger.',
  },
  'bertrand-retraites-developper-la-retraite-par-capit': {
    pour:
      'Un étage par capitalisation complète la répartition et diversifie les sources de financement des pensions.',
    contre:
      'La capitalisation soumet la retraite aux marchés financiers et ne protège pas ceux qui n\'ont rien à épargner.',
  },
  'bertrand-sante-adopter-une-loi-pluriannuelle-de': {
    pour:
      'Le budget voté chaque année empêche les hôpitaux de planifier leurs recrutements et leurs investissements.',
    contre:
      'Une trajectoire pluriannuelle contraint aussi : elle enferme le système si une crise sanitaire survient.',
  },
  'bertrand-sante-creer-en-corse-un-centre-hospita': {
    pour:
      'L\'île n\'a pas de centre hospitalier universitaire, ce qui oblige à évacuer des patients vers le continent.',
    contre:
      'Les partenariats public-privé hospitaliers ont laissé des loyers très lourds, parfois pendant trente ans.',
  },
  'bertrand-education-developper-le-mecenat-culturel-e': {
    pour:
      'Le mécénat apporte des financements que le budget public ne fournit plus, et implique les entreprises d\'un territoire.',
    contre:
      'Il va vers ce qui est visible et prestigieux, rarement vers la création risquée ou les zones isolées.',
  },
  'bertrand-education-garantir-a-chaque-eleve-de-l-eco': {
    pour:
      'Pour beaucoup d\'élèves, l\'école est la seule occasion d\'entrer dans un théâtre, une salle de concert ou un musée.',
    contre:
      'Une sortie unique laisse peu de trace sans un travail pédagogique autour, que la mesure ne prévoit pas.',
  },
  'bertrand-education-porter-a-1-la-part-du-budget-de-': {
    pour:
      'Un objectif chiffré protège le budget culturel des arbitrages annuels, où il sert souvent de variable d\'ajustement.',
    contre:
      'Fixer une part du budget sans dire ce qu\'elle finance revient à décider d\'un montant avant de décider d\'une politique.',
  },
  'bertrand-education-soutenir-le-developpement-des-la': {
    pour:
      'Ces langues disparaissent avec leurs derniers locuteurs, et l\'enseignement est le seul moyen de les transmettre.',
    contre:
      'Les heures qu\'elles occupent se prennent sur d\'autres enseignements, dans un temps scolaire déjà plein.',
  },
  'bertrand-environnement-deployer-la-telesurveillance-et-': {
    pour:
      'Un départ de feu détecté dans les premières minutes s\'éteint avec des moyens sans commune mesure.',
    contre:
      'La détection ne sert que si des moyens d\'intervention sont disponibles à proximité, ce que la mesure ne prévoit pas.',
  },
  'bertrand-agriculture-supprimer-les-surtranspositions-': {
    pour:
      'Les producteurs français appliquent des règles plus contraignantes que leurs concurrents sur le même marché.',
    contre:
      'Certaines de ces règles protègent la santé ou l\'eau : les supprimer sans distinction revient à un alignement par le bas.',
  },
  'bertrand-securite-durcir-les-sanctions-contre-les-': {
    pour:
      'Une part importante des départs de feu est d\'origine humaine, et la sanction actuelle ne dissuade pas.',
    contre:
      'La plupart de ces départs sont accidentels : alourdir la peine n\'agit que sur une minorité de cas.',
  },
  'bertrand-securite-instaurer-des-peines-minimales-p': {
    pour:
      'Les agressions contre élus et secours augmentent, et une peine plancher affirme une protection particulière.',
    contre:
      'Une peine minimale retire au juge la faculté d\'adapter la sanction, ce que le Conseil constitutionnel encadre strictement.',
  },
  'bertrand-defense-proposer-avec-le-danemark-un-par': {
    pour:
      'Le Groenland concentre des ressources critiques et une position stratégique que d\'autres puissances convoitent.',
    contre:
      'Un tel partenariat dépend d\'abord de la volonté des Groenlandais, que la mesure ne peut pas préjuger.',
  },
  'bertrand-defense-saisir-la-cour-de-justice-de-l-u': {
    pour:
      'L\'accord expose les agriculteurs à des produits qui ne respectent pas les normes imposées en Europe.',
    contre:
      'Un recours a peu de chances d\'aboutir contre un accord ratifié, et isolerait la France parmi ses partenaires.',
  },
  'bertrand-institutions-accorder-a-la-corse-une-autonomi': {
    pour:
      'Une île éloignée du continent a des réalités que la loi nationale traite mal : pouvoir adapter les règles y répond.',
    contre:
      'Créer une catégorie à part dans la République ouvre la voie à des demandes comparables ailleurs.',
  },
  'bertrand-institutions-donner-un-cadre-pluriannuel-a-l-': {
    pour:
      'Une enveloppe renégociée chaque année empêche de planifier les liaisons et les investissements de long terme.',
    contre:
      'Figer une enveloppe sur plusieurs années réduit la capacité de l\'ajuster quand les besoins changent.',
  },
  'bertrand-institutions-fusionner-une-partie-des-mandats': {
    pour:
      'Le nombre d\'élus locaux est parmi les plus élevés d\'Europe, et les compétences des deux échelons se recoupent largement.',
    contre:
      'Moins d\'élus, c\'est moins de proximité, surtout dans les territoires ruraux déjà éloignés des services publics.',
  },
  'bertrand-institutions-permettre-l-adaptation-des-lois-': {
    pour:
      'Une même règle appliquée en montagne et en zone dense produit des effets opposés : l\'adaptation relève du bon sens.',
    contre:
      'L\'égalité devant la loi est un principe constitutionnel, que multiplier les régimes locaux fragilise.',
  },
  'bertrand-institutions-soumettre-l-autonomie-de-la-cors': {
    pour:
      'Un changement de statut engage durablement l\'île : le soumettre à ses habitants en assure la légitimité.',
    contre:
      'Un vote local sur une question constitutionnelle pose la question de qui décide, l\'île ou la nation tout entière.',
  },
  'bertrand-institutions-transferer-aux-territoires-la-re': {
    pour:
      'Les besoins en logement et en soins varient énormément d\'un territoire à l\'autre : décider sur place colle mieux au réel.',
    contre:
      'Transférer la santé aux territoires risque d\'installer des différences d\'accès aux soins selon le lieu de résidence.',
  },
};
