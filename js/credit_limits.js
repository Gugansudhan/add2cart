const apiKey = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; // Your Firebase API key
const projectId = "ecommerce-43f8f";
const baseUrlUsers = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`;

// Search User by Email
document.getElementById('searchUserForm').addEventListener('submit', function (e) {
    e.preventDefault();
    
    const searchEmail = document.getElementById('searchField').value;
    
    // Fetch user details by email
    fetchUserDetails(searchEmail).then(user => {
        if (user) {
            // Populate the form with the fetched user details
            document.getElementById('userName').value = user.fields.firstName.stringValue;
            document.getElementById('userEmail').value = user.fields.email.stringValue;
            document.getElementById('currentCreditLimit').value = user.fields.creditLimit.integerValue;

            // Show the edit credit limit form
            document.getElementById('editCreditLimit').style.display = 'block';
        } else {
            alert('User not found');
        }
    }).catch(error => {
        console.error('Error fetching user:', error);
        alert('Failed to fetch user details');
    });
});

// Update Credit Limit
document.getElementById('editCreditForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const newCreditLimit = document.getElementById('newCreditLimit').value;
    const userEmail = document.getElementById('userEmail').value;

    // Update the credit limit in Firestore
    updateCreditLimit(userEmail, newCreditLimit).then(response => {
        if (response) {
            alert('Credit limit updated successfully!');
        } else {
            alert('Failed to update credit limit.');
        }
    }).catch(error => {
        console.error('Error updating credit limit:', error);
        alert('Failed to update credit limit.');
    });
});

// Function to fetch user details by email
async function fetchUserDetails(email) {
    const queryUrl = `${baseUrlUsers}?pageSize=1000`;  // Fetch all users (adjust pageSize if needed)

    const response = await fetch(queryUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'  // Specify content type
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user details');
    }

    const data = await response.json();

    // Find user by email in the results
    const user = data.documents.find(doc => doc.fields.email.stringValue === email);

    return user ? user : null;
}


// Function to update the credit limit in Firestore
async function updateCreditLimit(email, newCreditLimit) {
    // First, fetch the user by email
    const user = await fetchUserDetails(email);

    if (!user) {
        throw new Error('User not found');
    }

    // Get the document ID of the user from Firestore
    const documentId = user.name.split('/').pop();  // Extract document ID from the full path

    const updateUrl = `${baseUrlUsers}/${documentId}?updateMask.fieldPaths=creditLimit`;

    const updateBody = {
        fields: {
            creditLimit: {
                integerValue: parseInt(newCreditLimit) // Ensure value is an integer
            }
        }
    };

    const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateBody)
    });

    if (!response.ok) {
        throw new Error('Failed to update credit limit');
    }

    const updatedUser = await response.json();
    return updatedUser;
}
