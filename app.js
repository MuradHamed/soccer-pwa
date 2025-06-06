// ✅ Replace with your actual Supabase credentials
const SUPABASE_URL = 'https://dkcgowmksvqucxxlnmlr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrY2dvd21rc3ZxdWN4eGxubWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDkyMjMsImV4cCI6MjA2NDc4NTIyM30.dRQH8kQi5LFx5JD1AeUPOILBbVXmiWjX9zB2K4U92-Y';
// ✅ Create Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ Grab elements
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const nameList = document.getElementById('name-list');

// ✅ Fetch and display all names
async function fetchNames() {
  const { data, error } = await supabase
    .from('names')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching names:', error);
    return;
  }

  nameList.innerHTML = '';

  data.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry.name;
    li.style.padding = '0.5rem';
    li.style.borderBottom = '1px solid #333';
    li.style.cursor = 'pointer';
    li.onclick = () => removeName(entry.id);
    nameList.appendChild(li);
  });
}

// ✅ Add a new name
async function addName(name) {
  const { error } = await supabase.from('names').insert([{ name }]);
  if (error) {
    console.error('Error adding name:', error);
    return;
  }
  nameInput.value = '';
  fetchNames();
}

// ✅ Remove a name by ID
async function removeName(id) {
  const { error } = await supabase.from('names').delete().eq('id', id);
  if (error) {
    console.error('Error deleting name:', error);
    return;
  }
  fetchNames();
}

// ✅ Handle form submission
nameForm.onsubmit = (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (name) addName(name);
};

// ✅ Initial load
fetchNames();
