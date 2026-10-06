import type { APIRoute } from "astro";
import { Resend } from "resend";
import { creneauValide, creneauLisible, telephoneValide } from "../../lib/creneau";

// Deuxième route dynamique du site (avec /api/booking) : demande de rappel téléphonique.
// Envoie un seul e-mail, à Alexandre : le visiteur n'a laissé que son numéro, pas d'adresse.
export const prerender = false;

const EMAIL_NOTIFICATION = import.meta.env.BOOKING_NOTIFY_EMAIL || "alexandrebrgr@gmail.com";
const EMAIL_EXPEDITEUR = import.meta.env.RESEND_FROM || "Alexandre Berger <onboarding@resend.dev>";

interface DonneesRappel {
  nom: string;
  fonction: string;
  telephone: string;
  email: string;
  date: string; // AAAA-MM-JJ (heure de Paris)
  heure: string; // HH:MM (heure de Paris)
  site?: string; // honeypot anti-spam, doit rester vide
  lang?: string; // langue de la page d'où part la demande ("fr" ou "en")
}

const TEXTES = {
  fr: {
    nonConfigure: "Le service d'envoi n'est pas configuré. Merci de me contacter directement.",
    invalide: "Requête invalide.",
    manquants: "Champs manquants : ",
    telephone: "Numéro de téléphone invalide.",
    emailInvalide: "Adresse email invalide.",
    creneau: "Merci de choisir un créneau valide (date à venir, entre 8h et 20h, heure de Paris).",
    echec: "L'envoi a échoué. Merci de réessayer ou de m'écrire directement.",
    metier: "Réalisateur",
    sujet: "Votre demande de rappel a bien été reçue",
    bonjour: "Bonjour",
    texte: "Merci pour votre demande. Je vous appelle au créneau suivant :",
    recap: "Récapitulatif de votre demande :",
    quand: "Quand",
    pied: "Un contretemps ? Répondez simplement à cet e-mail pour proposer un autre moment.",
  },
  en: {
    nonConfigure: "The sending service is not configured. Please contact me directly.",
    invalide: "Invalid request.",
    manquants: "Missing fields: ",
    telephone: "Invalid phone number.",
    emailInvalide: "Invalid email address.",
    creneau: "Please choose a valid time slot (a future date, between 8 am and 8 pm, Paris time).",
    echec: "Sending failed. Please try again or write to me directly.",
    metier: "Director",
    sujet: "Your call-back request has been received",
    bonjour: "Hello",
    texte: "Thank you for your request. I will call you at the following time:",
    recap: "Summary of your request:",
    quand: "When",
    pied: "Something came up? Simply reply to this email to suggest another time.",
  },
} as const;

const LABELS_CHAMPS: Record<"fr" | "en", Record<string, string>> = {
  fr: { nom: "Prénom + Nom", fonction: "Fonction + Structure", telephone: "Numéro de téléphone", email: "Email", date: "Date", heure: "Heure" },
  en: { nom: "First name + Last name", fonction: "Position + Organisation", telephone: "Phone number", email: "Email", date: "Date", heure: "Time" },
};

function reponseJson(corps: unknown, status = 200) {
  return new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });
}

