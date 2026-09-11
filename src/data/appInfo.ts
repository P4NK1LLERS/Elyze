// Version de l'application, telle qu'affichée dans les réglages et jointe aux
// retours envoyés par courriel.
//
// ELLE EST RECOPIÉE DE app.json, ET C'EST UN RISQUE ASSUMÉ SOUS SURVEILLANCE.
//
// La lire à l'exécution demanderait `expo-constants`, une dépendance de plus
// pour une chaîne de six caractères. La recopier expose en revanche à la
// dérive : le jour où app.json passe à 1.2.0, ce fichier continue d'annoncer
// 1.1.0, et tous les rapports de bogue désignent la mauvaise version — un
// mensonge discret, dans l'information dont on a justement besoin pour
// reproduire un défaut.
//
// D'où le test qui accompagne ce fichier (appInfo.test.ts) : il lit app.json
// et refuse tout écart. La duplication reste, la dérive est impossible.
export const APP_VERSION = '1.1.0';
