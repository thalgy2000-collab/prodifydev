import { supabase } from '@/integrations/supabase/client';

export async function uploadProductLogo(file: File, userId: string, productId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${productId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from('product-logos')
    .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('product-logos').getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteProductLogo(logoUrl: string): Promise<void> {
  const marker = '/product-logos/';
  const idx = logoUrl.indexOf(marker);
  if (idx === -1) return;
  const path = logoUrl.substring(idx + marker.length);
  await supabase.storage.from('product-logos').remove([path]);
}
