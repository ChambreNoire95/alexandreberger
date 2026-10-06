import type { APIRoute } from "astro";
import { Resend } from "resend";

// Seule route dynamique du site : tout le reste est pré-généré au build
// (voir astro.config.mjs). Doit rester non pré-rendue pour s'exécuter en
// fonction serveur à chaque soumission du formulaire.
export const prerender = false;

const EMAIL_NOTIFICATION = import.meta.env.BOOKING_NOTIFY_EMAIL || "alexandrebrgr@gmail.com";
// Nécessite un domaine vérifié dans Resend pour envoyer à de vrais clients
// (l'adresse par défaut resend.dev ne peut envoyer qu'au propriétaire du
// compte). À définir via la variable d'environnement RESEND_FROM.
const EMAIL_EXPEDITEUR = import.meta.env.RESEND_FROM || "Alexandre Berger <onboarding@resend.dev>";

interface DonneesBooking {
  entreprise: string;
  nom: string;
  prenom: string;
  fonction: string;
  email: string;
  telephone: string;
  type?: string;
  duree?: string;
  date?: string;
  lieu?: string;
  budget?: string;
  criteres?: string; // critères de la recherche de références (page d'accueil)
  references?: string; // références sélectionnées, une par ligne
  description: string;
  site?: string; // honeypot anti-spam, doit rester vide
  lang?: string; // langue de la page d'où part la demande ("fr" ou "en") : langue de l'e-mail de confirmation
}

const CHAMPS_REQUIS: (keyof DonneesBooking)[] = ["entreprise", "nom", "prenom", "fonction", "email", "telephone", "description"];

const LABELS: Record<string, string> = {
  entreprise: "Entreprise / Institution / Structure",
  nom: "Nom",
  prenom: "Prénom",
  fonction: "Fonction / Service",
  email: "Email",
  telephone: "Téléphone",
  type: "Type de projet",
  duree: "Durée du tournage",
  date: "Date de début souhaitée",
  lieu: "Lieu",
  budget: "Budget estimé",
  criteres: "Critères de recherche",
  references: "Références sélectionnées",
  description: "Description du projet",
};

// Libellés et textes en anglais : l'e-mail de confirmation et les messages d'erreur suivent la langue
// du visiteur ; l'e-mail reçu par Alexandre reste en français (avec la langue du visiteur indiquée).
const LABELS_EN: Record<string, string> = {
  entreprise: "Company / Institution / Organisation",
  nom: "Last name",
  prenom: "First name",
  fonction: "Position / Department",
  email: "Email",
  telephone: "Phone",
  type: "Type of project",
  duree: "Shooting duration",
  date: "Desired start date",
  lieu: "Location",
  budget: "Estimated budget",
  criteres: "Search criteria",
  references: "Selected references",
  description: "Project description",
};

const TEXTES = {
  fr: {
    metier: "Réalisateur",
    titre: "Votre demande a bien été reçue",
    sujet: "Votre demande a bien été reçue",
    bonjour: "Bonjour",
    merci: "Merci pour votre demande concernant",
    retour: "Je reviens vers vous dans les plus brefs délais.",
    recap: "Récapitulatif de votre demande :",
    nonConfigure: "Le service d'envoi n'est pas configuré. Merci de me contacter directement.",
    invalide: "Requête invalide.",
    manquants: "Champs manquants : ",
    emailInvalide: "Adresse email invalide.",
    echec: "L'envoi a échoué. Merci de réessayer ou de m'écrire directement.",
  },
  en: {
    metier: "Director",
    titre: "Your request has been received",
    sujet: "Your request has been received",
    bonjour: "Hello",
    merci: "Thank you for your request regarding",
    retour: "I will get back to you as soon as possible.",
    recap: "Summary of your request:",
    nonConfigure: "The sending service is not configured. Please contact me directly.",
    invalide: "Invalid request.",
    manquants: "Missing fields: ",
    emailInvalide: "Invalid email address.",
    echec: "Sending failed. Please try again or write to me directly.",
  },
} as const;

type LangueMail = keyof typeof TEXTES;
const langueDe = (d: { lang?: string }): LangueMail => (d.lang === "en" ? "en" : "fr");

