-- ============================================
-- CrashTech — configuración inicial de Supabase
-- Corré todo este bloque de una vez en el SQL Editor de tu proyecto.
-- ============================================

-- ---------- Tabla: textos del sitio (reemplaza localStorage.crashtechContent) ----------
create table if not exists site_content (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

-- Cualquiera puede LEER los textos (los visitantes de tu sitio necesitan verlos)
create policy "Lectura pública de textos"
  on site_content for select
  using (true);

-- Solo un usuario logueado (vos) puede escribir/editar/borrar
create policy "Escritura solo autenticado"
  on site_content for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');


-- ---------- Tabla: proyectos del portafolio (reemplaza localStorage.crashtechProjects) ----------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  tags text[] not null default '{}',
  media_type text not null default 'none',   -- 'none' | 'image' | 'gif' | 'video'
  media_url text,                             -- URL pública (Storage o video externo)
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;

create policy "Lectura pública de proyectos"
  on projects for select
  using (true);

create policy "Escritura solo autenticado en proyectos"
  on projects for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');


-- ---------- Precarga los textos que ya tenías por defecto ----------
-- (esto solo mete valores iniciales; los podés editar después desde el dashboard)
insert into site_content (key, value) values
  ('hero.title', 'CrashTech'),
  ('hero.slogan', 'Diseño creativo. Código funcional. Responsabilidad.'),
  ('estado.disponibilidad', 'disponible'),
  ('footer.github', ''),
  ('footer.linkedin', ''),
  ('footer.copy', '© 2026 CrashTech'),
  ('footer.ubicacion', 'Hecho en La Paz, Bolivia'),
  ('portafolio.eyebrow', 'Portafolio'),
  ('portafolio.titulo', 'Proyectos seleccionados'),
  ('portafolio.descripcion', 'Algunos de los sistemas que diseñé y desarrollé de principio a fin, cada uno resolviendo una necesidad concreta de un cliente real.'),
  ('contacto.eyebrow', 'Contacto'),
  ('contacto.titulo', '¿Tienes un proyecto en mente?'),
  ('contacto.descripcion', 'Cuéntame qué necesitas y te respondo directamente — sin formularios eternos ni intermediarios.'),
  ('contacto.whatsapp.descripcion', 'Te abrimos WhatsApp con tu mensaje listo para enviar.'),
  ('contacto.correo.descripcion', 'Se abrirá tu cliente de correo con todo ya escrito.'),
  ('contacto.info.numero', ''),
  ('contacto.info.email', ''),
  ('privacidad.eyebrow', 'Privacidad & Términos'),
  ('privacidad.titulo', 'Cómo trabajo'),
  ('privacidad.item1.titulo', 'Todo por contrato'),
  ('privacidad.item1.descripcion', 'Cada proyecto se formaliza con un contrato claro antes de empezar: alcance, tiempos y entregables definidos desde el inicio.'),
  ('privacidad.item2.titulo', 'Ajustes menores, sin costo'),
  ('privacidad.item2.descripcion', 'Pequeños ajustes o correcciones sobre lo entregado están incluidos, sin cargos adicionales ni letra chica.'),
  ('privacidad.item3.titulo', 'Cambios mayores, aparte'),
  ('privacidad.item3.descripcion', 'Si se pide algo fuera del alcance original —nuevas funciones o un cambio de fondo— se cotiza como trabajo adicional, de forma transparente.')
on conflict (key) do nothing;
