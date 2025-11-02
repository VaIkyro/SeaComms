import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://fwseqtjpuqtoztgwyhix.supabase.co", // correct project URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3c2VxdGpwdXF0b3p0Z3d5aGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTI2ODMsImV4cCI6MjA3NzU4ODY4M30.sRFCleRJvQqDjR0r-ToxJUy6BG-h4U4JM35fARq5-iA"                         // anon/public key
);
