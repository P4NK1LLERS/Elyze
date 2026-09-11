import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { qrMatrix } from '../utils/qr';
import { QR_BACKGROUND, qrModuleColor } from '../theme/qrColors';
import { radii } from '../theme';
import { useColors } from '../theme/ThemeContext';

// Affichage d'un QR code, dessiné avec des vues ordinaires.
//
// AUX COULEURS DE L'APP, MAIS PAS À N'IMPORTE QUEL PRIX. Les modules prennent
// l'accent choisi dans les réglages, assombri juste ce qu'il faut pour rester
// franchement lisible par un appareil photo (voir theme/qrColors.ts, qui porte
// tout le raisonnement). Le fond, lui, reste blanc en toutes circonstances,
// thème sombre compris : un décodeur attend des modules sombres sur fond
// clair, et beaucoup refusent l'inverse.
//
// LA MARGE DE QUATRE MODULES N'EST PAS UN ESPACEMENT. La norme l'appelle
// « zone de silence » et l'impose : c'est elle qui permet au décodeur de
// trouver les bords du code. Posé bord à bord sur un fond coloré, le même code
// devient introuvable.
const ZONE_SILENCE = 4;

// Côté des trois repères de position, en modules. Valeur imposée par la norme.
const REPERE = 7;

export function QrCode({ value, size }: { value: string; size: number }) {
  const colors = useColors();
  const couleur = useMemo(() => qrModuleColor(colors.accent), [colors.accent]);

  const { matrice, module, cote } = useMemo(() => {
    const m = qrMatrix(value);
    const total = m.size + ZONE_SILENCE * 2;
    // Un module doit faire un nombre ENTIER de pixels. Avec une fraction, les
    // arrondis de rendu laissent des coutures blanches d'un pixel en travers
    // des modules sombres, et le décodeur y voit des transitions qui n'ont
    // pas lieu d'être.
    const taille = Math.max(1, Math.floor(size / total));
    return { matrice: m, module: taille, cote: taille * total };
  }, [value, size]);

  // Coins des trois repères, en coordonnées de module. Mémoïsés avec le test
  // d'appartenance : chaque rangée s'en sert pour décider quoi peindre, et une
  // fonction recréée à chaque rendu ferait recalculer les vingt-neuf rangées
  // pour rien.
  const { repères, dansUnRepere } = useMemo(() => {
    const coins: [number, number][] = [
      [0, 0],
      [0, matrice.size - REPERE],
      [matrice.size - REPERE, 0],
    ];
    return {
      repères: coins,
      dansUnRepere: (ligne: number, colonne: number) =>
        coins.some(
          ([l, c]) => ligne >= l && ligne < l + REPERE && colonne >= c && colonne < c + REPERE
        ),
    };
  }, [matrice.size]);

  return (
    <View
      style={[
        styles.cadre,
        {
          width: cote,
          height: cote,
          padding: module * ZONE_SILENCE,
          // L'arrondi ne mord jamais sur la zone de silence : il reste bien en
          // deçà de ses quatre modules d'épaisseur.
          borderRadius: Math.min(radii.lg, module * ZONE_SILENCE),
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel="QR code de ton résultat, à faire scanner"
    >
      {matrice.modules.map((ligne, index) => (
        <Rangee
          key={index}
          ligne={ligne}
          numero={index}
          module={module}
          couleur={couleur}
          exclure={dansUnRepere}
        />
      ))}

      {/* LES TROIS REPÈRES, REDESSINÉS AVEC DES COINS ARRONDIS.
          C'est la seule liberté prise avec la forme du code, et elle est sans
          danger : un décodeur reconnaît un repère à la suite de proportions
          1:1:3:1:1 qu'il rencontre en le balayant par le milieu, et arrondir
          les angles ne touche pas à ces lignes-là. C'est d'ailleurs la
          retouche que font tous les générateurs de QR codes stylisés.
          Vérifié tout de même en relisant le rendu réel avec un décodeur. */}
      {repères.map(([ligne, colonne]) => (
        <View
          key={`${ligne}-${colonne}`}
          style={{
            // En style et non en propriété, cette dernière forme étant
            // dépréciée.
            pointerEvents: 'none',
            position: 'absolute',
            top: module * (ZONE_SILENCE + ligne),
            left: module * (ZONE_SILENCE + colonne),
            width: module * REPERE,
            height: module * REPERE,
            borderWidth: module,
            borderColor: couleur,
            borderRadius: module * 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: module * 3,
              height: module * 3,
              backgroundColor: couleur,
              borderRadius: module,
            }}
          />
        </View>
      ))}
    </View>
  );
}

// Une rangée, découpée en SUITES de même couleur plutôt qu'en modules.
//
// Une vue par module ferait 841 vues pour un code de version 3, et plus de
// 1600 en version 6 : de quoi faire ramer l'écran sur un téléphone modeste.
// Les modules voisins de même couleur se fondent donc en un seul rectangle, ce
// qui divise le compte par cinq ou six sans rien changer à l'image.
function Rangee({
  ligne,
  numero,
  module,
  couleur,
  exclure,
}: {
  ligne: boolean[];
  numero: number;
  module: number;
  couleur: string;
  // Les modules des repères ne sont pas peints ici : ils sont redessinés
  // par-dessus, arrondis. Les laisser dessous ferait ressortir leurs angles
  // droits derrière les coins adoucis.
  exclure: (ligne: number, colonne: number) => boolean;
}) {
  const suites = useMemo(() => {
    const sortie: { sombre: boolean; longueur: number }[] = [];
    ligne.forEach((sombre, colonne) => {
      const peint = sombre && !exclure(numero, colonne);
      const derniere = sortie[sortie.length - 1];
      if (derniere && derniere.sombre === peint) derniere.longueur++;
      else sortie.push({ sombre: peint, longueur: 1 });
    });
    return sortie;
  }, [ligne, numero, exclure]);

  return (
    <View style={[styles.rangee, { height: module }]}>
      {suites.map((suite, index) => (
        <View
          key={index}
          style={{
            width: suite.longueur * module,
            height: module,
            backgroundColor: suite.sombre ? couleur : QR_BACKGROUND,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: {
    backgroundColor: QR_BACKGROUND,
    // Le code est toujours sur blanc : l'ombre est ce qui le détache d'un fond
    // sombre sans avoir à lui coller une bordure, laquelle empiéterait sur la
    // zone de silence.
    shadowColor: '#1A1730',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 4,
  },
  rangee: {
    flexDirection: 'row',
  },
});
