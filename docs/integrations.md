# เชื่อม Service กับ Monolith

บริการปลายทางเก็บข้อมูลงานของตัวเอง ใช้ `user.id` จาก Hub เชื่อมบัญชี ไม่อ่านฐานข้อมูล Hub โดยตรง และไม่เก็บ signing key ส่วนกลาง

## ตั้งบริการ

1. เพิ่มรายการใน Admin → บริการ เลือก SSO ตั้ง URL เช่น `https://tasks.example.com/` และสิทธิ์ขั้นต่ำ
2. ตั้ง `SESSION_COOKIE_DOMAIN=.example.com` ที่ Hub และวาง Service บน subdomain ที่คุณควบคุมภายใต้โดเมนนี้
3. เปิดการเชื่อมต่อของบริการ สร้าง token พร้อมสิทธิ์ที่ต้องใช้ คัดลอกครั้งเดียวไปเก็บใน server secret ของ Service
4. ตั้ง Service env: `HUB_URL`, `MONOLITH_SERVICE_TOKEN`, `MONOLITH_SERVICE_ID` และ `SERVICE_URL`

Local ใช้ `http://localhost:3000` กับ Service ต่างพอร์ตได้ Cookie ของ localhost ใช้ร่วมกันข้ามพอร์ต การทดสอบอัตโนมัติใช้สอง subdomain ของ `monolith.test` ผ่าน proxy เฉพาะ test

## ใช้ SDK

ใน monorepo ใช้ workspace `@monolith/auth-client` ถ้าเป็น repo แยก ให้ `npm run build:packages` แล้ว `npm pack --workspace=@monolith/auth-client` เพื่อติดตั้ง tarball ที่ตรวจแล้ว หรือ publish ลง registry ของคุณ แพ็กเกจนี้ยังไม่ได้อ้างว่าเผยแพร่บน public npm

โค้ดต่อไปนี้ทำงานเฉพาะฝั่ง server:

```ts
import {
  getServiceSession,
  createHubLoginUrl,
  HubAuthError,
} from "@monolith/auth-client/server";

export async function GET(request: Request) {
  try {
    const { user } = await getServiceSession(request.headers.get("cookie"), {
      hubUrl: process.env.HUB_URL!,
      serviceToken: process.env.MONOLITH_SERVICE_TOKEN!,
    });
    return Response.json({ user }); // โหลดข้อมูลของ Service โดยใช้ user.id
  } catch (error) {
    if (
      error instanceof HubAuthError &&
      error.status === 401 &&
      error.code === "UNAUTHENTICATED"
    ) {
      return Response.redirect(
        createHubLoginUrl({
          hubUrl: process.env.HUB_URL!,
          serviceId: process.env.MONOLITH_SERVICE_ID!,
          returnTo: process.env.SERVICE_URL!,
        }),
      );
    }
    return Response.json(
      { error: "ยังเข้าใช้บริการไม่ได้ กรุณาลองใหม่" },
      { status: error instanceof HubAuthError ? error.status : 503 },
    );
  }
}
```

ต้องตรวจสิทธิ์ในทุก API ที่อ่านหรือแก้ข้อมูลสำคัญ ไม่ตรวจแค่หน้าแรกของ Service ถ้า Hub ติดต่อไม่ได้ ให้ปฏิเสธด้วย 503 และมีทางลองใหม่ ห้ามเปลี่ยนเป็น Guest แล้วอนุญาตต่อ

บริการขั้นต่ำ Guest อาจได้ `user: null` พร้อม role Guest ถือเป็นการอนุญาตเข้าบริการสาธารณะ ไม่ใช่บัญชีสมาชิก ผลมีรูปแบบ `{ user, service: { id, slug }, access: { role } }` ข้อมูล user มีเฉพาะ id, email, name, role และ image

## API สาธารณะสำหรับ Service

| Endpoint                        | การยืนยัน                                            | ผลลัพธ์                                                                                                  |
| ------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `GET /api/integrations/session` | Bearer token สิทธิ์ `session:read` และ Cookie ผู้ใช้ | 200 user/access, 401 ไม่ได้ล็อกอินหรือ token เสีย, 403 สิทธิ์ไม่ถึง/บริการปิด, 503 ปรับปรุง/ระบบไม่พร้อม |
| `GET /api/auth/me`              | Cookie ผู้ใช้                                        | `{ user }`; ไม่มี session คืน `{ user: null }` ไม่ใช่ API ตรวจสิทธิ์รายบริการ                            |
| `POST /api/notifications`       | Bearer token สิทธิ์ `notifications:write`            | 201 เมื่อสร้างสำเร็จ                                                                                     |

Service Token ไม่ให้สิทธิ์อ่านรายชื่อสมาชิกทั้งหมด แหล่งการแจ้งเตือนมาจากบริการที่ผูกกับ token ไม่เชื่อ `sourceApp` ที่ผู้เรียกส่งมา

```ts
await fetch(new URL("/api/notifications", process.env.HUB_URL!), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.MONOLITH_SERVICE_TOKEN}`,
  },
  body: JSON.stringify({
    userId: user.id,
    title: "งานใหม่ของคุณ",
    message: "มีงานพร้อมดำเนินการแล้ว",
    linkUrl: "https://tasks.example.com/work",
  }),
});
```

Hub ตรวจ URL กลับหลังล็อกอินกับ origin และ path ของบริการที่ลงทะเบียน URL ภายนอกจะกลับหน้า Hub การเปลี่ยน URL เปลี่ยนจาก SSO เป็นลิงก์ หรือปิดบริการจะยกเลิก token เดิม ต้องสร้างใหม่ก่อนเชื่อมต่อ

## เปลี่ยนจาก SDK เดิม

`verifyHubSession` และ JWT helpers เดิมเป็น legacy ไม่สามารถตรวจ opaque session รุ่นใหม่ได้ เปลี่ยนเป็น import จาก `/server` และเอา `MONOLITH_JWT_SECRET` ออกจาก env ของ Service ตัวเก่า จากนั้นล็อกอินใหม่

Token จัดเก็บเป็น hash ดูรหัสเดิมซ้ำไม่ได้ หมุน token ใน Admin แล้วอัปเดต env ของ Service ทันที การหมุนยกเลิก token เดิมทั้งหมดของบริการ และมีประวัติการดำเนินการให้ตรวจสอบ
