import nodemailer from "nodemailer";

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true";

  if (!host) {
    throw new Error("SMTP_HOST is required");
  }

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    tls: { rejectUnauthorized: false },
  });
  return cachedTransport;
}

export interface UploadFileEntry {
  filename: string;
  convertedFilename: string;
  originalSizeBytes: number;
  convertedSizeBytes: number;
  originalBlobKey: string;
  convertedBlobKey: string;
  downloadUrl: string;
  originalDownloadUrl: string;
  downloadExpiresAt: number;
}

export interface UploadNotification {
  userEmail: string;
  userName: string;
  count: number;
  files: UploadFileEntry[];
}

export interface FinishedFileEntry {
  filename: string;
  cleanedFilename: string;
  cleanedSizeBytes: number;
  downloadUrl: string;
  downloadExpiresAt: number;
}

export interface FinishedNotification {
  userEmail: string;
  userName: string;
  count: number;
  files: FinishedFileEntry[];
}

const EMAIL_COLORS = {
  canvas: "#0a0907",
  panel: "#14110d",
  panelRaised: "#1b1813",
  line: "#2b2822",
  bone: "#f4f1ea",
  steel: "#9a948a",
  accent: "#ff7a1a",
} as const;

const BRAND_MARK = `
<svg width="22" height="22" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false" style="display:block;color:${EMAIL_COLORS.canvas}">
  <path d="M4 32 Q9 32 11 22 T17 32 T23 32 T29 32 T35 32 T41 32 T60 32" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="11" cy="22" r="2.5" fill="currentColor" />
  <circle cx="23" cy="32" r="2.5" fill="currentColor" />
  <circle cx="41" cy="32" r="2.5" fill="currentColor" />
</svg>`;

const BRAND_WAVEFORM = `
<svg width="100%" height="22" viewBox="0 0 600 22" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false" style="display:block;">
  <path d="M0 11 H6 L10 4 L14 18 L18 8 L22 17 L26 6 L30 15 L34 3 L38 19 L42 9 L46 17 L50 7 L54 16 L58 5 L62 13 L66 4 L70 18 L74 9 L78 17 L82 7 L86 15 L90 5 L94 14 L98 8 L102 17 L106 6 L110 16 L114 4 L118 18 L122 9 L126 17 L130 7 L134 15 L138 5 L142 14 L146 8 L150 17 L154 6 L158 16 L162 4 L166 18 L170 9 L174 17 L178 7 L182 15 L186 5 L190 14 L194 8 L198 17 L202 6 L206 16 L210 4 L214 18 L218 9 L222 17 L226 7 L230 15 L234 5 L238 14 L242 8 L246 17 L250 6 L254 16 L258 4 L262 18 L266 9 L270 17 L274 7 L278 15 L282 5 L286 14 L290 8 L294 17 L298 6 L302 16 L306 4 L310 18 L314 9 L318 17 L322 7 L326 15 L330 5 L334 14 L338 8 L342 17 L346 6 L350 16 L354 4 L358 18 L362 9 L366 17 L370 7 L374 15 L378 5 L382 14 L386 8 L390 17 L394 6 L398 16 L402 4 L406 18 L410 9 L414 17 L418 7 L422 15 L426 5 L430 14 L434 8 L438 17 L442 6 L446 16 L450 4 L454 18 L458 9 L462 17 L466 7 L470 15 L474 5 L478 14 L482 8 L486 17 L490 6 L494 16 L498 4 L502 18 L506 9 L510 17 L514 7 L518 15 L522 5 L526 14 L530 8 L534 17 L538 6 L542 16 L546 4 L550 18 L554 9 L558 17 L562 7 L566 15 L570 5 L574 14 L578 8 L582 17 L586 6 L590 16 L594 4 L600 11" stroke="${EMAIL_COLORS.accent}" stroke-width="1" stroke-linecap="round" stroke-opacity="0.55" fill="none" />
</svg>`;

function cleanText(value: string) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function safeUrl(value: string) {
  const candidate = cleanText(value);
  if (!candidate) return "";

  try {
    const parsed = new URL(candidate, "https://resonate.ai");
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
  } catch {
    return "";
  }

  return escapeHtml(candidate);
}

