# อัปเกรด สำรอง และกู้คืน

สำรอง PostgreSQL และเก็บ deployment รุ่นเดิมก่อนอัปเกรด ทดสอบบนสำเนาฐานข้อมูลก่อนใช้งานจริง การอัปเกรดเพิ่มตารางและคอลัมน์ ไม่ลบหรือ reset บัญชี รหัสผ่าน role บริการ รายการโปรด หรือการแจ้งเตือน

## สำรองฐานข้อมูล

สำหรับ local Docker หรือ PostgreSQL ที่มี `pg_dump` ติดตั้งแล้ว:

```sh
node --env-file=.env scripts/database-backup.mjs backups/before-upgrade.sql
```

คำสั่งเขียนไฟล์เป็น binary-safe เพื่อไม่ให้ PowerShell แปลง encoding และไม่เขียนทับไฟล์ที่มีอยู่ เก็บไฟล์สำรองนอก Git และจำกัดผู้เข้าถึง เพราะมีข้อมูลส่วนตัวและ password hashes

ทดสอบ restore ลงฐานข้อมูลว่างที่สร้างแยกไว้ ห้ามใช้ชื่อฐานข้อมูล production ที่กำลังให้บริการ:

```sh
node --env-file=.env scripts/database-backup.mjs backups/before-upgrade.sql --restore-to=monolith_restore_test
```

คำสั่ง restore ปฏิเสธฐานข้อมูลที่มีตารางอยู่แล้ว และไม่ล้างข้อมูลให้อัตโนมัติ PostgreSQL ที่ไม่ได้ใช้ Docker ต้องมี `psql` ใน PATH ด้วย

## ฐานข้อมูลใหม่

```sh
npm ci
npm run setup
docker compose up -d --wait
npm run db:migrate
```

## ฐานข้อมูลเดิม

หากมีประวัติ Prisma migration ถูกต้องอยู่แล้ว ให้สำรองและรัน `npm run db:migrate` ได้เลย

หากเดิมใช้ `db push` และยังไม่มี migration history ให้ตรวจ schema จริงก่อน baseline:

- `20261106000000_initial` คือ User, AppItem, UserFavorite และ Notification รุ่นเดิม
- `20261106000100_rate_limits` คือ RateLimit หากยังไม่มีตารางนี้ ให้ migrate สร้างตามปกติ

หลังยืนยันว่าตารางเดิมตรงกับ migration จึง mark เฉพาะสิ่งที่มีอยู่แล้ว:

```sh
node --env-file=.env node_modules/prisma/build/index.js migrate resolve --applied 20261106000000_initial --schema=apps/hub/prisma/schema.prisma
```

เฉพาะเมื่อมี RateLimit ที่ตรงกับ migration อยู่แล้ว:

```sh
node --env-file=.env node_modules/prisma/build/index.js migrate resolve --applied 20261106000100_rate_limits --schema=apps/hub/prisma/schema.prisma
```

จากนั้น `npm run db:migrate` จะเพิ่ม production_accounts migration ห้ามใช้ reset, force-reset หรือ db push แทนขั้นตอนอัปเกรด production

## บัญชีและ session เปลี่ยนอย่างไร

- Cookie JWT รุ่นเดิมไม่ใช้กับ Hub รุ่นใหม่ ผู้ใช้ต้องเข้าสู่ระบบใหม่
- บัญชีเดิมเก็บรหัสผ่านและ role ไว้ แต่เริ่มด้วย `emailVerifiedAt=null` ต้องยืนยันอีเมลก่อนล็อกอิน ใช้ปุ่มส่งยืนยันซ้ำเมื่อกรอกรหัสผ่านเดิมถูกต้อง หรือขอลิงก์ผ่าน API ยืนยันอีเมล
- Admin เดิมตั้ง `ADMIN_EMAIL` ให้ตรงบัญชี แล้วรัน `npm run admin:verify` เปิด Mailpit บน local หรือกล่องจดหมายจริงหลังตั้ง Resend เพื่อยืนยันก่อนเปิดให้บริการ
- `admin:create` สร้าง Admin ใหม่เท่านั้น ไม่เลื่อนสิทธิ์ Member หรือเขียนทับรหัสผ่านเดิม
- อย่าแก้ `emailVerifiedAt` ในฐานข้อมูลเพื่อข้ามการยืนยัน และไม่สร้าง default admin/password

## บริการและ token เดิม

รายการบริการเดิมเป็น LINK โดยค่าเริ่มต้น เปลี่ยนบริการที่เชื่อม SDK จริงเป็น SSO จาก Admin แล้วสร้าง Service Token ของบริการนั้น บริการปลายทางย้ายไปใช้ `@monolith/auth-client/server`

JSON map `MONOLITH_SERVICE_TOKENS` และ JWT signing key ที่เคยแชร์กับ Service ไม่ใช้ยืนยันในระบบใหม่ ต้องออก token ใหม่ และนำ signing key เดิมออกจาก Service ที่ย้ายเสร็จแล้ว

Seed ไม่เพิ่มบริการ ไม่เปลี่ยน destination เดิม และไม่ลบข้อมูลที่มีอยู่ การลบบริการ local ที่ผู้ใช้เคยขอไม่ถูกรันอัตโนมัติบนฐานข้อมูลอื่น

## ตรวจรับและ rollback

ทดสอบบัญชีเดิม การยืนยันอีเมล สิทธิ์ Admin และ Service จริงก่อนเปิด traffic ใช้ `/api/health/ready` และตรวจการส่งถึง inbox จริง การมี API key อย่างเดียวไม่ยืนยันว่า sender domain ถูกต้อง

หาก rollback โค้ด ให้คงตาราง/คอลัมน์เพิ่มไว้ ไม่ทำ destructive down migration และให้ผู้ใช้ล็อกอินใหม่ ถ้าจำเป็นต้อง restore ให้หยุด writers ก่อน กู้ลงฐานข้อมูลแยก ตรวจจำนวนข้อมูลและสิทธิ์ แล้วสลับ connection อย่างมีแผน ข้อมูลที่เกิดหลัง backup ต้องประเมินก่อนสลับกลับ

รัน `npm run maintenance:cleanup` เป็นประจำเพื่อล้าง session, email token และ rate-limit counter ที่หมดอายุ โดยไม่กระทบ session ที่ยังใช้ได้
