import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { SwipeCard, SwipeDirection } from './SwipeCard';
import { Proposal, ThemeTag } from '../types';

export type SwipeDeckHandle = {
  // Renvoie `false` quand il n'y a aucune carte à faire sortir. L'appelant en
  // a besoin : c'est ce qui lui permet de n'écarter ses boutons que si une
  // animation a réellement démarré, sans quoi un appui dans le vide les
  // laisserait éteints jusqu'à la fin des temps.
  swipeTop: (direction: SwipeDirection) => boolean;
};

type Props = {
  proposals: Proposal[];
  currentIndex: number;
  themesById: Record<string, ThemeTag>;
  onSwipe: (proposalId: string, direction: SwipeDirection) => void;
  // Ouvre le débat de la carte du dessus. Elle seule est interactive.
  onOpenDebate: (proposal: Proposal) => void;
};

const STACK_WINDOW = 3;

export const SwipeDeck = forwardRef<SwipeDeckHandle, Props>(function SwipeDeck(
  { proposals, currentIndex, themesById, onSwipe, onOpenDebate }: Props,
  ref
) {
  const topTriggerRef = useRef<((direction: SwipeDirection) => void) | null>(null);

  // Hauteur réellement disponible pour une carte.
  //
  // La carte dimensionne son texte sur un budget de place, et ce budget
  // dépendait d'une constante : la même sur un téléphone de 640 px de haut et
  // sur un grand écran. Sur les petits, la mesure et son « en clair » se
  // chevauchaient — un défaut invisible tant que la moitié des cartes n'avait
  // pas d'explication, et qui s'est vu dès qu'elles en ont toutes eu une.
  // On mesure donc une fois, ici, et chaque carte s'y adapte.
  const [cardHeight, setCardHeight] = useState(0);
  const mesurer = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    setCardHeight((precedente) => (Math.abs(precedente - height) < 1 ? precedente : height));
  };

  useImperativeHandle(ref, () => ({
    swipeTop: (direction) => {
      const trigger = topTriggerRef.current;
      if (!trigger) return false;
      trigger(direction);
      return true;
    },
  }));

  // Les cartes sont rendues de la plus profonde vers celle du dessus : sans
  // `zIndex`, c'est l'ordre de rendu qui décide de l'empilement, le dernier
  // enfant étant dessiné au-dessus. Piloter la superposition par `zIndex`
  // obligeait Android à retrier les vues de la pile — à chaque image quand il
  // était dans le style animé, à chaque swipe quand il était statique — et
  // cela se voyait (tremblement, puis flash). Ici, plus rien à trier.
  const stack = proposals
    .slice(currentIndex, currentIndex + STACK_WINDOW)
    .map((proposal, stackPosition) => ({ proposal, stackPosition }))
    .reverse();

  return (
    <View style={styles.container} onLayout={mesurer}>
      {stack.map(({ proposal, stackPosition }) => (
        <SwipeCard
          key={proposal.id}
          proposal={proposal}
          themeTag={themesById[proposal.themeId]}
          stackPosition={stackPosition}
          cardHeight={cardHeight}
          onSwiped={(direction) => onSwipe(proposal.id, direction)}
          onOpenDebate={stackPosition === 0 ? () => onOpenDebate(proposal) : undefined}
          onBecomeTop={
            stackPosition === 0
              ? (trigger) => {
                  topTriggerRef.current = trigger;
                }
              : undefined
          }
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
