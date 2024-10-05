const cartItemsBody = document.getElementById('cart-items-body');
const totalPriceElement = document.getElementById('total-price');
const checkoutButton = document.getElementById('checkout-button');
const clearCartButton = document.getElementById('clear-cart-button');

const API_KEY = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; 
const PROJECT_ID = "ecommerce-43f8f";  
const COLLECTION_ID = "carts"; 

let totalAmount = 0;

async function fetchCartItems() {
  const userId = localStorage.getItem('loggedInUserId');
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_ID}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.documents) {
      const cartData = data.documents
        .filter(doc => doc.name.includes(userId))
        .map(doc => ({
          id: doc.name.split('/').pop(),
          name: doc.fields.name.stringValue,
          price: parseFloat(doc.fields.price.doubleValue),
          quantity: parseInt(doc.fields.quantity.integerValue)
        }));

      if (cartData.length > 0) {
        displayCartItems(cartData);
      } else {
        cartItemsBody.innerHTML = '<tr><td colspan="4">Your cart is empty.</td></tr>';
      }
    } else {
      cartItemsBody.innerHTML = '<tr><td colspan="4">Your cart is empty.</td></tr>';
    }
  } catch (error) {
    console.error('Error fetching cart items:', error);
  }
}

function displayCartItems(items) {
  cartItemsBody.innerHTML = '';  
  totalAmount = 0;

  items.forEach((item) => {
    const cartRow = document.createElement('tr');
    cartRow.innerHTML = `
      <td>${item.name}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td class="quantity-buttons">
        <button class="decrease" data-id="${item.id}">-</button>
        <span class="quantity">${item.quantity}</span>
        <button class="increase" data-id="${item.id}">+</button>
      </td>
      <td>$<span class="subtotal">${(item.price * item.quantity).toFixed(2)}</span></td>
    `;
    cartItemsBody.appendChild(cartRow);
    totalAmount += item.price * item.quantity;
  });

  totalPriceElement.textContent = totalAmount.toFixed(2);
  setupCartItemListeners();
}

function setupCartItemListeners() {
  const increaseButtons = document.querySelectorAll('.increase');
  const decreaseButtons = document.querySelectorAll('.decrease');

  increaseButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      const productId = event.target.getAttribute('data-id');
      updateQuantity(productId, 'increase');
    });
  });

  decreaseButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      const productId = event.target.getAttribute('data-id');
      updateQuantity(productId, 'decrease');
    });
  });
}

async function updateQuantity(productId, action) {
  const userId = localStorage.getItem('loggedInUserId');
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_ID}/${productId}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.fields) {
      const productData = {
        name: data.fields.name.stringValue,
        price: parseFloat(data.fields.price.doubleValue),
        currentQuantity: parseInt(data.fields.quantity.integerValue),
        description: data.fields.description.stringValue,
        imageUrl: data.fields.imageUrl.stringValue,
        productId: data.fields.productId.integerValue,
        userId: data.fields.userId.stringValue
      };

      if (action === 'increase') {
        productData.currentQuantity += 1;
      } else if (action === 'decrease') {
        productData.currentQuantity -= 1;
      }

      if (productData.currentQuantity === 0) {
        await removeItemFromCart(productId);
      } else {
        const updatedData = {
          fields: {
            name: { stringValue: productData.name },
            price: { doubleValue: productData.price },
            quantity: { integerValue: productData.currentQuantity },
            description: { stringValue: productData.description },
            imageUrl: { stringValue: productData.imageUrl },
            productId: { integerValue: productData.productId },
            userId: { stringValue: productData.userId }
          }
        };

        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
      }
    }

    fetchCartItems();
  } catch (error) {
    console.error('Error updating quantity:', error);
  }
}

async function removeItemFromCart(productId) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_ID}/${productId}?key=${API_KEY}`;

  try {
    await fetch(url, {
      method: 'DELETE'
    });

    fetchCartItems();
  } catch (error) {
    console.error('Error removing item from cart:', error);
  }
}

clearCartButton.addEventListener('click', async () => {
  const userId = localStorage.getItem('loggedInUserId');
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_ID}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.documents) {
      const userCartItems = data.documents.filter(doc => doc.name.includes(userId));

      for (let cartItem of userCartItems) {
        const productId = cartItem.name.split('/').pop();
        await removeItemFromCart(productId);
      }

      totalAmount = 0;
      totalPriceElement.textContent = totalAmount.toFixed(2);
    }
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
});

function goBack() {
  window.location.href = 'home.html';
}

// Proceed to checkout
checkoutButton.addEventListener('click', () => {
window.location.href = 'Productcheckout.html'; // Redirect to checkout page
});


window.onload = fetchCartItems;
