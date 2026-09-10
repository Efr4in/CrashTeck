// ============================================
// CLIENTE DE SUPABASE — compartido por todo el sitio
// ============================================
// Reemplaza el localStorage que usábamos antes: ahora los textos, los
// proyectos y el login viven en una base de datos real (Supabase), así
// que cualquier visitante ve lo mismo, desde cualquier dispositivo.

const SUPABASE_URL = 'https://yudujgewcowblrmkckji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZHVqZ2V3Y293YmxybWtja2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NzQyMTYsImV4cCI6MjEwNDA1MDIxNn0.onFjQ9M9cIXrWkuyfMXKW5u7KIpkw-g6ZCjdUB0LCZE';

// El script de Supabase (cargado por CDN en el <head>) expone `window.supabase`
// con el método createClient. Lo renombramos a `sb` para no pisarnos con
// el nombre del propio paquete.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- Textos del sitio (tabla site_content) ----------
async function sbGetContent() {
  const { data, error } = await sb.from('site_content').select('key, value');
  if (error) {
    console.error('Error leyendo site_content:', error);
    return {};
  }
  const map = {};
  data.forEach((row) => { map[row.key] = row.value; });
  return map;
}

// updates = { 'hero.title': 'CrashTech', 'hero.slogan': '...', ... }
async function sbSaveContent(updates) {
  const rows = Object.entries(updates).map(([key, value]) => ({ key, value }));
  const { error } = await sb.from('site_content').upsert(rows, { onConflict: 'key' });
  if (error) console.error('Error guardando site_content:', error);
  return !error;
}

// ---------- Proyectos del portafolio (tabla projects) ----------
async function sbGetProjects() {
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error leyendo projects:', error);
    return [];
  }
  return data;
}

// project = { id? , title, description, tags: [], media_type, media_url }
async function sbSaveProject(project) {
  const payload = {
    title: project.title,
    description: project.description,
    tags: project.tags,
    media_type: project.media_type,
    media_url: project.media_url,
    media_urls: project.media_urls || [],
    github_url: project.github_url || null,
    role: project.role || null
  };
  if (project.id) {
    const { error } = await sb.from('projects').update(payload).eq('id', project.id);
    return !error;
  }
  const { error } = await sb.from('projects').insert(payload);
  return !error;
}

async function sbDeleteProject(id) {
  const { error } = await sb.from('projects').delete().eq('id', id);
  return !error;
}

// ---------- Storage (bucket project-media, para imágenes/GIFs) ----------
async function sbUploadMedia(file) {
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await sb.storage.from('project-media').upload(path, file);
  if (error) {
    console.error('Error subiendo archivo:', error);
    return null;
  }
  const { data } = sb.storage.from('project-media').getPublicUrl(path);
  return data.publicUrl;
}

// ---------- Google Drive: convierte un link normal de "Compartir" en uno
// que se puede insertar/reproducir embebido (no todos los links de Drive
// sirven directo para eso). Si no reconoce el link, devuelve null y se
// usa tal cual como venía. ----------
function sbDriveEmbedUrl(url) {
  if (!url) return null;
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);        // .../file/d/ID/view
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);       // ...open?id=ID
  const id = (m1 && m1[1]) || (m2 && m2[1]);
  if (!id) return null;
  return `https://drive.google.com/file/d/${id}/preview`;
}

// ---------- Autenticación ----------
async function sbSignIn(email, password) {
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return { ok: !error, error };
}

async function sbSignOut() {
  await sb.auth.signOut();
}

async function sbGetSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}
