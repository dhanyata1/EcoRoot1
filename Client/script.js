// Function to update the UI after login
function updateUIAfterLogin(user) {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('signupBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'inline-block';

    // Show user profile section
    document.getElementById('userProfile').style.display = 'inline-block';
    document.getElementById('username').textContent = user.full_name; // Display the user's name
    document.getElementById('profilePicture').src = user.profilePicture || 'default-profile.png'; // Display the user's profile picture or a default
}

// Function to update the UI after logout
function updateUIAfterLogout() {
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('signupBtn').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'none';

    // Hide user profile section
    document.getElementById('userProfile').style.display = 'none';
}

// Check login status on page load
window.addEventListener('load', () => {
    const token = localStorage.getItem('token'); // Check for token
    const user = JSON.parse(localStorage.getItem('user')); // Get user details from localStorage

    if (token && user) {
        updateUIAfterLogin(user); // If token and user exist, show the user profile
    } else {
        updateUIAfterLogout(); // If no token, show login/signup
    }
});

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value; // Update ID to match your HTML
    const password = document.getElementById('loginPassword').value; // Update ID to match your HTML

    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Save the token and user details in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            updateUIAfterLogin(data.user); // Update UI to show the user profile
            alert('Login successful!');
        } else {
            alert(data.error || 'Login failed.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Login failed.');
    }
});

// Signup form submission
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const full_name = document.getElementById('signupName').value; // Update ID to match your HTML
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value; // Confirm password field

    // Check if passwords match
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ full_name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Signup successful! Please login.');
            document.getElementById('signupForm').reset(); // Reset form after successful signup
        } else {
            alert(data.error || 'Signup failed.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Signup failed.');
    }
});

// Logout function
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token'); // Remove token from localStorage
    localStorage.removeItem('user'); // Remove user details from localStorage
    updateUIAfterLogout(); // Update UI to show login/signup
    alert('Logged out successfully!');
});



document.getElementById('uploadForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the form from submitting the default way

    const formData = new FormData(this); // Get form data

    fetch('http://127.0.0.1:8080/upload-product', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});
