// 1️⃣ Replace with your real Supabase info:
const SUPABASE_URL = 'https://dkcgowmksvqucxxlnmlr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrY2dvd21rc3ZxdWN4eGxubWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDkyMjMsImV4cCI6MjA2NDc4NTIyM30.dRQH8kQi5LFx5JD1AeUPOILBbVXmiWjX9zB2K4U92-Y';

// 2️⃣ Create Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 3️⃣ Grab elements from the page
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const nameList = document.getElementById('name-list');

// 4️⃣ Show all names from Supabase
async function fetchNames() {
  const { data, error } = await supabase.from('names').select('*').order('id', { ascending: true });
  nameList.innerHTML = '';
  data.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry.name;
    li.onclick = () => removeName(entry.id);
    nameList.appendChild(li);
  });
}

// 5️⃣ Add a name
async function addName(name) {
  await supabase.from('names').insert([{ name }]);
  nameInput.value = '';
  fetchNames();
}

// 6️⃣ Remove a name
async function removeName(id) {
  await supabase.from('names').delete().eq('id', id);
  fetchNames();
}

// 7️⃣ When form is submitted
nameForm.onsubmit = (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (name) addName(name);
};

// 8️⃣ Load names at the start
fetchNames();
