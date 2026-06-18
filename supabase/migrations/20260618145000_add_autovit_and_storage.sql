ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS autovit_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'car-images',
  'car-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Car images bucket public read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'car-images');

CREATE POLICY "Admins can upload car images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'car-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update car images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'car-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'car-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete car images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'car-images' AND public.has_role(auth.uid(), 'admin'));
