import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { haptics } from '../utils/haptics';
import { ScreenHeader } from '../components/ScreenHeader';
import { QrCode } from '../components/QrCode';
import { Avatar } from '../components/Avatar';
import { CANDIDATES } from '../data/candidates';
import { computeResults } from '../utils/scoring';
import {
  codeLignes,
  codeLisible,
  comparerDuel,
  decoderDuel,
  DuelComparaison,
  DuelResultat,
  duelUrl,
  encoderDuel,
} from '../utils/duel';
import { Answers, Proposal } from '../types';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';

// Le duel : mettre son classement à côté de celui de quelqu'un d'autre.
//
// COMMENT L'ÉCHANGE SE FAIT, ET POURQUOI AINSI.
//
// L'un montre son QR code, l'autre le photographie avec l'appareil photo
// ORDINAIRE de son téléphone, qui propose alors d'ouvrir Élyze sur la
// comparaison. L'app ne demande donc aucun accès à la caméra : elle n'ouvre
// pas d'objectif, elle reçoit un lien. Pour une application qui affirme ne
// rien collecter, réclamer la caméra pour lire un carré noir et blanc aurait
// été cher payé — et une permission refusée aurait rendu la fonction
// inutilisable, sans recours.
//
// Le champ de saisie juste en dessous est ce recours, pour les appareils
// photo qui ne savent pas ouvrir un lien, et pour un code reçu par message.
//
// Rien ne transite par un serveur : le code EST la donnée. Tout ce qui
// s'affiche ici a été lu dans les vingt-six caractères que l'autre a montrés.
export function DuelScreen({
  proposals,
  answers,
  deckDone,
  codeRecu,
  onBack,
}: {
  proposals: Proposal[];
  answers: Answers;
  deckDone: boolean;
  // Code arrivé par lien profond, le cas échéant : la comparaison s'ouvre
  // alors directement.
  codeRecu: string | null;
  onBack: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const mesResultats = useMemo(
    () => computeResults(answers, proposals, CANDIDATES),
    [answers, proposals]
  );
  const monCode = useMemo(
    () => (mesResultats.length > 0 ? encoderDuel(mesResultats) : null),
    [mesResultats]
  );

  const [saisie, setSaisie] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [autre, setAutre] = useState<DuelResultat | null>(null);
  // « Copié » remplace le libellé du bouton pendant deux secondes.
  //
  // Sans cet aveu, copier ne produit RIEN de perceptible : le presse-papier
  // est invisible, et l'appui se lit comme un bouton mort. Android affiche
  // parfois un message système, iOS jamais, et sur aucun des deux on ne peut
  // compter.
  const [copie, setCopie] = useState(false);
  const minuteurCopie = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (minuteurCopie.current) clearTimeout(minuteurCopie.current);
    },
    []
  );

  const lire = useMemo(
    () => (code: string) => {
      const lu = decoderDuel(code);
      if (lu === 'illisible') {
        setErreur('Ce code n’est pas lisible. Vérifie qu’il est recopié en entier.');
        return;
      }
      if (lu === 'format') {
        setErreur(
          'Ce code vient d’une autre version de l’app. Mettez-vous tous les deux à jour pour le comparer.'
        );
        return;
      }
      if (lu === 'catalogue') {
        setErreur(
          'Vos deux applications ne contiennent pas les mêmes propositions. Les pourcentages ne porteraient pas sur les mêmes mesures.'
        );
        return;
      }
      setErreur(null);
      setAutre(lu);
    },
    []
  );

  // Un code reçu par lien profond ouvre la comparaison sans rien demander :
  // la personne vient de scanner, elle n'a pas à appuyer sur un bouton de
  // plus pour voir ce qu'elle est venue voir.
  useEffect(() => {
    if (codeRecu) lire(codeRecu);
  }, [codeRecu, lire]);

  const comparaison = useMemo<DuelComparaison | null>(
    () => (autre ? comparerDuel(mesResultats, autre) : null),
    [autre, mesResultats]
  );

  const partager = () => {
    if (!monCode) return;
    Share.share({
      message: `Compare ton classement Élyze au mien : ${duelUrl(monCode)}\n\nOu entre ce code dans l’app : ${codeLisible(monCode)}`,
    }).catch(() => {});
  };

  // COPIER NE MET QUE LE CODE, sans la phrase qui l'accompagne dans le
  // partage. Les deux gestes ne servent pas la même chose : on partage vers
  // quelqu'un qui découvre l'app et a besoin du lien et d'une explication, on
  // copie pour recoller le code soi-même quelque part, dans une conversation
  // déjà en cours ou dans le champ de l'autre téléphone. Y joindre un message
  // obligerait alors à faire le ménage après collage.
  //
  // C'est la forme AFFICHÉE qui est copiée, groupes de quatre compris : ce
  // qu'on lit à l'écran est ce qu'on obtient, et la lecture du code ignore de
  // toute façon les espaces.
  const copier = () => {
    if (!monCode) return;
    Clipboard.setStringAsync(codeLisible(monCode)).catch(() => {});
    haptics.selection();
    setCopie(true);
    if (minuteurCopie.current) clearTimeout(minuteurCopie.current);
    minuteurCopie.current = setTimeout(() => setCopie(false), 2000);
  };

  if (comparaison && autre) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader
          title="Duel"
          onBack={() => {
            setAutre(null);
            setSaisie('');
          }}
        />
        <Comparaison
          comparaison={comparaison}
          autre={autre}
          deckDone={deckDone}
          styles={styles}
          colors={colors}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Duel" onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          Montre ton code à quelqu’un qui a fait le test, ou entre le sien : vous verrez vos
          deux classements côte à côte, candidat par candidat.
        </Text>

        {monCode ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ton code</Text>
            <Text style={styles.cardHint}>
              Fais-le photographier avec l’appareil photo ordinaire de l’autre téléphone. Élyze
              s’ouvrira directement sur la comparaison.
            </Text>

            <View style={styles.qrWrap}>
              <QrCode value={duelUrl(monCode)} size={240} />
            </View>

            <View style={styles.codeBloc}>
              {codeLignes(monCode).map((ligne) => (
                <Text key={ligne} style={styles.code} selectable>
                  {ligne}
                </Text>
              ))}
            </View>

            <View style={styles.rangeeBoutons}>
              <Pressable
                onPress={copier}
                style={({ pressed }) => [styles.secondaire, styles.moitie, pressed && styles.presse]}
                accessibilityRole="button"
                accessibilityLabel={copie ? 'Code copié' : 'Copier le code seul'}
              >
                <Ionicons
                  name={copie ? 'checkmark' : 'copy-outline'}
                  size={17}
                  color={colors.accentText}
                />
                <Text style={styles.secondaireTexte} numberOfLines={1}>
                  {copie ? 'Copié' : 'Copier'}
                </Text>
              </Pressable>
              <Pressable
                onPress={partager}
                style={({ pressed }) => [styles.secondaire, styles.moitie, pressed && styles.presse]}
                accessibilityRole="button"
                accessibilityLabel="Envoyer le code avec un message"
              >
                <Ionicons name="share-outline" size={17} color={colors.accentText} />
                <Text style={styles.secondaireTexte} numberOfLines={1}>
                  Envoyer
                </Text>
              </Pressable>
            </View>

            {!deckDone && (
              <View style={styles.avertissement}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.warningText} />
                <Text style={styles.avertissementTexte}>
                  Ton paquet n’est pas terminé : ce code porte un classement encore provisoire.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pas encore de code</Text>
            <Text style={styles.cardHint}>
              Réponds « j’adhère » ou « pas pour moi » à au moins une proposition : sans réponse
              comptabilisée, il n’y a pas de classement à comparer.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Le code de l’autre</Text>
          <Text style={styles.cardHint}>
            Si l’appareil photo ne veut rien savoir, recopie les caractères affichés sous son QR
            code. Les majuscules et les espaces n’ont pas d’importance.
          </Text>

          <TextInput
            style={styles.champ}
            value={saisie}
            onChangeText={(texte) => {
              setSaisie(texte);
              setErreur(null);
            }}
            placeholder="Par exemple 04A2 9K7M 1TPZ…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="Code de duel de l’autre personne"
          />

          {erreur && (
            <View style={styles.erreur}>
              <Ionicons name="close-circle-outline" size={16} color={colors.dangerText} />
              <Text style={styles.erreurTexte}>{erreur}</Text>
            </View>
          )}

          <Pressable
            onPress={() => lire(saisie)}
            disabled={saisie.trim().length === 0}
            style={({ pressed }) => [
              styles.principal,
              saisie.trim().length === 0 && styles.principalEteint,
              pressed && saisie.trim().length > 0 && styles.presse,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: saisie.trim().length === 0 }}
            accessibilityLabel="Comparer avec ce code"
          >
            <Text style={styles.principalTexte}>Comparer</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>
          Le code ne contient que les onze pourcentages et le nombre de réponses. Ni tes
          réponses proposition par proposition, ni ton nom. Rien ne passe par un serveur : tout
          est dans les caractères que vous échangez.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- La comparaison elle-même ----------------------------------------------

function Comparaison({
  comparaison,
  autre,
  deckDone,
  styles,
  colors,
}: {
  comparaison: DuelComparaison;
  autre: DuelResultat;
  deckDone: boolean;
  styles: ReturnType<typeof makeStyles>;
  colors: ColorTokens;
}) {
  const { lignes, communs, ecartMoyen, mesPremiers, sesPremiers, memePremier } = comparaison;

  if (communs === 0) {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rien à comparer</Text>
          <Text style={styles.cardHint}>
            Vos deux parties n’ont aucun candidat en commun : vous avez sans doute joué sur des
            thèmes différents, et vos paquets ne contenaient pas les mêmes personnes.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* L'ÉCART EST DONNÉ EN POINTS, PAS EN POURCENTAGE DE RESSEMBLANCE.
          « Vous vous ressemblez à 87 % » aurait été plus flatteur et
          entièrement inventé : ce nombre ne serait la mesure de rien. L'écart
          moyen, lui, se lit directement sur les barres juste en dessous, et
          chacun peut vérifier d'où il sort. */}
      <View style={styles.resume}>
        <Text style={styles.resumeChiffre}>{ecartMoyen}</Text>
        <Text style={styles.resumeLibelle}>
          points d’écart en moyenne, sur {communs} candidat{communs > 1 ? 's' : ''} comparé
          {communs > 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {memePremier ? 'Vous avez le même premier' : 'Vos deux têtes de classement'}
        </Text>
        <View style={styles.tetes}>
          <Tete titre="Toi" candidats={mesPremiers} styles={styles} />
          {!memePremier && <Tete titre="L’autre" candidats={sesPremiers} styles={styles} />}
        </View>
      </View>

      <View style={styles.legende}>
        <View style={styles.legendeEntree}>
          <View style={[styles.pastille, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendeTexte}>Toi</Text>
        </View>
        <View style={styles.legendeEntree}>
          <View style={[styles.pastille, { backgroundColor: colors.neutralFill }]} />
          <Text style={styles.legendeTexte}>L’autre</Text>
        </View>
        <Text style={styles.legendeNote}>Le plus gros désaccord en premier</Text>
      </View>

      {lignes.map((ligne) => (
        <LigneDuel key={ligne.candidate.id} ligne={ligne} styles={styles} colors={colors} />
      ))}

      <Text style={styles.note}>
        L’autre a répondu à {autre.reponses} proposition{autre.reponses > 1 ? 's' : ''} comptabilisée
        {autre.reponses > 1 ? 's' : ''}.{' '}
        {deckDone
          ? 'Vos deux paquets sont tirés au hasard : vous n’avez pas répondu aux mêmes cartes, et c’est normal que les pourcentages diffèrent.'
          : 'Ton propre classement est encore provisoire : il bougera d’ici la fin de ton paquet.'}
      </Text>
    </ScrollView>
  );
}

function Tete({
  titre,
  candidats,
  styles,
}: {
  titre: string;
  candidats: { id: string; name: string }[];
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.tete}>
      <Text style={styles.teteTitre}>{titre}</Text>
      <Text style={styles.teteNom}>
        {candidats.length > 0 ? candidats.map((c) => c.name).join(', ') : 'aucun'}
      </Text>
    </View>
  );
}

function LigneDuel({
  ligne,
  styles,
  colors,
}: {
  ligne: DuelComparaison['lignes'][number];
  styles: ReturnType<typeof makeStyles>;
  colors: ColorTokens;
}) {
  const { candidate, mien, sien, ecart } = ligne;

  return (
    <View style={styles.ligne}>
      <Avatar candidate={candidate} size={34} />
      <View style={styles.ligneCorps}>
        <View style={styles.ligneEntete}>
          <Text style={styles.ligneNom} numberOfLines={1}>
            {candidate.name}
          </Text>
          {ecart !== null ? (
            <Text style={styles.ligneEcart}>{ecart} pt{ecart > 1 ? 's' : ''}</Text>
          ) : (
            <Text style={styles.ligneAbsent}>non comparable</Text>
          )}
        </View>

        <Barre valeur={mien} couleur={colors.accent} styles={styles} />
        <Barre valeur={sien} couleur={colors.neutralFill} styles={styles} />
      </View>
    </View>
  );
}

function Barre({
  valeur,
  couleur,
  styles,
}: {
  valeur: number | null;
  couleur: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.barreRangee}>
      <View style={styles.barrePiste}>
        {valeur !== null && (
          <View style={[styles.barreRemplissage, { width: `${valeur}%`, backgroundColor: couleur }]} />
        )}
      </View>
      <Text style={styles.barreValeur}>{valeur !== null ? `${valeur} %` : '—'}</Text>
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    lead: {
      fontSize: fonts.small + 1,
      lineHeight: (fonts.small + 1) * 1.45,
      color: colors.textSecondary,
      paddingHorizontal: spacing.xs,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: fonts.body,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    cardHint: {
      fontSize: fonts.tiny + 1,
      lineHeight: (fonts.tiny + 1) * 1.45,
      color: colors.textSecondary,
    },

    qrWrap: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    codeBloc: {
      alignItems: 'center',
      gap: 2,
      paddingVertical: spacing.xs,
    },
    // Le code en clair, en chasse fixe et bien espacé : il est fait pour être
    // recopié caractère par caractère par quelqu'un qui regarde un écran.
    code: {
      alignSelf: 'center',
      fontSize: fonts.small + 1,
      fontWeight: '700',
      letterSpacing: 1.5,
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
      textAlign: 'center',
    },

    champ: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      fontSize: fonts.body,
      fontWeight: '700',
      letterSpacing: 1.2,
      color: colors.textPrimary,
    },

    principal: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing.md,
      marginTop: spacing.xs,
    },
    principalEteint: {
      opacity: 0.4,
    },
    principalTexte: {
      fontSize: fonts.body,
      fontWeight: '700',
      color: colors.onAccent,
    },
    rangeeBoutons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    // Les deux actions se valent : même poids visuel, même largeur. Donner le
    // plein d'accent à l'une des deux dirait qu'elle est la bonne, alors que
    // le choix dépend seulement de ce qu'on fait ensuite du code.
    moitie: {
      flex: 1,
    },
    secondaire: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs + 2,
      backgroundColor: colors.accentSoft,
      borderRadius: radii.pill,
      paddingVertical: spacing.sm + 4,
    },
    secondaireTexte: {
      fontSize: fonts.small + 1,
      fontWeight: '700',
      color: colors.accentText,
    },
    presse: {
      opacity: 0.7,
    },

    avertissement: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.warningSoft,
      borderRadius: radii.md,
      padding: spacing.sm + 2,
    },
    avertissementTexte: {
      flex: 1,
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.45,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    erreur: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.dangerSoft,
      borderRadius: radii.md,
      padding: spacing.sm + 2,
    },
    erreurTexte: {
      flex: 1,
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.45,
      fontWeight: '600',
      color: colors.textPrimary,
    },

    note: {
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.5,
      color: colors.textMuted,
      paddingHorizontal: spacing.xs,
    },

    resume: {
      alignItems: 'center',
      backgroundColor: colors.accentSoft,
      borderRadius: radii.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      gap: 2,
    },
    resumeChiffre: {
      fontSize: fonts.title + 12,
      fontWeight: '800',
      letterSpacing: -1,
      color: colors.accentText,
      fontVariant: ['tabular-nums'],
    },
    resumeLibelle: {
      fontSize: fonts.small,
      fontWeight: '600',
      color: colors.accentText,
      textAlign: 'center',
    },

    tetes: {
      gap: spacing.sm,
    },
    tete: {
      gap: 1,
    },
    teteTitre: {
      fontSize: fonts.tiny,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.textMuted,
    },
    teteNom: {
      fontSize: fonts.small + 1,
      fontWeight: '700',
      color: colors.textPrimary,
    },

    legende: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    legendeEntree: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    pastille: {
      width: 10,
      height: 10,
      borderRadius: radii.pill,
    },
    legendeTexte: {
      fontSize: fonts.tiny,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    legendeNote: {
      flex: 1,
      textAlign: 'right',
      fontSize: fonts.tiny,
      color: colors.textMuted,
    },

    ligne: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
    },
    ligneCorps: {
      flex: 1,
      gap: 3,
    },
    ligneEntete: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    ligneNom: {
      flex: 1,
      fontSize: fonts.small,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    ligneEcart: {
      fontSize: fonts.tiny,
      fontWeight: '800',
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    ligneAbsent: {
      fontSize: fonts.tiny,
      fontWeight: '600',
      color: colors.textMuted,
    },

    barreRangee: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    barrePiste: {
      flex: 1,
      height: 7,
      borderRadius: radii.pill,
      backgroundColor: colors.neutralTrack,
      overflow: 'hidden',
    },
    barreRemplissage: {
      height: '100%',
      borderRadius: radii.pill,
    },
    barreValeur: {
      width: 42,
      textAlign: 'right',
      fontSize: fonts.tiny,
      fontWeight: '700',
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
  });
}
