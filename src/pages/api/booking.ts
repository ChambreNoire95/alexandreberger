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
  fonction?: string;
  email: string;
  telephone: string;
  type?: string;
  duree?: string;
  date?: string;
  lieu?: string;
  budget?: string;
  description: string;
  site?: string; // honeypot anti-spam, doit rester vide
}

const CHAMPS_REQUIS: (keyof DonneesBooking)[] = ["entreprise", "nom", "prenom", "email", "telephone", "description"];

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
  description: "Description du projet",
};

function reponseJson(corps: unknown, status = 200) {
  return new Response(JSON.stringify(corps), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function recapitulatif(d: DonneesBooking, inclureEmail = true) {
  return (Object.keys(LABELS) as (keyof DonneesBooking)[])
    .filter((champ) => (inclureEmail || champ !== "email") && String(d[champ] ?? "").trim())
    .map((champ) => `${LABELS[champ]} : ${d[champ]}`)
    .join("\n");
}

function echapperHtml(valeur: unknown) {
  return String(valeur ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}

function emailConfirmationHtml(d: DonneesBooking) {
  const recap = echapperHtml(recapitulatif(d, false)).replace(/\n/g, "<br />");
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:Helvetica,Arial,sans-serif;color:#111;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:4px;">
            <tr>
              <td style="padding:32px;">
                <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#999;margin:0 0 24px;">Alexandre Berger — Réalisateur</p>
                <h1 style="font-size:20px;font-weight:600;margin:0 0 16px;">Votre demande a bien été reçue</h1>
                <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 24px;">
                  Bonjour ${echapperHtml(d.prenom)},<br /><br />
                  Merci pour votre demande concernant <strong>${echapperHtml(d.entreprise)}</strong>. Je reviens vers vous dans les plus brefs délais.
                </p>
                <p style="font-size:13px;color:#777;margin:0 0 8px;">Récapitulatif de votre demande :</p>
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
    return reponseJson(
      { ok: false, erreur: "Le service d'envoi n'est pas configuré. Merci de me contacter directement." },
      500
    );
  }
  const resend = new Resend(cleApi);

  let donnees: DonneesBooking;
  try {
    donnees = await request.json();
  } catch {
    return reponseJson({ ok: false, erreur: "Requête invalide." }, 400);
  }

  // Honeypot : champ invisible pour les humains, que seuls les robots
  // remplissent. On répond succès (sans rien envoyer) pour ne pas leur
  // signaler que le formulaire est protégé.
  if (donnees.site) {
    return reponseJson({ ok: true });
  }

  const manquants = CHAMPS_REQUIS.filter((champ) => !String(donnees[champ] ?? "").trim());
  if (manquants.length > 0) {
    return reponseJson(
      { ok: false, erreur: `Champs manquants : ${manquants.map((c) => LABELS[c] ?? c).join(", ")}` },
      400
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donnees.email)) {
    return reponseJson({ ok: false, erreur: "Adresse email invalide." }, 400);
  }

  try {
    await resend.emails.send({
      from: EMAIL_EXPEDITEUR,
      to: EMAIL_NOTIFICATION,
      replyTo: donnees.email,
      subject: `Demande de tournage — ${donnees.entreprise}`,
      text: recapitulatif(donnees, true),
    });

    await resend.emails.send({
      from: EMAIL_EXPEDITEUR,
      to: donnees.email,
      subject: "Votre demande a bien été reçue",
      html: emailConfirmationHtml(donnees),
    });
  } catch (erreur) {
    console.error("Erreur envoi email booking:", erreur);
    return reponseJson(
      { ok: false, erreur: "L'envoi a échoué. Merci de réessayer ou de m'écrire directement." },
      502
    );
  }

  // Point d'extension pour Claude Cowork : une fois le webhook d'ingestion
  // connu, un appel supplémentaire ici suffira (sans bloquer la réponse
  // envoyée au client si jamais cet appel échoue).
  // await notifierCowork(donnees).catch((e) => console.error("Cowork:", e));

  return reponseJson({ ok: true });
};
