import QRCode from 'qrcode';

// CRC16 CCITT calculation for official Pix BR Code
function getCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatPixField(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

export interface PixPayloadOptions {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount?: number;
  txId?: string;
}

/**
 * Generates the standard EMV BR Code (Pix Copia e Cola)
 */
export function generatePixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txId = 'ESTUDIOVIP',
}: PixPayloadOptions): string {
  // Normalize key (remove non-digits if CNPJ)
  const cleanKey = pixKey.replace(/[^\w@.-]/g, '');
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 25)
    .toUpperCase();
  const cleanCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 15)
    .toUpperCase();
  const cleanTxId = (txId || '***').substring(0, 25);

  const guiField = formatPixField('00', 'br.gov.bcb.pix');
  const keyField = formatPixField('01', cleanKey);
  const accountInfo = formatPixField('26', `${guiField}${keyField}`);

  let payload = '';
  payload += formatPixField('00', '01'); // Payload Format Indicator
  payload += accountInfo;
  payload += formatPixField('52', '0000'); // Merchant Category Code
  payload += formatPixField('53', '986'); // Currency BRL

  if (amount && amount > 0) {
    payload += formatPixField('54', amount.toFixed(2));
  }

  payload += formatPixField('58', 'BR'); // Country Code
  payload += formatPixField('59', cleanName || 'MARIANO A SILVA');
  payload += formatPixField('60', cleanCity || 'COXIM');

  const refLabel = formatPixField('05', cleanTxId);
  payload += formatPixField('62', refLabel);

  payload += '6304';
  const checksum = getCRC16(payload);

  return `${payload}${checksum}`;
}

/**
 * Generates a Data URL image of the QR Code for display
 */
export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1.5,
      width: 280,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code', err);
    return '';
  }
}

/**
 * Formats a CNPJ string as 00.000.000/0000-00
 */
export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}
