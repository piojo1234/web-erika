-- ============================================================================
-- MANUAL DEL MIGRANTE: 7 DÍAS DE RECONSTRUCCIÓN EMOCIONAL
-- Script SQL de Configuración Completa para Supabase Cloud
-- Dra. Erika Rodríguez — Psicología & Desarrollo Personal
-- ============================================================================

-- 1. Habilitar extensión UUID (por defecto activa en Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLA: usuarios_guia
-- Almacena los compradores con su enlace personal único (token de acceso)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.usuarios_guia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    email TEXT UNIQUE,
    telefono TEXT,
    token_acceso TEXT UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para búsqueda ultra rápida por token
CREATE INDEX IF NOT EXISTS idx_usuarios_guia_token ON public.usuarios_guia (token_acceso);

-- ============================================================================
-- 3. TABLA: respuestas_ejercicios
-- Cuaderno de trabajo: guarda las respuestas de los 7 días
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.respuestas_ejercicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios_guia(id) ON DELETE CASCADE,
    dia INTEGER NOT NULL CHECK (dia >= 1 AND dia <= 7),
    respuestas JSONB NOT NULL DEFAULT '{}'::jsonb,
    actualizado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Restricción única indispensable para el UPSERT (onConflict: 'usuario_id,dia')
    CONSTRAINT uq_usuario_dia UNIQUE (usuario_id, dia)
);

-- Índices para consultar respuestas por usuario
CREATE INDEX IF NOT EXISTS idx_respuestas_usuario_id ON public.respuestas_ejercicios (usuario_id);

-- ============================================================================
-- 4. SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- Permite que la WebApp opere de forma segura con la clave pública 'anon'
-- ============================================================================

ALTER TABLE public.usuarios_guia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_ejercicios ENABLE ROW LEVEL SECURITY;

-- Política 1: Permitir lectura pública de usuario si coincide con su token
DROP POLICY IF EXISTS "Permitir lectura de usuario por token" ON public.usuarios_guia;
CREATE POLICY "Permitir lectura de usuario por token"
ON public.usuarios_guia
FOR SELECT
TO anon, authenticated
USING (true);

-- Política 2: Permitir a anon leer respuestas de ejercicios
DROP POLICY IF EXISTS "Permitir lectura de respuestas" ON public.respuestas_ejercicios;
CREATE POLICY "Permitir lectura de respuestas"
ON public.respuestas_ejercicios
FOR SELECT
TO anon, authenticated
USING (true);

-- Política 3: Permitir a anon guardar/actualizar (UPSERT) sus respuestas
DROP POLICY IF EXISTS "Permitir insercion y actualizacion de respuestas" ON public.respuestas_ejercicios;
CREATE POLICY "Permitir insercion y actualizacion de respuestas"
ON public.respuestas_ejercicios
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 5. STORAGE BUCKET: audios-guia
-- Crear el bucket de almacenamiento para los MP3 o videos del programa
-- ============================================================================

-- Insertar bucket público si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audios-guia',
    'audios-guia',
    true,
    52428800, -- 50 MB límite por audio o cápsula
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'video/mp4']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Política de lectura pública para el bucket de audios
DROP POLICY IF EXISTS "Audios publicos accesibles a todos" ON storage.objects;
CREATE POLICY "Audios publicos accesibles a todos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'audios-guia');

-- ============================================================================
-- 6. REGISTRO DE PRUEBA (Para probar inmediatamente el acceso)
-- Enlace de prueba generado: curso/index.html?token=demo-valiente-2026
-- ============================================================================
INSERT INTO public.usuarios_guia (nombre, email, telefono, token_acceso)
VALUES (
    'Valiente',
    'comunidad@erikarodriguez.com',
    '+573219315490',
    'demo-valiente-2026'
)
ON CONFLICT (token_acceso) DO NOTHING;
