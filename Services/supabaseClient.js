

import { createClient } from '@supabase/supabase-js';

// Configura tu URL y la clave pública
const supabaseUrl = 'https://ejrdzyraejupzdalbyeb.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcmR6eXJhZWp1cHpkYWxieWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5Njg2NzcsImV4cCI6MjA2MjU0NDY3N30.dXH_0dwJh5cnwl5z0_pNY8ZYilos3gUENO9GiiDjAlw';  // Sustituye por tu clave anon

// Crea el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
