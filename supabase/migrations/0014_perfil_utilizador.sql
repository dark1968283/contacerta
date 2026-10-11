-- Fotografias de perfil do ContaCerta.
-- Bucket público para apresentar avatares; escrita limitada à pasta do próprio utilizador.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Avatar publico leitura" ON storage.objects;
CREATE POLICY "Avatar publico leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Utilizador carrega o proprio avatar" ON storage.objects;
CREATE POLICY "Utilizador carrega o proprio avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

DROP POLICY IF EXISTS "Utilizador actualiza o proprio avatar" ON storage.objects;
CREATE POLICY "Utilizador actualiza o proprio avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

DROP POLICY IF EXISTS "Utilizador apaga o proprio avatar" ON storage.objects;
CREATE POLICY "Utilizador apaga o proprio avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
