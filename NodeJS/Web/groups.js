const API_BASE = 'http://localhost:8080';

const addGroupForm = document.getElementById('addGroupForm');

addGroupForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const groupIdInput = document.getElementById('groupId');
  const groupId = groupIdInput.value;

  try {
    const response = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
      body: JSON.stringify({ groupId }),
    });

    if (response.ok) {
      console.log('Group added successfully');
    } else {
      const errorData = await response.json();
      console.error(errorData.error);
    }
  } catch (error) {
    console.error(error);
  }
});
