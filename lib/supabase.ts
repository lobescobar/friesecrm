import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ljecftxeqabvjzaajbab.supabase.co'
const supabaseKey = 'sb_publishable_wgIoqkl0Y-nZGLe71nBJ4g_XBFLIqln'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)