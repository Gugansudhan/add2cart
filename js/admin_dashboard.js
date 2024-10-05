const apiKey = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; // Your Firebase API key
const projectId = "ecommerce-43f8f";
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products?key=${apiKey}`;
const baseStorageUrl = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o`;


// Populate Categories
async function populateCategories() {
    const categorySelect = document.getElementById('category');
    try {
        const categoryResponse = await fetch(`${baseFirestoreUrl}/Category?key=${apiKey}`);
        const categoryData = await categoryResponse.json();

        const categories = categoryData.documents || [];
        categories.forEach((doc) => {
            const categoryId = doc.fields.id.stringValue; // Accessing the 'id' field
            const categoryName = doc.fields.name.stringValue; // Accessing the 'name' field

            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categoryName;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching categories: ", error);
    }
}


// Fetch Inventory
async function fetchInventory() {
    const inventoryTable = document.querySelector("#inventoryTable tbody");
    inventoryTable.innerHTML = '';

    try {
        const response = await fetch(`${baseFirestoreUrl}?key=${apiKey}`);
        const data = await response.json();

        if (data.documents && data.documents.length > 0) {
            data.documents.forEach((doc) => {
                const product = doc.fields;
                const productId = doc.name.split('/').pop();
                const title = product.Title.stringValue;
                const category = product.CatID.integerValue;
                const price = product.Price.doubleValue;
                const quantity = product.Quantity.integerValue;
                const description = product.Description.stringValue;
                const imageUrl = product.ImageURL.stringValue;

                inventoryTable.innerHTML += `
                  <tr>
                    <td>${title}</td>
                    <td>${category}</td>
                    <td>${price}</td>
                    <td>${quantity}</td>
                    <td>${description}</td>
                    <td><img src="${imageUrl}" alt="${title}" style="width: 50px; height: 50px;"></td>
                    <td>
                      <button onclick="editProduct('${productId}')">Edit</button>
                      <button onclick="deleteProduct('${productId}')">Delete</button>
                    </td>
                  </tr>`;
            });
        }
    } catch (error) {
        console.error("Error fetching inventory:", error);
    }
}

// Add or Update Product
document.getElementById('inventoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    const title = document.getElementById('title').value;
    const categoryId = document.getElementById('category').value;
    const price = parseFloat(document.getElementById('price').value);
    const quantity = parseInt(document.getElementById('quantity').value);
    const description = document.getElementById('description').value;
    const imageFile = document.getElementById('imageFile').files[0];

    try {
        const storageResponse = await fetch(`${baseStorageUrl}?uploadType=media&name=${encodeURIComponent(imageFile.name)}&key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': imageFile.type
            },
            body: imageFile
        });

        if (!storageResponse.ok) {
            throw new Error("Failed to upload image");
        }

        const storageData = await storageResponse.json();
        const imageUrl = `${baseStorageUrl}/${encodeURIComponent(imageFile.name)}?alt=media&token=${storageData.downloadTokens}`;

        const productData = {
            fields: {
                Title: { stringValue: title },
                CatID: { integerValue: parseInt(categoryId, 10) },
                Price: { doubleValue: price },
                Quantity: { integerValue: quantity },
                Description: { stringValue: description },
                ImageURL: { stringValue: imageUrl }
            }
        };

        const method = productId ? 'PATCH' : 'POST';
        const url = productId ? `${baseFirestoreUrl}/${productId}?key=${apiKey}` : `${baseFirestoreUrl}?key=${apiKey}`;
        
        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        alert('Product saved successfully');
        document.getElementById('inventoryForm').reset();
        fetchInventory(); // Refresh the table
    } catch (error) {
        console.error("Error saving product:", error);
        alert("Error saving product");
    }
});

// Edit Product
async function editProduct(productId) {
    const response = await fetch(`${baseFirestoreUrl}/Inventory/${productId}?key=${apiKey}`);
    const data = await response.json();
    const product = data.fields;

    document.getElementById('productId').value = productId;
    document.getElementById('title').value = product.Title.stringValue;
    document.getElementById('category').value = product.CatID.integerValue;
    document.getElementById('price').value = product.Price.doubleValue;
    document.getElementById('quantity').value = product.Quantity.integerValue;
    document.getElementById('description').value = product.Description.stringValue;
}

// Delete Product
async function deleteProduct(productId) {
    const confirmDelete = confirm("Are you sure you want to delete this product?");
    if (confirmDelete) {
        try {
            await fetch(`${baseFirestoreUrl}/Inventory/${productId}?key=${apiKey}`, { method: 'DELETE' });
            alert("Product deleted");
            fetchInventory(); // Refresh the table
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    }
}

// Load categories and inventory when page loads
window.onload = function() {
    populateCategories();
    fetchInventory();
};
