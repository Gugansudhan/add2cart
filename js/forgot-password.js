const apiKey = 'AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w';

function forgotPassword() {
  const email = document.getElementById('email').value;

  fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requestType: "PASSWORD_RESET", email })
  })
  .then(response => response.json())
  .then(data => {
    if (data.email) {
      alert('Password reset email sent!');
    } else {
      alert('Failed to send reset email: ' + data.error.message);
    }
  })
  .catch(error => console.error('Error:', error));
}
