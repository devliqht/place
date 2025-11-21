import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface EmailTemplate {
  html: string;
  text: string;
}

interface VerificationEmailData {
  verificationUrl: string;
  userEmail: string;
  logoUrl?: string;
}

function loadTemplate(filename: string): string {
  const templatePath = join(__dirname, '..', 'templates', filename);
  return readFileSync(templatePath, 'utf-8');
}

function replaceTemplateVars(
  template: string,
  data: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, value);
  }
  return result;
}

export function getVerificationEmailTemplate(
  data: VerificationEmailData
): EmailTemplate {
  const htmlTemplate = loadTemplate('verificationEmail.html');
  const textTemplate = loadTemplate('verificationEmail.txt');

  const logoUrl =
    data.logoUrl || 'https://storage.googleapis.com/gdgoc_server/title.png';

  const templateData = {
    VERIFICATION_URL: data.verificationUrl,
    USER_EMAIL: data.userEmail,
    LOGO_URL: logoUrl,
  };

  return {
    html: replaceTemplateVars(htmlTemplate, templateData),
    text: replaceTemplateVars(textTemplate, templateData),
  };
}
