-- ============================================
-- CrashTech — permisos del bucket "project-media"
-- ============================================

-- Cualquiera puede LEER (ver) las imágenes — necesario para que se
-- muestren en tu sitio público sin pedir login.
create policy "Lectura pública de project-media"
  on storage.objects for select
  using (bucket_id = 'project-media');

-- Solo un usuario logueado (vos) puede SUBIR archivos nuevos.
create policy "Subida solo autenticado en project-media"
  on storage.objects for insert
  with check (bucket_id = 'project-media' and auth.role() = 'authenticated');

-- Solo un usuario logueado puede REEMPLAZAR un archivo existente.
create policy "Actualización solo autenticado en project-media"
  on storage.objects for update
  using (bucket_id = 'project-media' and auth.role() = 'authenticated');

-- Solo un usuario logueado puede BORRAR archivos.
create policy "Borrado solo autenticado en project-media"
  on storage.objects for delete
  using (bucket_id = 'project-media' and auth.role() = 'authenticated');
