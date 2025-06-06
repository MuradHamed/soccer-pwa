// 1️⃣ Supabase credentials — keep them safe in real apps!
const SUPABASE_URL = 'https://dkcgowmksvqucxxlnmlr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrY2dvd21rc3ZxdWN4eGxubWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDkyMjMsImV4cCI6MjA2NDc4NTIyM30.dRQH8kQi5LFx5JD1AeUPOILBbVXmiWjX9zB2K4U92-Y';

// 2️⃣ Create Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 3️⃣ DOM Elements
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const nameList = document.getElementById('name-list');

// 4️⃣ Fetch and display names
async function fetchNames() {
  const { data, error } = await supabase
    .from('names')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error fetching names:', error.message);
    return;
  }

  nameList.innerHTML = ''; // Clear existing list

  data.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry.name;
    li.onclick = () => removeName(entry.id);
    nameList.appendChild(li);
  });
}

// 5️⃣ Add name
async function addName(name) {
  const { error } = await supabase.from('names').insert([{ name }]);
  if (error) {
    console.error('❌ Error adding name:', error.message);
    return;
  }
  nameInput.value = '';
  fetchNames();
}

// 6️⃣ Remove name
async function removeName(id) {
  const { error } = await supabase.from('names').delete().eq('id', id);
  if (error) {
    console.error('❌ Error removing name:', error.message);
    return;
  }
  fetchNames();
}

// 7️⃣ Handle form submission
nameForm.onsubmit = (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (name) addName(name);
};

// 8️⃣ Initial fetch
fetchNames();
