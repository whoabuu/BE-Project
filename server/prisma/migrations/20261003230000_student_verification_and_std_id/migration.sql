-- CreateEnum
CREATE TYPE "ProfileVerificationStatus" AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED'
);

-- Add student verification fields and human-readable student ID.
ALTER TABLE "StudentProfile"
ADD COLUMN "studentCode" TEXT,
ADD COLUMN "verificationStatus" "ProfileVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "verificationNote" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "verifiedByTpoId" TEXT;

-- Create a PostgreSQL sequence for sequential student IDs.
CREATE SEQUENCE "student_code_seq"
START WITH 1001
INCREMENT BY 1
MINVALUE 1001;

-- Generate STD1001, STD1002, STD1003...
-- for existing students in creation order.
WITH ordered_students AS (
    SELECT
        "id",
        1000 + ROW_NUMBER() OVER (
            ORDER BY "createdAt" ASC, "id" ASC
        ) AS student_number
    FROM "StudentProfile"
)
UPDATE "StudentProfile" AS sp
SET "studentCode" = 'STD' || ordered_students.student_number::TEXT
FROM ordered_students
WHERE sp."id" = ordered_students."id";

-- Make the student code mandatory after backfilling existing records.
ALTER TABLE "StudentProfile"
ALTER COLUMN "studentCode" SET NOT NULL;

-- Student IDs must be unique.
CREATE UNIQUE INDEX "StudentProfile_studentCode_key"
ON "StudentProfile"("studentCode");

-- Position the sequence after the existing students.
SELECT setval(
    '"student_code_seq"',
    GREATEST(
        1001,
        1000 + (
            SELECT COUNT(*)
            FROM "StudentProfile"
        )
    ),
    (
        SELECT COUNT(*) > 0
        FROM "StudentProfile"
    )
);