const textList = [" to HAZ game store ",];
const typingSpeed = 100; // typing speed in ms
const erasingSpeed = 50;
const delayBetween = 1500; // wait time before deleting

let index = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
  const target = document.getElementById("my-typer");
  if (!target) return;

  const currentText = textList[index];

  if (isDeleting) {
    target.textContent = currentText.substring(0, charIndex--);
  } else {
    target.textContent = currentText.substring(0, charIndex++);
  }

  if (!isDeleting && charIndex === currentText.length) {
    isDeleting = true;
    setTimeout(typeEffect, delayBetween);
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    index = (index + 1) % textList.length;
    setTimeout(typeEffect, 300);
  } else {
    setTimeout(typeEffect, isDeleting ? erasingSpeed : typingSpeed);
  }
}



// Email validation using a regular expression
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}


async function signupUser() {
 

  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Validate the fields (check if they are empty)
  if (username === '' || email === '' || password === '') {
    showAlert("All fields are required!");
      return;  // Stop further processing if validation fails
  }
  if (validateEmail(email)==false)
  {
    showAlert("Enter the Valid Email");
    return;
  }
  // Proceed with the further process (e.g., send data to the server)
  const response = await fetch('http://localhost:3000/signup', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();

  if (response.ok) {
    showAlert("Sign-up successful!");
      document.getElementById('username').value = '';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
      
  } else {
    showAlert(data.message || "Something went wrong!");
  }
}

async function loginUser() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Validate fields
  if (email === '' || password === '') {
    showAlert("Both Email and Password are required!");
      return;
  }

  if (!validateEmail(email)) {
    showAlert("Please enter a valid Email!");
      return;
  }

  // Send login request to backend
  try {
      const response = await fetch('http://localhost:3000/login', {
          method: 'POST',
        
          headers: {
              'Content-Type': 'application/json',
          },
        
          body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.success) {
        
        localStorage.setItem('token', data.token);
        console.log("JWT token stored in localStorage:", localStorage.getItem('token'));
          document.getElementById('email').value = '';
          document.getElementById('password').value = '';

         if(data.role==='Admin')
         {
          window.location.href = "AdminHome.html";
         }else
         {
          window.location.href = "DBProjectHtmlFile.html";
         }
          
      } else {
        showAlert('Ivalid Login ');
      }
  } catch (error) {
      console.error("Error during login:", error);
      showAlert("An error occurred. Please try again later.");
  }
}



// This function creates the alert box dynamically
function createAlertBox() {
  if (!document.getElementById('custom-alert')) {
    const alertBox = document.createElement('div');
    alertBox.id = 'custom-alert';
    alertBox.style.display = 'none';
    alertBox.style.position = 'fixed';
    alertBox.style.top = '20px';
    alertBox.style.left = '50%';
    alertBox.style.transform = 'translateX(-50%)';
    alertBox.style.padding = '15px 30px';
    alertBox.style.background = 'linear-gradient(45deg, #00c6ff, #0072ff)';
    alertBox.style.color = 'white';
    alertBox.style.borderRadius = '8px';
    alertBox.style.fontSize = '1.2rem';
    alertBox.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    alertBox.style.zIndex = '9999';
    alertBox.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(alertBox);
  }
}

// This function shows the alert
function showAlert(message, duration = 3000) {
  const alertBox = document.getElementById('custom-alert');
  alertBox.textContent = message;
  alertBox.style.display = 'block';
  alertBox.style.opacity = '1';

  setTimeout(() => {
    alertBox.style.opacity = '0';
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 300);
  }, duration);
}




  window.onload = function () {
    createAlertBox(); // Step that sets up the alert box
    typeEffect();
  };

// updateProduct.js

async function loadProducts() {
  try {
      const response = await fetch('http://localhost:3000/getproducts');
      const products = await response.json();
      console.log('Fetched products:', products);
      const select = document.getElementById('product-id');
      if (!Array.isArray(products) || products.length === 0) {
          const option = document.createElement('option');
          option.textContent = 'No products available';
          option.disabled = true;
          select.appendChild(option);
          return;
      }
      products.forEach(product => {
          const option = document.createElement('option');
          option.value = product.id;
          option.textContent = product.name;
          select.appendChild(option);
      });
  } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to load products.');
      const select = document.getElementById('product-id');
      const option = document.createElement('option');
      option.textContent = 'Error loading products';
      option.disabled = true;
      select.appendChild(option);
  }
}

// ################# UPDATE PRODUCT ####################

document.getElementById('update-product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const productId = document.getElementById('product-id').value;
  const formData = {
      price: parseFloat(document.getElementById('price').value),
      description: document.getElementById('description').value,
      image: document.getElementById('image').value,
      genre: document.getElementById('genre').value,
      quantity: parseInt(document.getElementById('quantity').value)
  };
  try {
      const response = await fetch(`http://localhost:3000/updateproducts/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
      });
      if (response.ok) {
          showAlert('Product updated successfully!');
      } else {
          const errorData = await response.json();
          showAlert(`Error: ${errorData.error}`);
      }
  } catch (error) {
    showAlert('Failed to connect to server.');
  }
});

window.addEventListener('load', loadProducts);





//#################### For Deleting Product ############################
async function deleteProduct(productName) {
 
  try {
      const response = await fetch(`http://localhost:3000/products/${encodeURIComponent(productName)}`, {
          method: 'DELETE'
      });
      if (response.ok) {
          showAlert('Product deleted successfully!');
          fetchAndRenderProducts(); // Refresh product list
      } else {
          const data = await response.json();
          showAlert(data.message || 'Failed to delete product.');
      }
  } catch (error) {
      console.error('Error deleting product:', error);
      alert('An error occurred while deleting the product.');
  }
}




function showDeleteModal(productName) {
  document.getElementById('deleteProductName').textContent = productName;
  const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
  modal.show();

  // Set up the confirm button to call deleteProduct
  const confirmButton = document.getElementById('confirmDeleteButton');
  confirmButton.onclick = () => {
      deleteProduct(productName);
      modal.hide();
  };
}







