export const roleLabels: Record<string, string> = {
  GUEST: "บุคคลทั่วไป",
  MEMBER: "สมาชิก",
  ADMIN: "ผู้ดูแล",
};
export const categoryLabels: Record<string, string> = {
  WORK: "งานและเครื่องมือ",
  GAME: "เกม",
  LIFESTYLE: "ไลฟ์สไตล์",
};
export const statusLabels: Record<string, string> = {
  ONLINE: "เปิดให้ใช้งาน",
  BETA: "เวอร์ชันทดลอง",
  MAINTENANCE: "กำลังปรับปรุง",
  DISABLED: "ปิดบริการ",
};

export function deviceLabel(agent: string) {
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /Firefox\//.test(agent)
      ? "Firefox"
      : /Chrome\//.test(agent)
        ? "Chrome"
        : /Safari\//.test(agent)
          ? "Safari"
          : "เบราว์เซอร์";
  const system = /Android/.test(agent)
    ? "Android"
    : /iPhone|iPad/.test(agent)
      ? "iOS"
      : /Windows/.test(agent)
        ? "Windows"
        : /Macintosh|Mac OS/.test(agent)
          ? "macOS"
          : /Linux/.test(agent)
            ? "Linux"
            : "อุปกรณ์ของคุณ";
  return browser + " บน " + system;
}
