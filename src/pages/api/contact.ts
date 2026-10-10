import type { APIRoute } from "astro";
import { Resend } from "resend";
import { telephoneValide } from "../../lib/telephone";
import { verifierPiecesJointes } from "../../lib/pieces-jointes";

// Seule route dynamique du site : formulaire de contact (pied de page et page Contact).
// Le visiteur laisse ses coordonnées : notification à Alexandre, puis confirmation au visiteur dans sa langue.
// Sur la page Contact, il peut ajouter un message libre et des pièces jointes (facultatifs) : la requête arrive
// alors en multipart/form-data (le JSON reste accepté).
export const prerender = false;

const EMAIL_NOTIFICATION = import.meta.env.BOOKING_NOTIFY_EMAIL || "alexandrebrgr@gmail.com";
const EMAIL_EXPEDITEUR = import.meta.env.RESEND_FROM || "Alexandre Berger <onboarding@resend.dev>";

const CHAMPS = ["prenom", "nom", "structure", "fonction", "email", "telephone"] as const;
type Champ = (typeof CHAMPS)[number];
const TAILLE_MAX: Record<Champ, number> = { prenom: 80, nom: 80, structure: 160, fonction: 160, email: 200, telephone: 40 };

type DonneesContact = Partial<Record<Champ, string>> & {
  site?: string; // honeypot anti-spam, doit rester vide
  lang?: string; // langue de la page d'où part la demande ("fr" ou "en")
  message?: string; // page Contact : précisions sur le projet (facultatif)
};
const MESSAGE_MAX = 5000;

const TEXTES = {
  fr: {
    nonConfigure: "Le service d'envoi n'est pas configuré. Merci de me contacter directement.",
    invalide: "Requête invalide.",
    manquants: "Champs manquants : ",
    telephone: "Numéro de téléphone invalide.",
    emailInvalide: "Adresse email invalide.",
    echec: "L'envoi a échoué. Merci de réessayer ou de m'écrire directement.",
    fichiersNombre: "5 pièces jointes maximum.",
    fichiersTaille: "Les pièces jointes dépassent 4 Mo au total.",
    fichiersType: "Format de pièce jointe non accepté : ",
    votreMessage: "Votre message :",
    vosFichiers: "Pièces jointes reçues :",
    metier: "Réalisateur",
    sujet: "Vos coordonnées ont bien été reçues",
    bonjour: "Bonjour",
    texte: "Merci pour votre message. Je reviens vers vous dans les plus brefs délais.",
    recap: "Récapitulatif de vos coordonnées :",
    pied: "Une précision à apporter ? Répondez simplement à cet e-mail.",
  },
  en: {
    nonConfigure: "The sending service is not configured. Please contact me directly.",
    invalide: "Invalid request.",
    manquants: "Missing fields: ",
    telephone: "Invalid phone number.",
    emailInvalide: "Invalid email address.",
    echec: "Sending failed. Please try again or write to me directly.",
    fichiersNombre: "5 attachments maximum.",
    fichiersTaille: "The attachments exceed 4 MB in total.",
    fichiersType: "Attachment format not accepted: ",
    votreMessage: "Your message:",
    vosFichiers: "Attachments received:",
    metier: "Director",
    sujet: "Your details have been received",
    bonjour: "Hello",
    texte: "Thank you for getting in touch. I will get back to you as soon as possible.",
    recap: "Summary of your details:",
    pied: "Something to add? Simply reply to this email.",
  },
} as const;

const LABELS_CHAMPS: Record<"fr" | "en", Record<Champ, string>> = {
  fr: { prenom: "Prénom", nom: "Nom", structure: "Structure", fonction: "Fonction", email: "Email", telephone: "Téléphone" },
  en: { prenom: "First name", nom: "Last name", structure: "Organisation", fonction: "Position", email: "Email", telephone: "Phone" },
};

function reponseJson(corps: unknown, status = 200) {
  return new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });
}