function reponseJson(corps: unknown, status = 200) {
  return new Response(JSON.stringify(corps), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function recapitulatif(d: DonneesBooking, inclureEmail = true, langue: LangueMail = "fr") {
  const labels = langue === "en" ? LABELS_EN : LABELS;
  return (Object.keys(LABELS) as (keyof DonneesBooking)[])
    .filter((champ) => (inclureEmail || champ !== "email") && String(d[champ] ?? "").trim())
    // Les références tiennent sur plusieurs lignes : on les passe à la ligne sous le libellé.
    .map((champ) => `${labels[champ]}${langue === "en" ? ":" : "\u00a0:"}${champ === "references" ? "\n" : " "}${d[champ]}`)
    .join("\n");
}

function echapperHtml(valeur: unknown) {
  return String(valeur ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}

function emailConfirmationHtml(d: DonneesBooking) {
  const langue = langueDe(d);
  const x = TEXTES[langue];
  const recap = echapperHtml(recapitulatif(d, false, langue)).replace(/\n/g, "<br />");
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
                <h1 style="font-size:20px;font-weight:600;margin:0 0 16px;">${x.titre}</h1>
                <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 24px;">
                  ${x.bonjour} ${echapperHtml(d.prenom)},<br /><br />
                  ${x.merci} <strong>${echapperHtml(d.entreprise)}</strong>. ${x.retour}
                </p>
                <p style="font-size:13px;color:#777;margin:0 0 8px;">${x.recap}</p>
                <p style="font-size:13px;line-height:1.7;color:#444;border-left:2px solid #e11d2e;padding-left:12px;margin:0;">${recap}</p>
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

  let donnees: DonneesBooking;
  try {
    donnees = await request.json();
  } catch {
    return reponseJson({ ok: false, erreur: TEXTES.fr.invalide }, 400);
  }

  // Honeypot : champ invisible pour les humains, que seuls les robots
  // remplissent. On répond succès (sans rien envoyer) pour ne pas leur
  // signaler que le formulaire est protégé.
  if (donnees.site) {
    return reponseJson({ ok: true });
  }

  // Champs libres envoyés par le navigateur : on borne leur taille et leur type.
  donnees.criteres = typeof donnees.criteres === "string" ? donnees.criteres.slice(0, 500) : undefined;
  donnees.references = typeof donnees.references === "string" ? donnees.references.slice(0, 3000) : undefined;

  const langue = langueDe(donnees);
  const x = TEXTES[langue];
  const labelsLangue = langue === "en" ? LABELS_EN : LABELS;
  const manquants = CHAMPS_REQUIS.filter((champ) => !String(donnees[champ] ?? "").trim());
  if (manquants.length > 0) {
    return reponseJson(
      { ok: false, erreur: `${x.manquants}${manquants.map((c) => labelsLangue[c] ?? c).join(", ")}` },
      400
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donnees.email)) {
    return reponseJson({ ok: false, erreur: x.emailInvalide }, 400);
  }

  try {
    await resend.emails.send({
      from: EMAIL_EXPEDITEUR,
      to: EMAIL_NOTIFICATION,
      replyTo: donnees.email,
      subject: `Demande de tournage${langue === "en" ? " (site en anglais)" : ""} — ${donnees.entreprise}`,
      text: (langue === "en" ? "Langue du visiteur : anglais (il a rempli le formulaire sur la version anglaise du site)\n\n" : "") + recapitulatif(donnees, true),
    });

    await resend.emails.send({
      from: EMAIL_EXPEDITEUR,
      to: donnees.email,
      subject: x.sujet,
      html: emailConfirmationHtml(donnees),
    });
  } catch (erreur) {
    console.error("Erreur envoi email booking:", erreur);
    return reponseJson(
      { ok: false, erreur: x.echec },
      502
    );
  }

  // Point d'extension pour Claude Cowork : une fois le webhook d'ingestion
  // connu, un appel supplémentaire ici suffira (sans bloquer la réponse
  // envoyée au client si jamais cet appel échoue).
  // await notifierCowork(donnees).catch((e) => console.error("Cowork:", e));

  return reponseJson({ ok: true });
};
