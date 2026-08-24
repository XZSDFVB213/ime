-- =========================================================
-- EXTEND NOTIFICATIONS
-- Сохраняем существующие уведомления и старые данные
-- =========================================================


-- ---------------------------------------------------------
-- ENUM
-- ---------------------------------------------------------

ALTER TYPE "public"."NotificationType"
ADD VALUE IF NOT EXISTS 'HOMEWORK_CREATED';

ALTER TYPE "public"."NotificationType"
ADD VALUE IF NOT EXISTS 'HOMEWORK_GRADED';

ALTER TYPE "public"."NotificationType"
ADD VALUE IF NOT EXISTS 'MATERIAL_CREATED';

ALTER TYPE "public"."NotificationType"
ADD VALUE IF NOT EXISTS 'NEW_MESSAGE';

ALTER TYPE "public"."NotificationType"
ADD VALUE IF NOT EXISTS 'SYSTEM';


-- ---------------------------------------------------------
-- body -> message
-- Старый текст уведомления не теряем
-- ---------------------------------------------------------

ALTER TABLE "public"."notifications"
RENAME COLUMN "body" TO "message";


-- На всякий случай, если в старых данных были NULL
UPDATE "public"."notifications"
SET "message" = ''
WHERE "message" IS NULL;


ALTER TABLE "public"."notifications"
ALTER COLUMN "message" SET NOT NULL;


-- ---------------------------------------------------------
-- Новые поля
-- ---------------------------------------------------------

ALTER TABLE "public"."notifications"
ADD COLUMN "data" JSONB,
ADD COLUMN "updatedAt" TIMESTAMP(3)
NOT NULL DEFAULT CURRENT_TIMESTAMP;


-- ---------------------------------------------------------
-- Старый entityId переносим в data
-- ---------------------------------------------------------

UPDATE "public"."notifications"
SET "data" =
  jsonb_build_object(
    'entityId',
    "entityId"
  )
WHERE "entityId" IS NOT NULL;


-- Теперь старую колонку можно безопасно убрать
ALTER TABLE "public"."notifications"
DROP COLUMN "entityId";


-- ---------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------

DROP INDEX IF EXISTS
"public"."notifications_userId_idx";


CREATE INDEX
"notifications_userId_isRead_idx"
ON "public"."notifications"
("userId", "isRead");


CREATE INDEX
"notifications_userId_createdAt_idx"
ON "public"."notifications"
("userId", "createdAt");