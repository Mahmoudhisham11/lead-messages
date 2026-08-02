export function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith("0")) {
    cleaned = "20" + cleaned.substring(1);
  }
  return cleaned;
}

export function openWhatsApp(phone: string, text: string): void {
  const formatted = formatPhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${formatted}?text=${encoded}`;
  window.open(url, "_blank");
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
  return phoneRegex.test(phone.trim());
}
