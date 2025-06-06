// Supabase setup
const SUPABASE_URL = 'https://dkcgowmksvqucxxlnmlr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrY2dvd21rc3ZxdWN4eGxubWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDkyMjMsImV4cCI6MjA2NDc4NTIyM30.dRQH8kQi5LFx5JD1AeUPOILBbVXmiWjX9zB2K4U92-Y';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const nameList = document.getElementById('name-list');
const messageDiv = document.getElementById('message');

// Show status message
function showMessage(text, isError = false) {
  messageDiv.textContent = text;
  messageDiv.style.color = isError ? '#ff5555' : '#0f0';
  messageDiv.style.display = 'block';
  
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 3000);
}

// Load names
async function loadNames() {
  try {
    const { data, error } = await supabase
      .from('names')
      .select('*')
      .order('created_at', { ascending: true });

    nameList.innerHTML = '';
    
    if (error) {
      showMessage('Error loading names: ' + error.message, true);
      return;
    }

    if (data.length === 0) {
      nameList.innerHTML = '<li style="color:#aaa; text-align:center;">No players yet</li>';
      return;
    }

    data.forEach(entry => {
      const li = document.createElement('li');
      li.className = 'name-item';
      li.innerHTML = `
        ${entry.name}
        <button class="delete-btn" data-id="${entry.id}">×</button>
      `;
      nameList.appendChild(li);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteName(btn.dataset.id);
      });
    });
    
  } catch (error) {
    showMessage('Unexpected error: ' + error.message, true);
  }
}

// Add name
async function addName(name) {
  try {
    const { error } = await supabase
      .from('names')
      .insert([{ name }]);
    
    if (error) {
      showMessage('Error adding name: ' + error.message, true);
      return;
    }
    
    nameInput.value = '';
    showMessage('Name added successfully!');
    loadNames();
  } catch (error) {
    showMessage('Error adding name: ' + error.message, true);
  }
}

// Delete name
async function deleteName(id) {
  try {
    const { error } = await supabase
      .from('names')
      .delete()
      .eq('id', id);
    
    if (error) {
      showMessage('Error deleting name: ' + error.message, true);
      return;
    }
    
    showMessage('Name removed');
    loadNames();
  } catch (error) {
    showMessage('Error deleting name: ' + error.message, true);
  }
}

// Handle form submit
nameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  
  if (name) {
    addName(name);
  } else {
    showMessage('Please enter a name', true);
  }
});

// Initial load
document.addEventListener('DOMContentLoaded', loadNames);