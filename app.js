// Replace with your own Supabase info
const supabase = supabase.createClient('https://YOUR_PROJECT.supabase.co', 'YOUR_ANON_KEY');

const nameForm = document.getElementById('nameForm');
const nameInput = document.getElementById('nameInput');
const nameList = document.getElementById('nameList');

async function fetchNames() {
  const { data, error } = await supabase.from('names').select('*').order('id', { ascending: false });
  nameList.innerHTML = '';
  if (data) {
    data.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.name;
      nameList.appendChild(li);
    });
  }
}

nameForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (name) {
    await supabase.from('names').insert([{ name }]);
    nameInput.value = '';
    fetchNames();
  }
});

fetchNames();

// Optional: Real-time updates
supabase
  .channel('public:names')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'names' }, fetchNames)
  .subscribe();