function echapperHtml(valeur: unknown) {
  return String(valeur ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}

function emailConfirmationHtml(d: Record<Champ, string>, langue: "fr" | "en", message: string, nomsFichiers: string[]) {
  const x = TEXTES[langue];
  const lab = LABELS_CHAMPS[langue];
  const recap = CHAMPS.map((c) => `${echapperHtml(lab[c])}${langue === "en" ? ":" : " :"} ${echapperHtml(d[c])}`).join("<br />");
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
                <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 24px;">
                  ${x.bonjour} ${echapperHtml(d.prenom)},<br /><br />
                  ${x.texte}
                </p>
                <p style="font-size:13px;color:#777;margin:0 0 8px;">${x.recap}</p>
                <p style="font-size:13px;line-height:1.7;color:#444;border-left:2px solid #e11d2e;padding-left:12px;margin:0 0 24px;">${recap}</p>
                ${message ? `<p style="font-size:13px;color:#777;margin:0 0 8px;">${x.votreMessage}</p>
                <p style="font-size:13px;line-height:1.7;color:#444;border-left:2px solid #e11d2e;padding-left:12px;margin:0 0 24px;">${echapperHtml(message).replace(/\n/g, "<br />")}</p>` : ""}
                ${nomsFichiers.length ? `<p style="font-size:13px;line-height:1.7;color:#777;margin:0 0 24px;">${x.vosFichiers} ${nomsFichiers.map(echapperHtml).join(", ")}</p>` : ""}
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

  let donnees: DonneesContact;
  let fichiers: File[] = [];
  try {
    if ((request.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const formulaire = await request.formData();
      donnees = Object.fromEntries([...formulaire.entries()].filter(([, v]) => typeof v === "string")) as DonneesContact;
      fichiers = formulaire.getAll("fichiers").filter((f): f is File => f instanceof File && f.size > 0);
    } else {
      donnees = await request.json();
    }
  } catch {
    return reponseJson({ ok: false, erreur: TEXTES.fr.invalide }, 400);
  }

  // Honeypot : on répond succès (sans rien envoyer) pour ne pas signaler la protection aux robots.
  if (donnees.site) return reponseJson({ ok: true });

  const langue = donnees.lang === "en" ? "en" : "fr";
  const x = TEXTES[langue];

  // Tout vient du navigateur : on force le type texte et on borne la taille.
  const d = Object.fromEntries(
    CHAMPS.map((c) => [c, typeof donnees[c] === "string" ? (donnees[c] as string).trim().slice(0, TAILLE_MAX[c]) : ""])
  ) as Record<Champ, string>;

  const manquants = CHAMPS.filter((c) => !d[c]);
  if (manquants.length > 0) {
    return reponseJson({ ok: false, erreur: `${x.manquants}${manquants.map((c) => LABELS_CHAMPS[langue][c]).join(", ")}` }, 400);
  }
  if (!telephoneValide(d.telephone)) return reponseJson({ ok: false, erreur: x.telephone }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return reponseJson({ ok: false, erreur: x.emailInvalide }, 400);

  const message = typeof donnees.message === "string" ? donnees.message.trim().slice(0, MESSAGE_MAX) : "";
  const souci = verifierPiecesJointes(fichiers);
  if (souci) {
    const erreur = souci.probleme === "nombre" ? x.fichiersNombre : souci.probleme === "taille" ? x.fichiersTaille : `${x.fichiersType}${souci.nom}`;
    return reponseJson({ ok: false, erreur }, 400);
  }
  const piecesJointes = await Promise.all(
    fichiers.map(async (f) => ({ filename: f.name.slice(0, 120), content: Buffer.from(await f.arrayBuffer()) }))
  );

  const lignes = CHAMPS.map((c) => `${LABELS_CHAMPS.fr[c]} : ${d[c]}`);
  if (message) lignes.push("", "Message :", message);
  if (piecesJointes.length) lignes.push("", `Pièces jointes : ${piecesJointes.map((p) => p.filename).join(", ")}`);
  const entete = langue === "en" ? "Langue du visiteur : anglais (il a rempli le formulaire sur la version anglaise du site)\n\n" : "";

  try {
    await resend.emails.send({
      from: EMAIL_EXPEDITEUR,
      to: EMAIL_NOTIFICATION,
      replyTo: d.email,
      subject: `Contact${langue === "en" ? " (site en anglais)" : ""} — ${d.prenom} ${d.nom} — ${d.structure}`,
      text: `${entete}${lignes.join("\n")}`,
      ...(piecesJointes.length ? { attachments: piecesJointes } : {}),
    });
  } catch (erreur) {
    console.error("Erreur envoi email contact:", erreur);
    return reponseJson({ ok: false, erreur: x.echec }, 502);
  }

  // Confirmation au visiteur, dans sa langue. La notification est déjà partie : si celle-ci échoue,
  // la demande reste valide (on journalise sans renvoyer d'erreur au visiteur).
  try {
    await resend.emails.send({
      from: EMAIL_EXPEDITEUR,
      to: d.email,
      replyTo: EMAIL_NOTIFICATION,
      subject: x.sujet,
      html: emailConfirmationHtml(d, langue, message, piecesJointes.map((p) => p.filename)),
    });
  } catch (erreur) {
    console.error("Erreur envoi email de confirmation contact:", erreur);
  }

  return reponseJson({ ok: true });
};
