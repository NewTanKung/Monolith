# Cloudflare Workers และอีเมล production

## ทรัพยากรที่ต้องเตรียม

1. Custom domain ที่ควบคุมได้ เช่น `hub.example.com` และบริการที่ `tasks.example.com`
2. PostgreSQL ที่ Workers เชื่อมต่อได้ ผ่าน `DATABASE_URL` หรือ Hyperdrive binding `HYPERDRIVE`
3. Resend API key และ sender domain ที่ยืนยันแล้ว พร้อมอีเมลผู้ส่ง เช่น `Monolith <noreply@example.com>`

สำหรับ production ของโปรเจกต์นี้ให้เตรียม Workers Paid และ CPU budget ที่เพียงพอสำหรับ Next.js และ bcrypt การทดสอบ preview ไม่จำลอง quota ของบัญชีจริง Workers Free จำกัด CPU 10 ms ต่อ invocation ซึ่งไม่เหมาะกับงาน hash รหัสผ่านชุดนี้ ดู [ข้อจำกัด CPU ของ Cloudflare](https://developers.cloudflare.com/workers/platform/limits/)

ใช้ [Resend Workers guide](https://resend.com/docs/send-with-cloudflare-workers) สำหรับการตั้งค่าผู้ส่ง และ [OpenNext guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/) สำหรับ deployment adapter ของโปรเจกต์นี้

## Runtime variables

| ชื่อ                    | ค่า                                                       |
| ----------------------- | --------------------------------------------------------- |
| `APP_ENV`               | `production`                                              |
| `HUB_URL`               | `https://hub.example.com`                                 |
| `SESSION_COOKIE_DOMAIN` | `.example.com`                                            |
| `DATABASE_URL`          | secret ของ PostgreSQL; ไม่ใช้ localhost ใน production     |
| `MAIL_PROVIDER`         | `resend`                                                  |
| `RESEND_API_KEY`        | secret จาก Resend                                         |
| `MAIL_FROM`             | sender ที่ยืนยันกับ Resend แล้ว                           |
| `ALLOW_REGISTRATION`    | `true` หรือ `false`; ค่า false ปิดรับสมัครแม้เปิดใน Admin |

Resend key และ database credentials ตั้งเป็น Worker secrets เท่านั้น ไม่ใช้ `NEXT_PUBLIC_*` และไม่ commit env จริง ไม่ต้องแชร์ `MONOLITH_JWT_SECRET` ให้บริการปลายทาง

Mailpit ใช้สำหรับ local/test เท่านั้น เมื่อ `APP_ENV=production` ระบบจะไม่ยอมใช้ Mailpit

`npm run cf:preview:hub` เตรียม env file ชั่วคราวใน `.wrangler` จาก `.env.local` และ `.dev.vars` ของคุณ โดยไม่เขียนทับไฟล์เดิม และใช้ IPv4 สำหรับ Docker PostgreSQL ที่ `localhost:55432` เพื่อหลีกเลี่ยง IPv6 fallback บน Windows ขั้นตอน deploy ไม่ใช้ wrapper นี้

## Build และ deploy

| Workers Builds setting | ค่า                       |
| ---------------------- | ------------------------- |
| Root directory         | repository root           |
| Node                   | 24                        |
| Build command          | `npm run cf:build:hub`    |
| Deploy command         | `npm run cf:deploy:hub`   |
| Wrangler config        | `apps/hub/wrangler.jsonc` |

```sh
npm ci
npm run generate
npm run check
npm run cf:build
npm run cf:check
```

ใช้ฐานข้อมูลแยกสำหรับ checks; build ไม่ควรเปลี่ยน production schema รัน `npm run db:migrate` จาก terminal ที่เข้าถึง production database หลังสำรองแล้ว ก่อนเปิดรับ traffic ของรุ่นใหม่ การทำ baseline ฐานข้อมูลเก่าดู docs/upgrading.md

หลังตั้ง secrets และ custom domain แล้วจึงรัน `npm run cf:deploy:hub` ขั้นนี้เป็นการ deploy จริง และอยู่นอกการส่งมอบโค้ด/การทดสอบ local

## SSO และความเชื่อถือ

ใช้ parent cookie domain ของคุณเอง ไม่ตั้ง `.workers.dev`, `.pages.dev` หรือ public hosting suffix เป็น cookie domain ทุก subdomain ที่ได้รับ session cookie ต้องเป็นบริการที่คุณเชื่อถือและควบคุม

Cookie เป็น HttpOnly, Secure ใน production, SameSite=Lax, Path=/ และอายุ 7 วัน แต่ละ Service ถือ token เฉพาะของตัวเองและส่ง cookie ไปตรวจที่ Hub ผ่าน SDK ฝั่ง server ทุกครั้ง ห้าม cache ผลตรวจสิทธิ์เพื่อข้ามการระงับบัญชีหรือยกเลิก session

Workers เก็บ Prisma client เฉพาะ execution context; Node ใช้ connection pool ร่วมกัน รองรับ `nodejs_compat` และ Prisma driver adapter ตาม config ที่มีอยู่

## ตรวจหลัง deploy

- `/api/health/live` และ `/api/health/ready` ต้องตอบ 200; ตรวจรายละเอียดที่หน้า Admin → การตั้งค่า
- สมัครด้วยอีเมลทดสอบจริง ยืนยันอีเมล และลองกู้รหัสผ่าน ตรวจทั้ง inbox และ spam
- ยืนยัน/กู้บัญชี Admin เดิมตามคู่มืออัปเกรด ก่อนเปิดรับสมัคร
- เพิ่มบริการ SSO จริง สร้าง token และตรวจการล็อกอินข้าม subdomain การกลับ URL เดิม และการออกจากระบบ
- ทดสอบปิดบริการ ยกเลิก token และระงับบัญชีให้ถูกปฏิเสธทันที
- ตั้ง HTTP/availability monitoring ให้ health endpoints และตรวจอัตราข้อผิดพลาดใน Worker logs โดยไม่เก็บ Cookie, Authorization หรือ URL fragment
- ตั้งงานประจำวันจาก runner ที่ปลอดภัยให้รัน `npm run maintenance:cleanup` พร้อม production database secret

หาก deploy รุ่นเก่ากลับเพื่อ rollback ให้คง schema เพิ่มเติมไว้ ห้ามลบคอลัมน์หรือข้อมูลเพื่อ downgrade ผู้ใช้ต้องล็อกอินใหม่เมื่อเปลี่ยนรุ่น session
