// ✅ Replace with your actual Supabase project URL and anon key
const SUPABASE_URL = 'https://dkcgowmksvqucxxlnmlr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elements
const form = document.getElementById('name-form');
const input = document.getElementById('name-input');
const list = document.getElementById('name-list');

// Fetch and show names
async function loadNames() {
  const { data, error } = await client.from('names').select('*').order('id');
  if (error) {
    console.error('Fetch error:', error.message);
    return;
  }
  list.innerHTML = '';
  data.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    li.onclick = () => deleteName(item.id);
    list.appendChild(li);
  });
}

// Add name
async function addName(name) {
  const { error } = await client.from('names').insert([{ name }]);
  if (error) {
    console.error('Insert error:', error.message);
    return;
  }
  input.value = '';
  loadNames();
}

// Delete name
async function deleteName(id) {
  const { error } = await client.from('names').delete().eq('id', id);
  if (error) {
    console.error('Delete error:', error.message);
    return;
  }
  loadNames();
}

// Form submit
form.onsubmit = (e) => {
  e.preventDefault();
  const name = input.value.trim();
  if (name) addName(name);
};

// Load names on page load
loadNames();
