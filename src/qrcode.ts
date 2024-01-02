import QRCode from 'qrcode'

// Generate QR Code
const generateQR = async (conf: string) => {
  return await QRCode.toDataURL(conf)
}
