import fs from 'fs';
import path from 'path';
import { CANDIDATES } from './candidates';
import { CANDIDATE_PHOTOS, CANDIDATE_PHOTO_CREDITS } from './candidatePhotos';
import { LEGAL_DOCUMENTS, LEGAL_TOPICS, LegalTopic } from './legal';

// Une page de mentions légales n'est pas un texte de plus : elle AFFIRME des
// choses sur le programme, et rien n'empêche l'app de continuer à les
// afficher longtemps après qu'elles ont cessé d'être vraies. Ces tests
// confrontent donc les affirmations au dépôt lui-même.

const SRC = path.join(__dirname, '..');

function fichiersSource(dossier: string): string[] {
  return fs.readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    const complet = path.join(dossier, e.name);
    if (e.isDirectory()) return fichiersSource(complet);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [complet] : [];
  });
}

describe('textes légaux', () => {
  it('expose les trois documents annoncés dans les réglages', () => {
    expect(LEGAL_TOPICS).toEqual(['privacy', 'terms', 'credits']);
    for (const sujet of LEGAL_TOPICS) {
      expect(LEGAL_DOCUMENTS[sujet]).toBeDefined();
    }
  });

  it.each(Object.keys(LEGAL_DOCUMENTS) as LegalTopic[])(
    'le document « %s » a un titre, une accroche et des sections non vides',
    (sujet) => {
      const doc = LEGAL_DOCUMENTS[sujet];
      expect(doc.title.length).toBeGreaterThan(3);
      expect(doc.lead.length).toBeGreaterThan(20);
      expect(doc.sections.length).toBeGreaterThan(2);
      for (const section of doc.sections) {
        expect(section.title.length).toBeGreaterThan(3);
        // Une section porte du texte, une liste, ou la table des portraits.
        expect(Boolean(section.body || section.bullets?.length || section.photos)).toBe(true);
      }
    }
  );

  it('n’emploie pas de tiret cadratin', () => {
    // Choix de rédaction tenu dans toute l'app : ils font trop.
    const tout = JSON.stringify(LEGAL_DOCUMENTS);
    expect(tout).not.toMatch(/—/);
  });
});

// C'est LE test qui compte. La page confidentialité affirme que l'app ne fait
// aucun appel réseau ; si quelqu'un en ajoute un demain, la phrase devient un
// mensonge que personne ne verra. Ici, elle casse le test.
describe('« aucun appel réseau » est vérifié, pas promis', () => {
  const fichiers = fichiersSource(SRC);

  it('trouve bien les sources à inspecter', () => {
    expect(fichiers.length).toBeGreaterThan(30);
  });

  it('aucune source n’ouvre de connexion sortante', () => {
    const coupables: string[] = [];
    for (const fichier of fichiers) {
      const contenu = fs.readFileSync(fichier, 'utf8');
      // `Linking.openURL` est le seul passage vers l'extérieur, et il n'envoie
      // rien : il confie une adresse au navigateur du téléphone, à la demande
      // de l'utilisateur. Tout le reste est proscrit.
      if (/\bfetch\s*\(|XMLHttpRequest|new WebSocket|axios|EventSource/.test(contenu)) {
        coupables.push(path.relative(SRC, fichier));
      }
    }
    expect(coupables).toEqual([]);
  });

  it('la page confidentialité dit bien qu’il n’y a aucun appel réseau', () => {
    const texte = JSON.stringify(LEGAL_DOCUMENTS.privacy);
    expect(texte).toMatch(/aucun appel réseau/);
  });
});

describe('attribution des portraits', () => {
  const avecPhoto = CANDIDATES.filter((c) => CANDIDATE_PHOTOS[c.id]);

  it('les onze candidats ont un portrait', () => {
    expect(avecPhoto).toHaveLength(CANDIDATES.length);
  });

  // CC BY et CC BY-SA imposent de nommer l'auteur et la licence. Un portrait
  // ajouté sans sa ligne d'attribution est une infraction, pas un oubli de
  // confort.
  it('chaque portrait affiché a son auteur, sa licence et son fichier d’origine', () => {
    for (const candidat of avecPhoto) {
      const credit = CANDIDATE_PHOTO_CREDITS[candidat.id];
      expect(credit).toBeDefined();
      expect(credit.auteur.length).toBeGreaterThan(2);
      expect(credit.licence.length).toBeGreaterThan(2);
      expect(credit.fichier).toMatch(/\.(jpg|jpeg|png)$/i);
      expect(credit.page).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });

  it('aucune attribution ne traîne sans son portrait', () => {
    for (const id of Object.keys(CANDIDATE_PHOTO_CREDITS)) {
      expect(CANDIDATE_PHOTOS[id]).toBeDefined();
    }
  });

  it('la page crédits renvoie bien vers la table des portraits', () => {
    const section = LEGAL_DOCUMENTS.credits.sections.find((s) => s.photos);
    expect(section).toBeDefined();
  });
});