function fmtMB(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function fmtDateTime(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toUTCString();
}

function renderFileCard({
  filename,
  details,
  primaryLabel,
  primaryUrl,
  expiresAt,
  secondaryLabel,
  secondaryUrl,
}: {
  filename: string;
  details: string;
  primaryLabel: string;
  primaryUrl: string;
  expiresAt: number;
  secondaryLabel?: string;
  secondaryUrl?: string;
}) {
  const href = safeUrl(primaryUrl);
  const secondaryHref = secondaryUrl ? safeUrl(secondaryUrl) : "";
  if (!href) return "";

  const secondaryLink =
    secondaryLabel && secondaryHref
      ? ` <span style="color:${EMAIL_COLORS.line};font-size:14px;">|</span> <a href="${secondaryHref}" style="color:${EMAIL_COLORS.steel};font-size:13px;text-decoration:underline;text-underline-offset:2px;">${escapeHtml(cleanText(secondaryLabel))}</a>`
      : "";

  return `
    <tr>
      <td style="padding:0 0 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background:${EMAIL_COLORS.panelRaised};border:1px solid ${EMAIL_COLORS.line};border-left:3px solid ${EMAIL_COLORS.accent};border-radius:2px;">
          <tr>
            <td style="padding:14px 16px 5px;color:${EMAIL_COLORS.bone};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;line-height:1.4;word-break:break-word;">${escapeHtml(cleanText(filename))}</td>
          </tr>
          <tr>
            <td style="padding:0 16px 12px;color:${EMAIL_COLORS.steel};font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;">${escapeHtml(cleanText(details))}</td>
          </tr>
          <tr>
            <td style="padding:0 16px 14px;font-family:Arial,Helvetica,sans-serif;line-height:16px;white-space:nowrap;">
              <a href="${href}" style="display:inline-block;padding:10px 16px;background:${EMAIL_COLORS.accent};border:1px solid ${EMAIL_COLORS.accent};border-radius:2px;color:${EMAIL_COLORS.canvas};font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;line-height:16px;text-decoration:none;text-transform:uppercase;vertical-align:middle;">${escapeHtml(cleanText(primaryLabel))}</a>${secondaryLink}
              <span style="display:block;margin-top:9px;color:${EMAIL_COLORS.steel};font-size:12px;line-height:1.5;white-space:normal;">Link expires ${escapeHtml(fmtDateTime(expiresAt))}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function renderEmailShell({
  eyebrow,
  title,
  intro,
  content,
  footer,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  content: string;
  footer: string;
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <title>${escapeHtml(cleanText(title))}</title>
  </head>
  <body style="margin:0;padding:0;background:${EMAIL_COLORS.canvas};color:${EMAIL_COLORS.bone};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background:${EMAIL_COLORS.canvas};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:collapse;background:${EMAIL_COLORS.panel};border:1px solid ${EMAIL_COLORS.line};border-radius:2px;">
            <tr>
              <td style="padding:28px 32px 6px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td width="44" valign="middle" style="width:44px;padding:8px;background:${EMAIL_COLORS.accent};border-radius:2px;">${BRAND_MARK}</td>
                    <td valign="middle" style="padding-left:12px;">
                      <div style="color:${EMAIL_COLORS.bone};font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1;letter-spacing:-0.01em;">Resonate AI</div>
                      <div style="margin-top:4px;color:${EMAIL_COLORS.steel};font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.3;letter-spacing:0.06em;text-transform:uppercase;">Audio cleaning, delivered</div>
                    </td>
                  </tr>
                </table>
                <div style="height:18px;line-height:18px;font-size:0;">&#160;</div>
                <div style="width:100%;">${BRAND_WAVEFORM}</div>
                <div style="margin-top:18px;display:inline-block;padding:4px 10px;background:${EMAIL_COLORS.panelRaised};border:1px solid ${EMAIL_COLORS.line};border-radius:2px;color:${EMAIL_COLORS.accent};font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.08em;line-height:1.2;text-transform:uppercase;">${escapeHtml(cleanText(eyebrow))}</div>
                <h1 style="margin:18px 0 10px;color:${EMAIL_COLORS.bone};font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;line-height:1.15;letter-spacing:-0.01em;">${escapeHtml(cleanText(title))}</h1>
                <p style="margin:0;color:${EMAIL_COLORS.steel};font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;">${escapeHtml(cleanText(intro))}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                  ${content}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid ${EMAIL_COLORS.line};">
                <div style="width:100%;">${BRAND_WAVEFORM}</div>
                <div style="margin-top:14px;color:${EMAIL_COLORS.steel};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">${escapeHtml(cleanText(footer))}</div>
                <div style="margin-top:14px;color:${EMAIL_COLORS.bone};font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.2;letter-spacing:-0.01em;">Resonate AI</div>
                <div style="margin-top:2px;color:${EMAIL_COLORS.steel};font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.4;">Audio cleaning, delivered</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildUploadRows(files: UploadFileEntry[]) {
  return files
    .map((file) =>
      renderFileCard({
        filename: file.filename,
        details: `Converted file: ${file.convertedFilename} · ${fmtMB(file.originalSizeBytes)} MB to ${fmtMB(file.convertedSizeBytes)} MB`,
        primaryLabel: "Open MP3",
        primaryUrl: file.downloadUrl,
        secondaryLabel: "Original",
        secondaryUrl: file.originalDownloadUrl,
        expiresAt: file.downloadExpiresAt,
      }),
    )
    .join("");
}

function buildFinishedRows(files: FinishedFileEntry[]) {
  return files
    .map((file) =>
      renderFileCard({
        filename: file.filename,
        details: `Cleaned file: ${file.cleanedFilename} · ${fmtMB(file.cleanedSizeBytes)} MB`,
        primaryLabel: "Open cleaned audio",
        primaryUrl: file.downloadUrl,
        expiresAt: file.downloadExpiresAt,
      }),
    )
    .join("");
}

export async function sendUploadNotification({
  userEmail,
  userName,
  count,
  files,
}: UploadNotification) {
  const transport = getTransport();
  const from = process.env.SMTP_FROM || "Resonate AI <no-reply@resonate.ai>";
  const to =
    process.env.NOTIFY_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "team@resonate.ai";
  const fileLabel = count === 1 ? "file" : "files";
  const subject = `Resonate AI: ${count} audio upload${count === 1 ? "" : "s"} received`;
  const intro = `${cleanText(userName)} (${cleanText(userEmail)}) submitted ${count} audio ${fileLabel} for cleaning. The following recording was converted to MP3.`;

  const html = renderEmailShell({
    eyebrow: "Upload received",
    title: `${count} audio ${fileLabel} received`,
    intro,
    content: buildUploadRows(files),
    footer:
      "These links are unique to this upload and expire in 7 days. The user will receive a separate message when the cleaned audio is ready.",
  });

  const textLines: string[] = [
    "Resonate AI",
    "UPLOAD RECEIVED",
    "",
    `${count} audio ${fileLabel} received from ${cleanText(userName)} <${cleanText(userEmail)}>.`,
    "",
  ];
  for (const file of files) {
    textLines.push(`Original: ${cleanText(file.filename)}`);
    textLines.push(
      `Converted file: ${cleanText(file.convertedFilename)} (${fmtMB(file.originalSizeBytes)} MB to ${fmtMB(file.convertedSizeBytes)} MB)`,
    );
    textLines.push(`MP3 link: ${cleanText(file.downloadUrl)}`);
    textLines.push(`Original link: ${cleanText(file.originalDownloadUrl)}`);
    textLines.push(`Link expires: ${fmtDateTime(file.downloadExpiresAt)}`);
    textLines.push("");
  }
  textLines.push(
    "These links are unique to this upload and expire in 7 days. The user will receive a separate message when the cleaned audio is ready.",
  );

  await transport.sendMail({
    from,
    to,
    replyTo: from,
    subject,
    text: textLines.join("\n"),
    html,
  });
}

export async function sendFinishedNotification({
  userEmail,
  userName,
  count,
  files,
}: FinishedNotification) {
  const transport = getTransport();
  const from = process.env.SMTP_FROM || "Resonate AI <no-reply@resonate.ai>";
  const to = userEmail;
  const fileLabel = count === 1 ? "file" : "files";
  const subject = "Resonate AI: your cleaned audio is ready";
  const intro = `Hi ${cleanText(userName)}, your ${count} cleaned audio ${fileLabel} ${count === 1 ? "is" : "are"} ready. Use the secure links below to open ${count === 1 ? "the file" : "your files"}.`;

  const html = renderEmailShell({
    eyebrow: "Cleaned audio ready",
    title: "Your cleaned audio is ready",
    intro,
    content: buildFinishedRows(files),
    footer:
      "These links are unique to your account and expire in 7 days. If you were not expecting this message, you can ignore it.",
  });

  const textLines: string[] = [
    "Resonate AI",
    "CLEANED AUDIO READY",
    "",
    `Hi ${cleanText(userName)},`,
    "",
    `Your ${count} cleaned audio ${fileLabel} ${count === 1 ? "is" : "are"} ready.`,
    "",
  ];
  for (const file of files) {
    textLines.push(`Original: ${cleanText(file.filename)}`);
    textLines.push(
      `Cleaned file: ${cleanText(file.cleanedFilename)} (${fmtMB(file.cleanedSizeBytes)} MB)`,
    );
    textLines.push(`Link: ${cleanText(file.downloadUrl)}`);
    textLines.push(`Link expires: ${fmtDateTime(file.downloadExpiresAt)}`);
    textLines.push("");
  }
  textLines.push(
    "These links are unique to your account and expire in 7 days. If you were not expecting this message, you can ignore it.",
  );

  await transport.sendMail({
    from,
    to,
    replyTo: from,
    subject,
    text: textLines.join("\n"),
    html,
  });
}

/*
 * TODO(v2 push notifications):
 *
 * The AndroidManifest already declares the FCM default notification channel
 * (com.google.firebase.messaging.default_notification_channel_id =
 * "resonate_default") as a forward-looking placeholder. v1 ships without push
 * notifications — users learn about finished files via the email triggered by
 * sendFinishedNotification above.
 *
 * To enable FCM in v2:
 *   1. Drop a google-services.json into android/app/ — Gradle auto-applies
 *      the google-services plugin (already wired in build.gradle).
 *   2. Install @capacitor/push-notifications and the FCM native plugin.
 *   3. Mint a device-token endpoint on /api/devices and persist tokens.
 *   4. After sendFinishedNotification, also push via FCM to the user's
 *      registered tokens.
 *   5. Make the channel resonate_default with importance HIGH so heads-up
 *      notifications show on lock screen.
 */
