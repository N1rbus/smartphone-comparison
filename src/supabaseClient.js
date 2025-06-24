import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fkcopkuekbrnqctzzvgc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrY29wa3Vla2JybnFjdHp6dmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk2NzAsImV4cCI6MjA2NTk0NTY3MH0.f_wC9L79MQAj4LCxYXcm73MG_RUzkvwZWsq0pgM-1go'

export const supabase = createClient(supabaseUrl, supabaseKey) 