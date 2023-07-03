/* eslint-disable no-undef */
const form = document.querySelector('form');

const API_BASE = 'http://localhost:8080';

const onLoginUser = async (payload) => {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (err) {
    return console.log(err);
  }
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    email: event.target.email.value,
    password: event.target.password.value,
  };

  const userData = await onLoginUser(payload);
  if (userData.token) {
    Cookies.set('token', userData.token, { expires: 0.1 });
    window.location.replace('./groups.html');
  }
});