function echapperHtml(valeur: unknown) {
  return String(valeur ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}

function emailConfirmationHtml(d: { nom: string; fonction: string; telephone: string; email: string }, quand: string, langue: "fr" | "en") {
  const x = TEXTES[langue];
  const lab = LABELS_CHAMPS[langue];
  const ligne = (libelle: string, valeur: string) => `${echapperHtml(libelle)} : ${echapperHtml(valeur)}`.replace(" :", langue === "en" ? ":" : "\u00a0:");
  const recap = [ligne(lab.nom, d.nom), ligne(lab.fonction, d.fonction), ligne(lab.telephone, d.telephone), ligne(lab.email, d.email), ligne(x.quand, quand)].join("<br />");
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:Helvetica,Arial,sans-serif;color:#111;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:4px;">
            <tr>
              <td style="padding:32px;">
                <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#999;margin:0 0 24px;">Alexandre Berger — ${x.metier}</p>
                <h1 style="font-size:20px;font-weight:600;margin:0 0 16px;">${x.sujet}</h1>
                <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 16px;">
                  ${x.bonjour} ${echapperHtml(d.nom)},<br /><br />
                  ${x.texte}
                </p>
                <p style="font-size:17px;font-weight:600;color:#111;margin:0 0 24px;">${echapperHtml(quand)}</p>
                <p style="font-size:13px;color:#777;margin:0 0 8px;">${x.recap}</p>
                <p style="font-size:13px;line-height:1.7;color:#444;border-left:2px solid #e11d2e;padding-left:12px;margin:0 0 24px;">${recap}</p>
                <p style="font-size:13px;line-height:1.6;color:#777;margin:0;">${x.pied}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const POST: APIRoute = async ({ request }) => {
  const cleApi = import.meta.env.RESEND_API_KEY;
  if (!cleApi) {
    console.error("RESEND_API_KEY manquante : variable d'environnement non définie.");
    return reponseJson({ ok: false, erreur: TEXTES.fr.nonConfigure }, 500);
  }
  const resend = new Resend(cleApi);

  let donnees: DonneesRappel;
  try {
    donnees = await request.json();
  } catch {
    return reponseJson({ ok: false, erreur: TEXTES.fr.invalide }, 400);
  }

  // Honeypot : on répond succès (sans rien envoyer) pour ne pas signaler la protection aux robots.
  if (donnees.site) return reponseJson({ ok: true });

  const langue = donnees.lang === "en" ? "en" : "fr";
  const x = TEXTES[langue];

  // Tout vient du navigateur : on force le type texte et on borne la taille.
  const texte = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const nom = texte(donnees.nom, 120);
  const fonction = texte(donnees.fonction, 160);
  const telephone = texte(donnees.telephone, 40);
  const email = texte(donnees.email, 200);
  const date = texte(donnees.date, 10);
  const heure = texte(donnees.heure, 5);

  const manquants = (["nom", "fonction", "telephone", "email", "date", "heure"] as const).filter((c) => !{ nom, fonction, telephone, email, date, heure }[c]);
  if (manquants.length > 0) {
    return reponseJson({ ok: false, erreur: `${x.manquants}${manquants.map((c) => LABELS_CHAMPS[langue][c]).join(", ")}` }, 400);
  }

  if (!telephoneValide(telephone)) {
    return reponseJson({ ok: false, erreur: x.telephone }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reponseJson({ ok: false, erreur: x.emailInvalide }, 400);
  }

  // Créneau : date réelle, aujourd'hui ou plus tard (heure de Paris), heure entre 08:00 et 20:00.
  if (!creneauValide(date, heure)) {
    return reponseJson({ ok: false, erreur: x.creneau }, 400);
  }

  const quand = creneauLisible(date, heure, "fr");

  const lignes = [
    `Prénom + Nom : ${nom}`,
    `Fonction + Structure : ${fonction}`,
    `Téléphone : ${telephone}`,
    `Email : ${email}`,
    `Quand : ${quand}`,
  ].filter(Boolean);
  const entete = langue === "en" ? "Langue du visiteur : anglais (il a rempli le formulaire sur la version anglaise du site)\n\n" : "";

  try {
    await resend.emails.send({
      from: EMAIL_EXPEDITEUR,
      to: EMAIL_NOTIFICATION,
      replyTo: email,
      subject: `Demande de rappel${langue === "en" ? " (site en anglais)" : ""} — ${nom} — ${date.split("-").reverse().join("/")} ${heure.replace(":", "h")}`,
      text: `${entete}${lignes.join("\n")}`,
    });
  } catch (erreur) {
    console.error("Erreur envoi email rappel:", erreur);
    return reponseJson({ ok: false, erreur: x.echec }, 502);
  }

  // Confirmation au visiteur, dans sa langue. Ta notification est déjà partie : si celle-ci échoue,
  // la demande reste valide (on journalise sans renvoyer d'erreur au visiteur).
  try {
    await resend.emails.send({
      from: EMAIL_EXPEDITEUR,
      to: email,
      replyTo: EMAIL_NOTIFICATION, // « répondez à cet e-mail » arrive chez Alexandre
      subject: x.sujet,
      html: emailConfirmationHtml({ nom, fonction, telephone, email }, creneauLisible(date, heure, langue), langue),
    });
  } catch (erreur) {
    console.error("Erreur envoi email de confirmation rappel:", erreur);
  }

  return reponseJson({ ok: true });
};
