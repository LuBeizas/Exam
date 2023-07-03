/* eslint-disable no-undef */
const form = document.querySelector('form');

const API_BASE = 'http://localhost:8080';

const onRegisterUser = async (payload) => {
  try {
    const response = await fetch(`${API_BASE}/register`, {
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
    full_name: event.target.full_name.value,
    email: event.target.email.value,
    password: event.target.password.value,
  };

  const userData = await onRegisterUser(payload);
  if (userData.token) {
    // document.cookie = `token=${userData.token};`;
    Cookies.set('token', userData.token, { expires: 0.1 });
    window.location.replace('./login.html');
  }
});
