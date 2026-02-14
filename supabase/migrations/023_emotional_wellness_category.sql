-- Migration: Rename Psychology category to Emotional Wellness
-- and add new services like Holistic Coaching

-- Update category name (keep slug for backward compatibility)
UPDATE categories
SET
    name = 'Emotional Wellness',
    name_es = 'Bienestar Emocional',
    icon = '💚'
WHERE slug = 'psychology';

-- Update existing service names
UPDATE services
SET
    name = 'Psychotherapy',
    name_es = 'Psicoterapia',
    description = 'One-on-one session with a licensed therapist for mental health support',
    description_es = 'Sesión individual con un terapeuta licenciado para apoyo de salud mental'
WHERE name = 'Individual Therapy';

UPDATE services
SET
    name = 'Couples Therapy',
    name_es = 'Terapia de Parejas',
    description = 'Therapy session for couples to improve communication and resolve conflicts',
    description_es = 'Sesión de terapia para parejas para mejorar la comunicación y resolver conflictos'
WHERE name = 'Couples Counseling';

-- Add new Holistic Coaching service
INSERT INTO services (category_id, name, name_es, description, description_es, default_duration_minutes, default_price_cents)
SELECT
    id,
    'Holistic Coaching',
    'Coaching Holístico',
    'Personal development coaching that addresses mind, body, and spirit for overall wellbeing',
    'Coaching de desarrollo personal que aborda mente, cuerpo y espíritu para el bienestar integral',
    60,
    100000
FROM categories
WHERE slug = 'psychology'
ON CONFLICT DO NOTHING;
