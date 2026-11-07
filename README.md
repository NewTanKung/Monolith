# Monolith

Hub ภาษาไทยสำหรับรวมบริการ บัญชีสมาชิก และ SSO บน subdomain ที่คุณควบคุม ใช้ Next.js, PostgreSQL/Prisma และ Cloudflare Workers ผ่าน OpenNext

## เริ่มใช้งาน local

ต้องใช้ Node.js 22.13+ หรือ 24+, npm และ Docker Desktop ที่เปิดทำงานแล้ว

```sh
npm ci
npm run setup
docker compose up -d --wait
npm run db:migrate
npm run dev
```

Hub: http://localhost:3000 · กล่องอีเมลทดสอบ Mailpit: http://localhost:8025

ฐานข้อมูลเดิมต้องอ่าน [ขั้นตอนอัปเกรด](docs/upgrading.md) ก่อนรัน migration ครั้งแรก ห้าม reset ฐานข้อมูลที่มีข้อมูลใช้งานจริง

`setup` เติมเฉพาะ env ที่ยังไม่มี และไม่เปลี่ยน secret เดิม Root `.env` ใช้กับ Prisma และ `apps/hub/.env.local` ใช้กับ Hub; `DATABASE_URL` ต้องตรงกัน Seed ไม่สร้างบริการตัวอย่าง บริการจริงเพิ่มจาก `/admin`

## ผู้ใช้และ Admin

สมาชิกสมัครด้วยอีเมลและรหัสผ่าน ยืนยันอีเมลจากกล่องจดหมายก่อนเข้าสู่ระบบ บน local อีเมลจะอยู่ใน Mailpit ไม่ได้ส่งถึงอินเทอร์เน็ต

สร้าง Admin ผ่าน PowerShell ในโฟลเดอร์โปรเจกต์:

```powershell
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "<รหัสผ่านใหม่อย่างน้อย 12 ตัวอักษร>"
npm run admin:create
Remove-Item Env:ADMIN_PASSWORD
npm run admin:verify
Remove-Item Env:ADMIN_EMAIL
```

เปิดอีเมลแล้วกดยืนยัน จากนั้นล็อกอินและเข้า `/admin` คำสั่งไม่เขียนทับหรือเลื่อนสิทธิ์บัญชีที่มีอยู่ หากเป็น Admin เดิมให้รันเฉพาะ `admin:verify` โดยตั้ง `ADMIN_EMAIL` ให้ตรงบัญชี

หน้าบัญชี `/account` ใช้แก้ชื่อ เปลี่ยนอีเมล เปลี่ยนรหัสผ่าน และออกจากอุปกรณ์ต่าง ๆ การเปลี่ยนอีเมลจะมีผลเมื่อยืนยันอีเมลใหม่แล้วเท่านั้น การเปลี่ยนรหัสผ่านหรือกู้รหัสผ่านจะยกเลิก session ทั้งหมด

## จัดการบริการ

- **ลิงก์ทั่วไป:** ชี้ URL หรือ path ที่ใช้งานจริง
- **SSO:** ใช้ HTTPS บน subdomain ภายใต้ `SESSION_COOKIE_DOMAIN` ของคุณ แต่ละบริการสร้าง Service Token และกำหนดสิทธิ์ได้จาก Admin
- สมาชิกเข้าใช้ตามระดับ Guest → Member → Admin บริการ Disabled ไม่เปิดให้เข้าถึง ส่วน Maintenance แสดงหน้าปรับปรุง
- การเพิ่มลิงก์ไม่ทำให้บริการปลายทางรองรับ SSO อัตโนมัติ ต้องติดตั้ง SDK ฝั่ง server ตาม [คู่มือเชื่อมบริการ](docs/integrations.md)
- สิทธิ์และสถานะบัญชีตรวจจาก Hub ล่าสุด ไม่ให้บริการเก็บ signing key กลาง

หน้า Admin มีส่วนบริการ สมาชิก การตั้งค่ารับสมัคร ความพร้อม และประวัติการจัดการ ระบบป้องกันการระงับหรือลดสิทธิ์ Admin ที่ยืนยันอีเมลแล้วคนสุดท้าย

