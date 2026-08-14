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

function fmtMB(b: number) {
  return (b / (1024 * 1024)).toFixed(2);
}

function fmtDateTime(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toUTCString();
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

  const subject =
    count === 1
      ? `New audio upload: ${files[0]?.filename || ""}`
      : `${count} new audio uploads`;

  const rows = files
    .map((f) => {
      const exp = fmtDateTime(f.downloadExpiresAt);
      return `
      <tr>
        <td style="padding:10px 0 4px;color:#fff;font-weight:600;">${escapeHtml(f.filename)}</td>
      </tr>
      <tr>
        <td style="padding:0 0 4px;color:#a1a1aa;font-size:13px;">
          Converted: ${escapeHtml(f.convertedFilename)} ·
          ${fmtMB(f.originalSizeBytes)} MB &rarr; ${fmtMB(f.convertedSizeBytes)} MB
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 14px;font-size:14px;">
          <a href="${escapeHtml(f.downloadUrl)}" style="display:inline-block;padding:8px 14px;border-radius:8px;background:linear-gradient(135deg,#a78bfa,#ec4899);color:#fff;text-decoration:none;font-weight:500;">Download MP3</a>
          &nbsp;
          <a href="${escapeHtml(f.originalDownloadUrl)}" style="color:#a1a1aa;font-size:13px;">original</a>
          <span style="color:#71717a;font-size:12px;margin-left:8px;">(link expires ${escapeHtml(exp)})</span>
        </td>
      </tr>`;
    })
    .join("");

  const html = `
<!doctype html>
<html>
  <body style="margin:0;font-family:Inter,system-ui,sans-serif;background:#0a0a0f;color:#e5e7eb;padding:32px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#121219;border:1px solid #262633;border-radius:12px;padding:32px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
        <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#a78bfa,#ec4899);"></div>
        <strong style="font-size:18px;">Resonate AI</strong>
      </div>
      <h1 style="font-size:22px;margin:0 0 12px;color:#fff;">${count} new audio upload${count === 1 ? "" : "s"}</h1>
      <p style="color:#a1a1aa;margin:0 0 20px;line-height:1.6;">
        <strong style="color:#fff;">${escapeHtml(userName)}</strong> (${escapeHtml(userEmail)}) submitted ${count} file${count === 1 ? "" : "s"} for cleaning. All files have been converted to MP3.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
        ${rows}
      </table>
      <p style="color:#a1a1aa;font-size:13px;margin:0;border-top:1px solid #262633;padding-top:16px;">
        The user has been notified to expect cleaned audio in 24-48 hours. Files were not attached &mdash; use the download links above (they expire in 7 days).
      </p>
    </div>
  </body>
</html>`;

  const textLines: string[] = [
    `${count} new audio upload${count === 1 ? "" : "s"} from ${userName} <${userEmail}>`,
    "",
  ];
  for (const f of files) {
    textLines.push(`File:    ${f.filename}`);
    textLines.push(`MP3:     ${f.convertedFilename}`);
    textLines.push(
      `Size:    ${fmtMB(f.originalSizeBytes)} MB -> ${fmtMB(f.convertedSizeBytes)} MB`,
    );
    textLines.push(`MP3 link:     ${f.downloadUrl}`);
    textLines.push(`Original link: ${f.originalDownloadUrl}`);
    textLines.push(`Links expire: ${fmtDateTime(f.downloadExpiresAt)}`);
    textLines.push("");
  }
  textLines.push(
    "The user has been notified to expect cleaned audio in 24-48 hours. Files were not attached — use the download links above (they expire in 7 days).",
  );
  const text = textLines.join("\n");

  await transport.sendMail({ from, to, subject, text, html });
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

  const subject =
    count === 1
      ? `Your cleaned audio is ready: ${files[0]?.filename || ""}`
      : `Your ${count} cleaned audio files are ready`;

  const rows = files
    .map((f) => {
      const exp = fmtDateTime(f.downloadExpiresAt);
      return `
      <tr>
        <td style="padding:10px 0 4px;color:#fff;font-weight:600;">${escapeHtml(f.filename)}</td>
      </tr>
      <tr>
        <td style="padding:0 0 4px;color:#a1a1aa;font-size:13px;">
          Cleaned file: ${escapeHtml(f.cleanedFilename)} · ${fmtMB(f.cleanedSizeBytes)} MB
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 14px;font-size:14px;">
          <a href="${escapeHtml(f.downloadUrl)}" style="display:inline-block;padding:8px 14px;border-radius:8px;background:linear-gradient(135deg,#a78bfa,#ec4899);color:#fff;text-decoration:none;font-weight:500;">Download cleaned audio</a>
          <span style="color:#71717a;font-size:12px;margin-left:8px;">(link expires ${escapeHtml(exp)})</span>
        </td>
      </tr>`;
    })
    .join("");

  const html = `
<!doctype html>
<html>
  <body style="margin:0;font-family:Inter,system-ui,sans-serif;background:#0a0a0f;color:#e5e7eb;padding:32px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#121219;border:1px solid #262633;border-radius:12px;padding:32px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
        <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#a78bfa,#ec4899);"></div>
        <strong style="font-size:18px;">Resonate AI</strong>
      </div>
      <h1 style="font-size:22px;margin:0 0 12px;color:#fff;">Your audio is ready</h1>
      <p style="color:#a1a1aa;margin:0 0 20px;line-height:1.6;">
        Hi ${escapeHtml(userName)}, your ${count} cleaned audio file${count === 1 ? " is" : "s are"} ready. Download below &mdash; links expire in 7 days.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
        ${rows}
      </table>
      <p style="color:#a1a1aa;font-size:13px;margin:0;border-top:1px solid #262633;padding-top:16px;">
        Sign in to your Resonate AI account before clicking the link. The link is unique to your account.
      </p>
    </div>
  </body>
</html>`;

  const textLines: string[] = [
    `Hi ${userName},`,
    "",
    `Your ${count} cleaned audio file${count === 1 ? " is" : "s are"} ready.`,
    "",
  ];
  for (const f of files) {
    textLines.push(`Original: ${f.filename}`);
    textLines.push(`Cleaned:  ${f.cleanedFilename} (${fmtMB(f.cleanedSizeBytes)} MB)`);
    textLines.push(`Link:     ${f.downloadUrl}`);
    textLines.push(`Expires:  ${fmtDateTime(f.downloadExpiresAt)}`);
    textLines.push("");
  }
  textLines.push(
    "Sign in to your Resonate AI account before clicking the link. The link is unique to your account.",
  );
  const text = textLines.join("\n");

  await transport.sendMail({ from, to, subject, text, html });
}