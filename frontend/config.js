// Arquivo de configuração do Supabase
// IMPORTANTE: Substitua os valores abaixo pelas credenciais do seu projeto Supabase

const SUPABASE_URL = 'https://adjrrafpanideyrmgphr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkanJyYWZwYW5pZGV5cm1ncGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTAyMDYsImV4cCI6MjA5MjM4NjIwNn0.A5jAPYCFhhHQ4aFNJriKw820_1JhftBATo2r5TdexTo';

// Inicializa o cliente do Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
