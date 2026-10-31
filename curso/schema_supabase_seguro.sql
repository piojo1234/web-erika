-- ============================================================================
-- MANUAL DEL MIGRANTE: 7 DÍAS DE RECONSTRUCCIÓN EMOCIONAL
-- Versión Segura mediante Funciones RPC (Row Level Security Estricta)
-- ============================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: usuarios_guia
CREATE TABLE IF NOT EXISTS public.usuarios_guia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    email TEXT UNIQUE,
    telefono TEXT,
    token_acceso TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    regalo_de TEXT,                    -- Nombre de quien compró el regalo (ej: 'Carlos')
    mensaje_regalo TEXT,               -- Dedicatoria con cariño (ej: 'Hermanita, creo en ti...')
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usuarios_guia_token ON public.usuarios_guia (token_acceso);

-- 3. TABLA: respuestas_ejercicios
CREATE TABLE IF NOT EXISTS public.respuestas_ejercicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios_guia(id) ON DELETE CASCADE,
    dia INTEGER NOT NULL CHECK (dia >= 1 AND dia <= 7),
    respuestas JSONB NOT NULL DEFAULT '{}'::jsonb,
    actualizado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_usuario_dia UNIQUE (usuario_id, dia)
);

CREATE INDEX IF NOT EXISTS idx_respuestas_usuario_id ON public.respuestas_ejercicios (usuario_id);

-- 4. RLS ESTRICTA (Sin acceso directo para anon)
ALTER TABLE public.usuarios_guia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_ejercicios ENABLE ROW LEVEL SECURITY;

-- 5. FUNCIONES RPC DE ACCESO SEGURO (Security Definer)

-- Función 1: Obtener usuario por token para validar acceso, saludo y dedicatoria
CREATE OR REPLACE FUNCTION public.guia_obtener_usuario(p_token TEXT)
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    email TEXT,
    telefono TEXT,
    token_acceso TEXT,
    regalo_de TEXT,
    mensaje_regalo TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.nombre, u.email, u.telefono, u.token_acceso, u.regalo_de, u.mensaje_regalo
    FROM public.usuarios_guia u
    WHERE u.token_acceso = p_token AND u.activo = true;
END;
$$;

-- Función 2: Obtener historial de respuestas de los 7 días
CREATE OR REPLACE FUNCTION public.guia_obtener_respuestas(p_token TEXT)
RETURNS TABLE (
    dia INTEGER,
    respuestas JSONB,
    actualizado_en TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT r.dia, r.respuestas, r.actualizado_en
    FROM public.respuestas_ejercicios r
    INNER JOIN public.usuarios_guia u ON u.id = r.usuario_id
    WHERE u.token_acceso = p_token AND u.activo = true
    ORDER BY r.dia ASC;
END;
$$;

-- Función 3: Guardar o actualizar (upsert) la reflexión del día
CREATE OR REPLACE FUNCTION public.guia_guardar_respuesta(
    p_token TEXT,
    p_dia INTEGER,
    p_respuestas JSONB
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Validar token del usuario
    SELECT u.id INTO v_user_id
    FROM public.usuarios_guia u
    WHERE u.token_acceso = p_token AND u.activo = true;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Acceso no autorizado o token no válido';
    END IF;

    -- Upsert de la respuesta para el día indicado
    INSERT INTO public.respuestas_ejercicios (usuario_id, dia, respuestas, actualizado_en)
    VALUES (v_user_id, p_dia, p_respuestas, NOW())
    ON CONFLICT (usuario_id, dia)
    DO UPDATE SET
        respuestas = EXCLUDED.respuestas,
        actualizado_en = NOW();

    RETURN jsonb_build_object('success', true, 'dia', p_dia);
END;
$$;

-- Función 4: Actualizar nombre personalizado de la participante
CREATE OR REPLACE FUNCTION public.guia_actualizar_nombre(
    p_token TEXT,
    p_nuevo_nombre TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.usuarios_guia
    SET nombre = p_nuevo_nombre
    WHERE token_acceso = p_token AND activo = true;

    RETURN jsonb_build_object('success', true, 'nuevo_nombre', p_nuevo_nombre);
END;
$$;

-- Otorgar permisos de ejecución a la clave anon y authenticated
GRANT EXECUTE ON FUNCTION public.guia_obtener_usuario(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guia_obtener_respuestas(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guia_guardar_respuesta(TEXT, INTEGER, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guia_actualizar_nombre(TEXT, TEXT) TO anon, authenticated;

-- 6. BUCKET DE ALMACENAMIENTO (audios-guia)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audios-guia',
    'audios-guia',
    true,
    52428800,
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'video/mp4']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Audios publicos accesibles" ON storage.objects;
CREATE POLICY "Audios publicos accesibles"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'audios-guia');

-- 7. REGISTRO DEMO
INSERT INTO public.usuarios_guia (nombre, email, telefono, token_acceso)
VALUES ('Valiente', 'comunidad@erikarodriguez.com', '+573219315490', 'demo-valiente-2026')
ON CONFLICT (token_acceso) DO NOTHING;
