const API_KEY = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; 
const PROJECT_ID = "ecommerce-43f8f";  
const COLLECTION_ID = "orders";

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('all-orders-btn').addEventListener('click', downloadAllOrders);
    document.getElementById('top-orders-btn').addEventListener('click', downloadTopOrders);
    document.getElementById('cash-orders-btn').addEventListener('click', downloadCashOrders);
    document.getElementById('credit-orders-btn').addEventListener('click', downloadCreditOrders);
});

async function fetchOrderData() {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_ID}?key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.documents || [];
}

function convertOrdersToCSV(orders) {
    const header = ["Order ID", "User ID", "Date", "Payment Method", "Item Name", "Price", "Quantity", "Total"];
    const rows = orders.map(order => {
        const orderFields = order.fields;
        return orderFields.items.arrayValue.values.map(item => {
            const itemFields = item.mapValue.fields;
            return [
                orderFields.orderId.stringValue,
                orderFields.userId.stringValue,
                orderFields.date.stringValue,
                orderFields.paymentMethod.stringValue,
                itemFields.name.stringValue,
                itemFields.price.doubleValue,
                itemFields.quantity.integerValue,
                (itemFields.price.doubleValue * itemFields.quantity.integerValue).toFixed(2)
            ].join(',');
        }).join('\n');
    });
    
    return [header.join(','), ...rows].join('\n');
}

function downloadCSV(content, fileName) {
    const blob = new Blob([content], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

// 1. Download all customer order history
async function downloadAllOrders() {
    const orders = await fetchOrderData();
    const csvContent = convertOrdersToCSV(orders);
    downloadCSV(csvContent, 'all_customer_orders.csv');
}

// 2. Download top 10 customer order history (by quantity)
async function downloadTopOrders() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    const orders = await fetchOrderData();
    const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.fields.date.stringValue);
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
    });

    const userPurchases = {};
    filteredOrders.forEach(order => {
        const userId = order.fields.userId.stringValue;
        const totalProducts = order.fields.items.arrayValue.values.reduce((sum, item) => {
            return sum + item.mapValue.fields.quantity.integerValue;
        }, 0);

        if (userPurchases[userId]) {
            userPurchases[userId] += totalProducts;
        } else {
            userPurchases[userId] = totalProducts;
        }
    });

    const userDetails = await fetchUserDetails(Object.keys(userPurchases));

    const topCustomers = Object.entries(userPurchases)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, totalProducts]) => {
            const user = userDetails[userId];
            return {
                userId,
                firstName: user ? user.fields.firstName.stringValue : "Unknown",
                email: user ? user.fields.email.stringValue : "Unknown",
                totalProducts
            };
        });

    const csvContent = convertTopCustomersToCSV(topCustomers);
    downloadCSV(csvContent, 'top_10_customer_orders.csv');
}

async function fetchUserDetails(userIds) {
    const usersUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?key=${API_KEY}`;

    try {
        const response = await fetch(usersUrl);
        const data = await response.json();
        const userDetails = {};

        if (data.documents) {
            data.documents.forEach(doc => {
                const userId = doc.name.split('/').pop();
                if (userIds.includes(userId)) {
                    userDetails[userId] = doc;
                }
            });
        }

        return userDetails;
    } catch (error) {
        console.error("Error fetching user details:", error);
        return {};
    }
}

function convertTopCustomersToCSV(customers) {
    const headers = ['User ID', 'First Name', 'Email', 'Total Products Purchased'];
    const rows = customers.map(customer => [
        customer.userId,
        customer.firstName,
        customer.email,
        customer.totalProducts
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
}



// 3. Download cash purchase reports (From date to date)
async function downloadCashOrders() {
    const startDate = document.getElementById('cash-start-date').value;
    const endDate = document.getElementById('cash-end-date').value;

    const orders = await fetchOrderData();
    const cashOrders = orders.filter(order => {
        const orderDate = new Date(order.fields.date.stringValue);
        return order.fields.paymentMethod.stringValue === 'cash-on-delivery' &&
               orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
    });

    const csvContent = convertOrdersToCSV(cashOrders);
    downloadCSV(csvContent, 'cash_purchase_reports.csv');
}

// 4. Download credit purchase reports (From date to date)
async function downloadCreditOrders() {
    const startDate = document.getElementById('credit-start-date').value;
    const endDate = document.getElementById('credit-end-date').value;

    const orders = await fetchOrderData();
    const creditOrders = orders.filter(order => {
        const orderDate = new Date(order.fields.date.stringValue);
        return order.fields.paymentMethod.stringValue === 'credit-card' &&
               orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
    });

    const csvContent = convertOrdersToCSV(creditOrders);
    downloadCSV(csvContent, 'credit_purchase_reports.csv');
}
