// Supabase setup
const SUPABASE_URL = 'https://dkcgowmksvqucxxlnmlr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrY2dvd21rc3ZxdWN4eGxubWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDkyMjMsImV4cCI6MjA2NDc4NTIyM30.dRQH8kQi5LFx5JD1AeUPOILBbVXmiWjX9zB2K4U92-Y';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const nameList = document.getElementById('name-list');

// Load names
async function loadNames() {
  const { data, error } = await supabase
    .from('names')
    .select('*')
    .order('id', { ascending: true });

  nameList.innerHTML = '';
  if (error) {
    console.error('Fetch error:', error.message);
    return;
  }

  data.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry.name;
    li.style.padding = '0.5rem';
    li.style.borderBottom = '1px solid #333';
    li.style.cursor = 'pointer';
    li.onclick = () => deleteName(entry.id);
    nameList.appendChild(li);
  });
}

// Add name
async function addName(name) {
  const { error } = await supabase.from('names').insert([{ name }]);
  if (error) {
    console.error('Insert error:', error.message);
    return;
  }
  nameInput.value = '';
  loadNames();
}

// Delete name
async function deleteName(id) {
  const { error } = await supabase.from('names').delete().eq('id', id);
  if (error) {
    console.error('Delete error:', error.message);
    return;
  }
  loadNames();
}

// Handle form submit
nameForm.onsubmit = (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (name) addName(name);
};

// Initial load
loadNames();
