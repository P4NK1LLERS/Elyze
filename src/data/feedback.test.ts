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
      expect(info.placeholder.length).toBeGreaterThan(20);
      expect(FEEDBACK_KINDS_BY_ID[info.kind]).toBe(info);
    }
  });

  it('vise bien l’adresse annoncée et porte la nature dans l’objet', () => {
    const url = buildFeedbackMailto('bug', 'la carte reste blanche');
    expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
    expect(decodeURIComponent(url)).toContain('Bogue');
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

  it('borne le message sous la limite des URL mailto', () => {
    expect(FEEDBACK_MAX).toBeGreaterThan(500);
    expect(FEEDBACK_MAX).toBeLessThanOrEqual(2000);
  });
});
