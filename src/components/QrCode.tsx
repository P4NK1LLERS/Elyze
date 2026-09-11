import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { qrMatrix } from '../utils/qr';

// Affichage d'un QR code, dessiné avec des vues ordinaires.
//
// TOUJOURS SOMBRE SUR CLAIR, quel que soit le thème de l'app. C'est une image
// destinée à un appareil photo, pas à l'œil : les décodeurs attendent des
// modules sombres sur fond clair, et beaucoup refusent purement et simplement
// l'inverse. Un QR code blanc sur fond noir, en thème sombre, aurait été
// parfaitement joli et illisible la moitié du temps.
//
// LA MARGE DE QUATRE MODULES N'EST PAS UN ESPACEMENT. La norme l'appelle
// « zone de silence » et l'impose : c'est elle qui permet au décodeur de
// trouver les bords du code. Posé bord à bord sur un fond coloré, le même code
// devient introuvable.
const ZONE_SILENCE = 4;

// Le noir des modules. Un vrai #000 face au #FFF donne le contraste maximal ;
// on reste très légèrement en deçà pour que le code s'accorde à l'app sans
// rien céder de mesurable à la lecture.
const SOMBRE = '#131218';
const CLAIR = '#FFFFFF';

export function QrCode({ value, size }: { value: string; size: number }) {
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

  return (
    <View
      style={[styles.cadre, { width: cote, height: cote, padding: module * ZONE_SILENCE }]}
      accessibilityRole="image"
      accessibilityLabel="QR code de ton résultat, à faire scanner"
    >
      {matrice.modules.map((ligne, index) => (
        <Rangee key={index} ligne={ligne} module={module} />
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
function Rangee({ ligne, module }: { ligne: boolean[]; module: number }) {
  const suites = useMemo(() => {
    const sortie: { sombre: boolean; longueur: number }[] = [];
    for (const sombre of ligne) {
      const derniere = sortie[sortie.length - 1];
      if (derniere && derniere.sombre === sombre) derniere.longueur++;
      else sortie.push({ sombre, longueur: 1 });
    }
    return sortie;
  }, [ligne]);

  return (
    <View style={[styles.rangee, { height: module }]}>
      {suites.map((suite, index) => (
        <View
          key={index}
          style={{
            width: suite.longueur * module,
            height: module,
            backgroundColor: suite.sombre ? SOMBRE : CLAIR,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: {
    backgroundColor: CLAIR,
    // Pas d'arrondi : un coin rogné mordrait sur la zone de silence.
    borderRadius: 0,
  },
  rangee: {
    flexDirection: 'row',
  },
});