## คำสั่ง

| คำสั่ง                        | หน้าที่                                          |
| ----------------------------- | ------------------------------------------------ |
| `npm run setup`               | เติมค่า env local ที่ขาด                         |
| `npm run dev`                 | ตรวจ env/ฐานข้อมูล/migration แล้วเปิด dev server |
| `npm run db:migrate`          | ใช้ migration ที่ commit แล้ว                    |
| `npm run db:seed`             | ไม่เพิ่มบริการ และไม่แก้ข้อมูลที่มีอยู่          |
| `npm run admin:create`        | สร้าง Admin ใหม่โดยไม่เขียนทับบัญชีเดิม          |
| `npm run admin:verify`        | ส่งลิงก์ยืนยันอีเมลให้ Admin เดิมหรือใหม่        |
| `npm run maintenance:cleanup` | ล้าง session/token/counter ที่หมดอายุ            |
| `npm run check`               | lint, types, unit tests และ production build     |
| `npm run test:e2e`            | browser/integration tests บน desktop และ mobile  |
| `npm run cf:build`            | สร้าง Cloudflare Worker                          |
| `npm run cf:check`            | Wrangler dry run ไม่ deploy จริง                 |
| `npm run test:e2e:workers`    | ทดสอบชุดเดียวกันบน Workers preview               |

## ทดสอบ

ใช้ฐานข้อมูลทดสอบที่แยกจากข้อมูลส่วนตัว/production และเปิด Mailpit ก่อน `npm run build` แล้วรัน `npx playwright install chromium` และ `npm run test:e2e` หากใช้ Chrome ที่ติดตั้งแล้ว ตั้ง `PLAYWRIGHT_CHANNEL=chrome`

ชุดทดสอบมี proxy เฉพาะ loopback สำหรับ `hub.monolith.test` และ `service.monolith.test` ไม่แก้ OS hosts และไม่ใช้ DNS ภายนอก ทดสอบด้วย `APP_ENV=test` บน HTTP เฉพาะ test domain นี้เท่านั้น Production ต้องใช้ HTTPS ทุกบริการ SSO

Fixtures สร้างชื่อเฉพาะแต่ละรอบและล้างเฉพาะข้อมูลของตัวเอง ไม่ seed บริการกลับเข้า registry

## ขึ้นใช้งานจริง

ดู [Cloudflare และ Resend](docs/cloudflare.md), [การย้ายข้อมูลและสำรอง](docs/upgrading.md) และ [Service SDK](docs/integrations.md)

ตั้ง `APP_ENV=production` พร้อมโดเมนจริง PostgreSQL ที่ Workers เข้าถึงได้ และ Resend sender ที่ยืนยันแล้ว การทดสอบ local ผ่านไม่ได้หมายความว่าตั้งทรัพยากร production หรือส่งอีเมลจริงสำเร็จแล้ว ต้องทำ smoke test หลังตั้งค่า

Health endpoints: `/api/health/live` ตรวจ process และ `/api/health/ready` คืนเพียง `{ ok }` พร้อม 200/503 โดยไม่เปิดเผย secret Admin เห็นรายการตั้งค่าที่ต้องตรวจได้จากการตั้งค่า

## โครงสร้าง

```text
apps/hub              Hub, account APIs, Admin, registry, notifications
packages/auth-client  types และ server-side Service SDK
scripts               setup, preflight, bootstrap, maintenance
tests                 unit, browser tests, isolated integration fixtures
```

SDK JWT รุ่นเดิมคง export ไว้สำหรับ compatibility ของแพ็กเกจ แต่ Hub รุ่นนี้ไม่รับ JWT cookie เดิมหรือ `MONOLITH_SERVICE_TOKENS` แบบ JSON map อีกต่อไป ให้ล็อกอินใหม่และออก token รายบริการแทน

MIT License. ดู THIRD_PARTY_NOTICES.md สำหรับ Magic UI
