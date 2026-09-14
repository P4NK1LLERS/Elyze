import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader } from '../components/ScreenHeader';
import { QrCode } from '../components/QrCode';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { THEMES_BY_ID } from '../data/themes';
import { haptics } from '../utils/haptics';
import { QR_CAPACITE_MAX } from '../utils/qr';
import {
  codeLignes,
  codeLisible,
  comparerDefi,
  decoderDefi,
  Defi,
  DUEL_LONGUEUR_MINIMALE,
  DuelComparaison,
  duelUrl,
  encoderDefi,
  LigneProposition,
  nettoyerCode,
  Position,
} from '../utils/duel';
import { Answers, Proposal } from '../types';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors, useThemeColor } from '../theme/ThemeContext';

// Hauteur réservée sous le contenu pendant la saisie, quand le système ne dit
// pas celle du clavier. Un clavier de téléphone en portrait fait entre 260 et
// 340 points selon l'appareil et la langue ; on prend le haut de la fourchette,
// le trop-plein ne se voyant que sous la forme d'un peu de vide sous le
// dernier bloc.
const RESERVE_CLAVIER = 340;

// Le duel : jouer les mêmes cartes que quelqu'un d'autre, puis comparer.
//
// L'ÉCRAN A QUATRE ÉTATS, et un seul est visible à la fois :
//
//  1. un défi vient d'arriver et n'est pas encore relevé ;
//  2. un défi est en cours, le paquet n'est pas fini ;
//  3. le défi est fini : la comparaison ;
//  4. aucun défi en cours : on montre le sien, ou on entre celui d'un autre.
//
// COMMENT L'ÉCHANGE SE FAIT. L'un montre son QR code, l'autre le photographie
// avec l'appareil photo ORDINAIRE de son téléphone, qui propose alors d'ouvrir
// Élyze sur le défi. L'app ne demande donc aucun accès à la caméra : elle
// n'ouvre pas d'objectif, elle reçoit un lien. Pour une application qui affirme
// ne rien collecter, réclamer la caméra pour lire un carré noir et blanc aurait
// été cher payé, et une permission refusée aurait rendu la fonction
// inutilisable sans recours. Le champ de saisie est ce recours.
//
// Rien ne transite par un serveur : le code EST la donnée.
export function DuelScreen({
  proposals,
  answers,
  graine,
  themeIds,
  adversaire,
  deckDone,
  codeRecu,
  onAccepterDefi,
  onBack,
}: {
  proposals: Proposal[];
  answers: Answers;
  graine: number;
  themeIds: string[];
  // Réponses de l'adversaire, si la partie en cours est un défi relevé.
  adversaire: Answers | undefined;
  deckDone: boolean;
  // Code arrivé par lien profond, le cas échéant.
  codeRecu: string | null;
  onAccepterDefi: (defi: Defi) => void;
  onBack: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const monCode = useMemo(
    () => (proposals.length > 0 && deckDone ? encoderDefi(graine, themeIds, answers) : null),
    [proposals.length, deckDone, graine, themeIds, answers]
  );

  const [saisie, setSaisie] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [defiRecu, setDefiRecu] = useState<Defi | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const defilement = useRef<ScrollView>(null);
  const [reserve, setReserve] = useState(0);
  const [copie, setCopie] = useState(false);
  const minuteurCopie = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (minuteurCopie.current) clearTimeout(minuteurCopie.current);
    },
    []
  );

  // POURQUOI RÉSERVER DE LA PLACE PLUTÔT QUE DE FAIRE DÉFILER.
  //
  // Depuis le SDK 54, le mode bord à bord est actif par défaut sur Android, et
  // le système ne redimensionne plus la fenêtre à l'ouverture du clavier :
  // l'application continue de dessiner sur toute la hauteur de l'écran et le
  // clavier se pose par-dessus. Faire défiler jusqu'en bas ne dégageait donc
  // rien, puisque ce bas était derrière le clavier. Il faut AJOUTER de la
  // hauteur sous le contenu pour que le champ ait où remonter.
  useEffect(() => {
    const montre = Keyboard.addListener('keyboardDidShow', (evenement) => {
      setReserve(Math.max(evenement.endCoordinates?.height ?? 0, RESERVE_CLAVIER));
      setTimeout(() => defilement.current?.scrollToEnd({ animated: true }), 60);
    });
    const cache = Keyboard.addListener('keyboardDidHide', () => setReserve(0));
    return () => {
      montre.remove();
      cache.remove();
    };
  }, []);

  const lire = useMemo(
    () => (code: string) => {
      const lu = decoderDefi(code);
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
          'Vos deux applications ne contiennent pas les mêmes propositions. Le paquet ne pourrait pas être refait à l’identique.'
        );
        return;
      }
      setErreur(null);
      setDefiRecu(lu);
    },
    []
  );

  // Un code reçu par lien profond s'ouvre sans rien demander : la personne
  // vient de scanner, elle n'a pas à appuyer sur un bouton de plus.
  useEffect(() => {
    if (codeRecu) lire(codeRecu);
  }, [codeRecu, lire]);

  const comparaison = useMemo<DuelComparaison | null>(
    () => (adversaire && deckDone ? comparerDefi(proposals, answers, adversaire) : null),
    [adversaire, deckDone, proposals, answers]
  );

  const partager = () => {
    if (!monCode) return;
    Share.share({
      message: `Je te défie sur Élyze : ${duelUrl(monCode)}\n\nOu entre ce code dans l’app : ${codeLisible(monCode)}`,
    }).catch(() => {});
  };

  // COPIER NE MET QUE LE CODE, sans la phrase qui l'accompagne dans le partage.
  // Les deux gestes ne servent pas la même chose : on partage vers quelqu'un
  // qui découvre l'app et a besoin du lien et d'une explication, on copie pour
  // recoller le code soi-même dans une conversation déjà en cours.
  const copier = () => {
    if (!monCode) return;
    Clipboard.setStringAsync(codeLisible(monCode)).catch(() => {});
    haptics.selection();
    setCopie(true);
    if (minuteurCopie.current) clearTimeout(minuteurCopie.current);
    minuteurCopie.current = setTimeout(() => setCopie(false), 2000);
  };

  const cadre = (contenu: React.ReactNode) => (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Duel" onBack={onBack} />
      <ScrollView
        ref={defilement}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl + reserve }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {contenu}
      </ScrollView>
    </SafeAreaView>
  );

  // --- 1. Un défi attend d'être relevé -------------------------------------
  if (defiRecu) {
    const partieEnCours = proposals.length > 0 && !deckDone;
    return (
      <>
        {cadre(
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Un défi t’attend</Text>
              <Text style={styles.cardHint}>
                Quelqu’un a joué {defiRecu.paquet.length} proposition
                {defiRecu.paquet.length > 1 ? 's' : ''} et te met au défi de répondre aux
                mêmes. Vous verrez ensuite, carte par carte, ce que chacun a validé.
              </Text>

              <View style={styles.defiChiffres}>
                <Chiffre
                  styles={styles}
                  valeur={String(defiRecu.paquet.length)}
                  libelle={`carte${defiRecu.paquet.length > 1 ? 's' : ''} à trancher`}
                />
                <Chiffre
                  styles={styles}
                  valeur={String(defiRecu.themeIds.length)}
                  libelle={`thème${defiRecu.themeIds.length > 1 ? 's' : ''}`}
                />
              </View>

              <Pressable
                onPress={() => (partieEnCours ? setConfirmation(true) : onAccepterDefi(defiRecu))}
                style={({ pressed }) => [styles.principal, pressed && styles.presse]}
                accessibilityRole="button"
                accessibilityLabel="Relever le défi"
              >
                <Text style={styles.principalTexte}>Relever le défi</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setDefiRecu(null);
                  setSaisie('');
                }}
                style={({ pressed }) => [styles.lien, pressed && styles.presse]}
                accessibilityRole="button"
                accessibilityLabel="Refuser ce défi"
              >
                <Text style={styles.lienTexte}>Pas maintenant</Text>
              </Pressable>
            </View>

            <Text style={styles.note}>
              Ses réponses sont déjà dans le code : rien ne sera demandé à personne, et rien ne
              passe par un serveur. Tu ne verras les siennes qu’une fois les tiennes données.
            </Text>
          </>
        )}

        <ConfirmDialog
          visible={confirmation}
          title="Remplacer ta partie en cours ?"
          message="Relever ce défi démarre une nouvelle partie sur les cartes de l’autre. Tes réponses en cours seront perdues."
          confirmLabel="Relever"
          onConfirm={() => {
            setConfirmation(false);
            onAccepterDefi(defiRecu);
          }}
          onCancel={() => setConfirmation(false)}
        />
      </>
    );
  }

  // --- 2. Défi en cours, paquet pas terminé --------------------------------
  if (adversaire && !deckDone) {
    const repondues = Object.keys(answers).length;
    return cadre(
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Défi en cours</Text>
        <Text style={styles.cardHint}>
          Tu as répondu à {repondues} des {proposals.length} cartes de ce défi. La comparaison
          s’ouvrira quand tu auras tranché la dernière : montrer ses réponses avant les tiennes
          influencerait ce que tu vas répondre.
        </Text>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.principal, pressed && styles.presse]}
          accessibilityRole="button"
          accessibilityLabel="Retourner aux cartes"
        >
          <Text style={styles.principalTexte}>Continuer le défi</Text>
        </Pressable>
      </View>
    );
  }

  // --- 3. La comparaison ----------------------------------------------------
  if (comparaison) {
    return cadre(<Comparaison comparaison={comparaison} styles={styles} colors={colors} />);
  }

  // --- 4. Montrer son code, ou entrer celui d'un autre ---------------------
  const url = monCode ? duelUrl(monCode) : null;
  // Un paquet très long donne un code qui ne tient plus dans un QR code
  // lisible. Plutôt que d'en afficher un illisible, on n'en affiche pas, et
  // on le dit : le code en clair, lui, n'a pas de limite.
  const qrPossible = url !== null && url.length <= QR_CAPACITE_MAX;

  return cadre(
    <>
      <Text style={styles.lead}>
        Défie quelqu’un : il répondra exactement aux mêmes propositions que toi, et vous verrez
        carte par carte ce que chacun a validé.
      </Text>

      {monCode ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ton défi</Text>
          <Text style={styles.cardHint}>
            Fais-le photographier avec l’appareil photo ordinaire de l’autre téléphone. Élyze
            s’ouvrira directement sur le défi.
          </Text>

          {qrPossible ? (
            <View style={styles.qrWrap}>
              <QrCode value={url} size={240} />
            </View>
          ) : (
            <View style={styles.avertissement}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.warningText} />
              <Text style={styles.avertissementTexte}>
                Ton paquet est trop long pour tenir dans un QR code lisible. Envoie le code
                ci-dessous, il fonctionne aussi bien.
              </Text>
            </View>
          )}

          <View style={styles.codeBloc}>
            {codeLignes(monCode).map((ligne, i) => (
              <Text key={i} style={styles.code} selectable>
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
              accessibilityLabel="Envoyer le défi avec un message"
            >
              <Ionicons name="share-outline" size={17} color={colors.accentText} />
              <Text style={styles.secondaireTexte} numberOfLines={1}>
                Envoyer
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Termine d’abord ton paquet</Text>
          <Text style={styles.cardHint}>
            Un défi transporte tes réponses à toutes les cartes : il ne peut donc s’envoyer
            qu’une fois la dernière tranchée. Tu peux déjà relever celui de quelqu’un d’autre.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Le défi de quelqu’un</Text>
        <Text style={styles.cardHint}>
          Si l’appareil photo ne veut rien savoir, recopie les caractères affichés sous son QR
          code. Les majuscules et les espaces n’ont pas d’importance.
        </Text>

        <TextInput
          style={styles.champ}
          value={codeLisible(saisie)}
          onChangeText={(texte) => {
            setSaisie(nettoyerCode(texte));
            setErreur(null);
          }}
          onFocus={() => setTimeout(() => defilement.current?.scrollToEnd({ animated: true }), 250)}
          placeholder="Colle ou recopie le code reçu"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          multiline
          accessibilityLabel="Code de défi de l’autre personne"
        />
        <Text style={styles.compteur}>{saisie.length} caractères</Text>

        {erreur && (
          <View style={styles.erreur}>
            <Ionicons name="close-circle-outline" size={16} color={colors.dangerText} />
            <Text style={styles.erreurTexte}>{erreur}</Text>
          </View>
        )}

        <Pressable
          onPress={() => lire(saisie)}
          disabled={saisie.length < DUEL_LONGUEUR_MINIMALE}
          style={({ pressed }) => [
            styles.principal,
            saisie.length < DUEL_LONGUEUR_MINIMALE && styles.principalEteint,
            pressed && saisie.length >= DUEL_LONGUEUR_MINIMALE && styles.presse,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: saisie.length < DUEL_LONGUEUR_MINIMALE }}
          accessibilityLabel="Ouvrir ce défi"
        >
          <Text style={styles.principalTexte}>Ouvrir le défi</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>
        Un code de défi contient les cartes tirées et tes réponses à chacune. C’est plus que ton
        résultat : ne le montre qu’à des gens à qui tu confierais tes opinions. Rien ne passe par
        un serveur, tout est dans les caractères que vous échangez.
      </Text>
    </>
  );
}

// --- La comparaison elle-même ----------------------------------------------

function Comparaison({
  comparaison,
  styles,
  colors,
}: {
  comparaison: DuelComparaison;
  styles: ReturnType<typeof makeStyles>;
  colors: ColorTokens;
}) {
  const { lignes, tranchees, accords, mesPremiers, sesPremiers, memePremier } = comparaison;
  const desaccords = tranchees - accords;

  return (
    <>
      <View style={styles.resume}>
        <Text style={styles.resumeChiffre}>
          {accords}
          <Text style={styles.resumeSur}> / {tranchees}</Text>
        </Text>
        <Text style={styles.resumeLibelle}>
          propositions où vous êtes du même avis, sur celles que vous avez tranchées tous les
          deux
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {memePremier ? 'Vous avez le même premier' : 'Vos deux têtes de classement'}
        </Text>
        <Text style={styles.cardHint}>
          Vous avez répondu aux mêmes cartes : ces deux classements sont directement
          comparables.
        </Text>
        <View style={styles.tetes}>
          <Tete titre="Toi" candidats={mesPremiers.map((c) => c.name)} styles={styles} />
          {!memePremier && (
            <Tete titre="L’autre" candidats={sesPremiers.map((c) => c.name)} styles={styles} />
          )}
        </View>
      </View>

      {/* LA LISTE NE NOMME AUCUN CANDIDAT, et c'est délibéré. Ce qui intéresse
          ici est ce que vous avez répondu, pas qui portait la mesure : la
          proposition se juge sur son texte, exactement comme pendant le swipe.
          Le thème, lui, reste affiché : il situe sans rien trahir. */}
      <View style={styles.legende}>
        <Text style={styles.legendeTexte}>
          {desaccords} désaccord{desaccords > 1 ? 's' : ''} d’abord, puis vos accords
        </Text>
      </View>

      {lignes.map((ligne) => (
        <LigneDuel key={ligne.proposal.id} ligne={ligne} styles={styles} colors={colors} />
      ))}
    </>
  );
}

function Tete({
  titre,
  candidats,
  styles,
}: {
  titre: string;
  candidats: string[];
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.tete}>
      <Text style={styles.teteTitre}>{titre}</Text>
      <Text style={styles.teteNom}>{candidats.length > 0 ? candidats.join(', ') : 'aucun'}</Text>
    </View>
  );
}

const MARQUES: Record<Position, { icone: keyof typeof Ionicons.glyphMap; mot: string }> = {
  valide: { icone: 'checkmark-circle', mot: 'validé' },
  rejete: { icone: 'close-circle', mot: 'rejeté' },
  sansAvis: { icone: 'remove-circle-outline', mot: 'sans avis' },
};

function LigneDuel({
  ligne,
  styles,
  colors,
}: {
  ligne: LigneProposition;
  styles: ReturnType<typeof makeStyles>;
  colors: ColorTokens;
}) {
  const getThemeColor = useThemeColor();
  const theme = THEMES_BY_ID[ligne.proposal.themeId];
  const teinte = (p: Position) =>
    p === 'valide' ? colors.successText : p === 'rejete' ? colors.dangerText : colors.textMuted;

  return (
    <View style={[styles.ligne, ligne.desaccord && styles.ligneDesaccord]}>
      <View style={styles.ligneEntete}>
        {theme && (
          <View style={styles.themePastille}>
            <View style={[styles.themePoint, { backgroundColor: getThemeColor(theme.id) }]} />
            <Text style={styles.themeNom} numberOfLines={1}>
              {theme.label}
            </Text>
          </View>
        )}
        {ligne.desaccord && <Text style={styles.etiquetteDesaccord}>désaccord</Text>}
        {ligne.accord && <Text style={styles.etiquetteAccord}>d’accord</Text>}
      </View>

      <Text style={styles.ligneTexte}>{ligne.proposal.text}</Text>

      <View style={styles.reponses}>
        {(
          [
            ['Toi', ligne.mienne],
            ['L’autre', ligne.sienne],
          ] as [string, Position][]
        ).map(([qui, p]) => (
          <View key={qui} style={styles.reponse}>
            <Ionicons name={MARQUES[p].icone} size={15} color={teinte(p)} />
            <Text style={styles.reponseQui}>{qui}</Text>
            <Text style={[styles.reponseMot, { color: teinte(p) }]}>{MARQUES[p].mot}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Chiffre({
  styles,
  valeur,
  libelle,
}: {
  styles: ReturnType<typeof makeStyles>;
  valeur: string;
  libelle: string;
}) {
  return (
    <View style={styles.chiffre}>
      <Text style={styles.chiffreValeur}>{valeur}</Text>
      <Text style={styles.chiffreLibelle}>{libelle}</Text>
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

    defiChiffres: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginVertical: spacing.xs,
    },
    chiffre: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.accentSoft,
      borderRadius: radii.md,
      paddingVertical: spacing.md,
      gap: 2,
    },
    chiffreValeur: {
      fontSize: fonts.title,
      fontWeight: '800',
      color: colors.accentText,
      fontVariant: ['tabular-nums'],
    },
    chiffreLibelle: {
      fontSize: fonts.tiny,
      fontWeight: '600',
      color: colors.accentText,
      textAlign: 'center',
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
    // Le code en clair, bien espacé : il est fait pour être recopié caractère
    // par caractère par quelqu'un qui regarde un écran.
    code: {
      fontSize: fonts.small,
      fontWeight: '700',
      letterSpacing: 1.4,
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
      textAlign: 'center',
    },

    champ: {
      minHeight: 88,
      maxHeight: 160,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      fontSize: fonts.small + 1,
      fontWeight: '700',
      letterSpacing: 1.1,
      color: colors.textPrimary,
      textAlignVertical: 'top',
    },
    compteur: {
      alignSelf: 'flex-end',
      fontSize: fonts.tiny,
      fontWeight: '600',
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
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
    lien: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    lienTexte: {
      fontSize: fonts.small,
      fontWeight: '700',
      color: colors.textSecondary,
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
    rangeeBoutons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    moitie: {
      flex: 1,
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
    resumeSur: {
      fontSize: fonts.title,
      fontWeight: '700',
    },
    resumeLibelle: {
      fontSize: fonts.small,
      fontWeight: '600',
      color: colors.accentText,
      textAlign: 'center',
    },

    tetes: {
      gap: spacing.sm,
      marginTop: spacing.xs,
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
      paddingHorizontal: spacing.xs,
    },
    legendeTexte: {
      fontSize: fonts.tiny,
      fontWeight: '700',
      color: colors.textMuted,
    },

    ligne: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.xs,
    },
    // Un liseré, pas un fond : le désaccord se repère au coup d'œil sans que
    // la carte change de nature.
    ligneDesaccord: {
      borderColor: colors.danger,
    },
    ligneEntete: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    themePastille: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    themePoint: {
      width: 8,
      height: 8,
      borderRadius: radii.pill,
    },
    themeNom: {
      flex: 1,
      fontSize: fonts.tiny,
      fontWeight: '700',
      color: colors.textMuted,
    },
    etiquetteDesaccord: {
      fontSize: fonts.tiny,
      fontWeight: '800',
      color: colors.dangerText,
    },
    etiquetteAccord: {
      fontSize: fonts.tiny,
      fontWeight: '800',
      color: colors.successText,
    },
    ligneTexte: {
      fontSize: fonts.small,
      lineHeight: fonts.small * 1.4,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    reponses: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: 2,
    },
    reponse: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    reponseQui: {
      fontSize: fonts.tiny,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    reponseMot: {
      fontSize: fonts.tiny,
      fontWeight: '700',
    },
  });
}
