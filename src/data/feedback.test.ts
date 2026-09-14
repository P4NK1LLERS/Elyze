import fs from 'fs';
import path from 'path';
import { APP_VERSION } from './appInfo';
import {
  buildFeedbackMailto,
  FEEDBACK_EMAIL,
  FEEDBACK_KINDS,
  FEEDBACK_KINDS_BY_ID,
  FEEDBACK_MAX,
} from './feedback';

// Le corps du courriel, décodé, tel qu'il arrivera dans la boîte.
function corps(url: string): string {
  return decodeURIComponent(url.split('&body=')[1]);
}

function objet(url: string): string {
  return decodeURIComponent(url.split('?subject=')[1].split('&body=')[0]);
}

describe('version de l’application', () => {
  // La raison d'être de ce test : APP_VERSION est une copie de app.json, et
  // une copie dérive. Voir l'entête de appInfo.ts.
  it('correspond exactement à celle déclarée dans app.json', () => {
    const appJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', '..', 'app.json'), 'utf8')
    );
    expect(APP_VERSION).toBe(appJson.expo.version);
  });
});

describe('brouillon de retour', () => {
  it('propose les trois natures de retour, chacune complète', () => {
    expect(FEEDBACK_KINDS.map((k) => k.kind)).toEqual(['bug', 'idee', 'avis']);
    for (const info of FEEDBACK_KINDS) {
      expect(info.label.length).toBeGreaterThan(2);
      expect(info.subject.length).toBeGreaterThan(2);
      expect(info.champ.length).toBeGreaterThan(2);
      expect(info.placeholder.length).toBeGreaterThan(20);
      // Le bug n'a plus de seconde case : son filigrane doit donc appeler
      // lui-même la marche à suivre, sans quoi le renseignement se perd.
      if (info.kind === 'bug') expect(info.placeholder).toMatch(/refaire/);
      expect(FEEDBACK_KINDS_BY_ID[info.kind]).toBe(info);
    }
  });

  it('vise bien l’adresse annoncée, et met la version et la nature dans l’objet', () => {
    const url = buildFeedbackMailto('bug', 'la carte reste blanche');
    expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
    // Une boîte qui reçoit cinquante « Élyze · Bug » ne se trie pas.
    expect(objet(url)).toBe(`Élyze ${APP_VERSION} · Bug`);
  });

  describe('mise en forme', () => {
    it('range le message sous l’intitulé de la question posée', () => {
      const vu = corps(buildFeedbackMailto('idee', 'un mode sombre pour les cartes'));
      expect(vu).toContain('L’IDÉE\nun mode sombre pour les cartes');
    });

    it('range le message du bug sous sa propre question', () => {
      const vu = corps(buildFeedbackMailto('bug', 'la carte reste blanche'));
      expect(vu).toContain('CE QUI S’EST PASSÉ\nla carte reste blanche');
    });

    it('renvoie le bloc technique en pied, sous un filet', () => {
      const vu = corps(buildFeedbackMailto('avis', 'très bien'));
      const lignes = vu.split('\n');
      expect(lignes[lignes.length - 3]).toMatch(/^-+$/);
      expect(lignes[lignes.length - 2]).toContain(APP_VERSION);
      expect(lignes[lignes.length - 1]).toContain('réglages');
    });
  });

  // Le défaut que ce test attrape : un corps non échappé. Un `&` dans le
  // message ouvrirait un nouveau paramètre d'URL et couperait le texte net,
  // sans qu'aucune erreur ne soit levée. Le message arriverait amputé.
  it('échappe ce qui casserait l’URL : retours à la ligne, & et accents', () => {
    const message = 'ça plante & ça recommence\nà chaque ouverture';
    const url = buildFeedbackMailto('bug', message);
    expect(url).not.toContain('\n');
    // Un seul `&` dans l'URL : celui qui sépare `subject` de `body`.
    expect(url.split('&').length - 1).toBe(1);
    const corps = decodeURIComponent(url.split('&body=')[1]);
    expect(corps).toContain(message);
  });

  it('joint la version de l’app, et rien qui identifie qui que ce soit', () => {
    const corps = decodeURIComponent(buildFeedbackMailto('avis', 'bravo').split('&body=')[1]);
    expect(corps).toContain(APP_VERSION);
  });

  // Ce n'est pas la longueur du TEXTE qui compte mais celle de l'URL une fois
  // échappée : un message entièrement composé d'accents et de retours à la
  // ligne triple de taille au passage. On mesure donc le pire cas réel.
  it('tient dans une URL mailto même rempli au maximum de caractères coûteux', () => {
    expect(FEEDBACK_MAX).toBeGreaterThan(500);
    const pire = buildFeedbackMailto('bug', 'é\n'.repeat(FEEDBACK_MAX / 2));
    // Android accepte des intentions bien plus longues, iOS aussi ; 8000 est
    // la borne basse prudente des implémentations rencontrées.
    expect(pire.length).toBeLessThan(8000);
  });
});
