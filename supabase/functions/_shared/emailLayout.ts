// Logo hosted in the public "email-assets" Supabase Storage bucket (see
// scripts/email_assets_bucket.sql) — email clients only load images from a
// public URL, they can't reach local app assets.
const LOGO_URL = Deno.env.get("EMAIL_LOGO_URL");

// Shared HTML wrapper so both scheduled emails look consistent and
// reasonably professional without pulling in a templating library.
export function wrapEmail(bodyHtml: string) {
  return `
  <div style="background:#F5F4EF;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E8E6DF;">
      <div style="background:#0B0E14;padding:20px 28px;">
        ${
          LOGO_URL
            ? `<img src="${LOGO_URL}" alt="Welth" height="24" style="display:block;height:24px;width:auto;" />`
            : `<span style="color:#FFFFFF;font-size:16px;font-weight:600;letter-spacing:0.2px;">Welth</span>`
        }
      </div>
      <div style="padding:28px;color:#1A1D26;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:16px 28px;border-top:1px solid #E8E6DF;">
        <span style="color:#8A8D96;font-size:11px;">You're receiving this because you have an account with Welth. Manage your budget anytime in the app.</span>
      </div>
    </div>
  </div>`;
}
