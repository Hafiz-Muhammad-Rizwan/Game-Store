require('dotenv').config();
const express = require("express"); // use express
const mysql = require("mysql2");
const cors = require("cors"); // use mysql
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:8080", "http://127.0.0.1:5500"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
  })
);

const otpStore = {};
const users = {};

app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync("ca.pem"),
  },
});

// Step: Connect to database
db.connect((err) => {
  if (err) {
    console.log("Error connecting to database:", err);
  } else {
    console.log("Connected to MySQL database!");
  }
});

const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: "hafizmuhammadrizwan359@gmail.com", 
    pass: process.env.Mail_Password, 
  },
});

// ################### Log in ############
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }

  const query =
    "SELECT User_Id, User_Name, User_Role FROM USERS WHERE User_Email = ? AND User_Password = ?";
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }
    if (results.length > 0) {
      const user = results[0];
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.User_Id, email: user.User_Email, role: user.User_Role },
        "your_jwt_secret", 
        { expiresIn: "1h" }
      );
      res.json({
        success: true,
        message: "Login successful",
        username: user.User_Name,
        role: user.User_Role,
        token: token,
      });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  });
});

app.post("/signup", (req, res) => {
  const { username, email, password } = req.body;

 
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  // Insert new user into database
  const query =
    "INSERT INTO USERS ( User_Name,User_Email,User_Password) VALUES (?, ?, ?)";
  db.query(query, [username, email, password], (err, result) => {
    if (err) {
      res
        .status(500)
        .json({
          success: false,
          message: "Error while signing up",
          error: err,
        });
    } else {
      res.status(201).json({ success: true, message: "Sign up successful" });
    }
  });
});

app.get("/products", (req, res) => {
  db.query("SELECT * FROM Products", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

//Admin page Add product
app.post("/addproducts", (req, res) => {
  const { id, name, price, description, image, genre, quantity } = req.body;

  if (!id || !name || !price || !description || !image || !genre || !quantity) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Validate quantity is a non-negative number
  if (isNaN(quantity) || quantity < 0) {
    return res
      .status(400)
      .json({ error: "Quantity must be a non-negative number" });
  }

  // Start a transaction to ensure both tables are updated
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err.message);
      return res.status(500).json({ error: "Failed to add product" });
    }

    // Insert into Products table (no quantity field)
    const productQuery =
      "INSERT INTO Products (Product_Name, Price, Product_description, Image_Path, Genre) VALUES (?, ?, ?, ?, ?)";
    db.query(
      productQuery,
      [name, price, description, image, genre],
      (err, result) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error inserting product:", err.message);
            res.status(500).json({ error: "Failed to add product" });
          });
        }

        // Get the inserted product ID
        const productId = result.insertId;

        // Insert into Inventory table
        const inventoryQuery =
          "INSERT INTO Inventory (Product_Id, Quantity) VALUES (?, ?)";
        db.query(inventoryQuery, [productId, quantity], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error inserting inventory:", err.message);
              res.status(500).json({ error: "Failed to add product" });
            });
          }

          // Commit the transaction
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Error committing transaction:", err.message);
                res.status(500).json({ error: "Failed to add product" });
              });
            }
            res.status(201).json({ message: "Product added successfully" });
          });
        });
      }
    );
  });
});

app.get("/getproducts", (req, res) => {
  const query = "SELECT ID AS id, Product_Name AS name FROM Products";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching products:", err.message);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
    res.status(200).json(results);
  });
});

// ############ API UPDATE PRODUCT ########################
app.put("/updateproducts/:id", (req, res) => {
  const { price, description, image, genre, quantity } = req.body;
  const { id } = req.params;

  if (!price || !description || !image || !genre || quantity === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (isNaN(quantity) || quantity < 0) {
    return res
      .status(400)
      .json({ error: "Quantity must be a non-negative number" });
  }

  // Start a transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err.message);
      return res.status(500).json({ error: "Failed to update product" });
    }

    // Update Products table
    const productQuery =
      "UPDATE Products SET Price = ?, Product_description = ?, Image_Path = ?, Genre = ? WHERE ID = ?";
    db.query(
      productQuery,
      [price, description, image, genre, id],
      (err, productResult) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error updating product:", err.message);
            res.status(500).json({ error: "Failed to update product" });
          });
        }

        if (productResult.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ error: "Product not found" });
          });
        }

       
        const inventoryQuery = `
              INSERT INTO Inventory (Product_Id, Quantity) VALUES (?, ?)
              ON DUPLICATE KEY UPDATE Quantity = ?, Last_Updated = CURRENT_TIMESTAMP
          `;
        db.query(inventoryQuery, [id, quantity, quantity], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error updating inventory:", err.message);
              res.status(500).json({ error: "Failed to update product" });
            });
          }

          // Commit transaction
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Error committing transaction:", err.message);
                res.status(500).json({ error: "Failed to update product" });
              });
            }
            res.status(200).json({ message: "Product updated successfully" });
          });
        });
      }
    );
  });
});

app.delete("/products/:name", (req, res) => {
  const productName = decodeURIComponent(req.params.name);

  // Start a transaction to ensure both tables are updated
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err.message);
      return res.status(500).json({ message: "Server error" });
    }

    // Find the product ID by product name
    const findProductQuery = "SELECT ID FROM Products WHERE Product_Name = ?";
    db.query(findProductQuery, [productName], (err, results) => {
      if (err) {
        return db.rollback(() => {
          console.error("Error finding product:", err.message);
          res.status(500).json({ message: "Server error" });
        });
      }

      if (results.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ message: "Product not found" });
        });
      }

      const productId = results[0].ID;

      
      const deleteInventoryQuery = "DELETE FROM Inventory WHERE Product_Id = ?";
      db.query(deleteInventoryQuery, [productId], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error deleting inventory:", err.message);
            res.status(500).json({ message: "Server error" });
          });
        }

        // Delete from Products table
        const deleteProductQuery =
          "DELETE FROM Products WHERE Product_Name = ?";
        db.query(deleteProductQuery, [productName], (err, result) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error deleting product:", err.message);
              res.status(500).json({ message: "Server error" });
            });
          }

          if (result.affectedRows === 0) {
            return db.rollback(() => {
              res.status(404).json({ message: "Product not found" });
            });
          }

          // Commit the transaction
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Error committing transaction:", err.message);
                res.status(500).json({ message: "Server error" });
              });
            }
            res.status(200).json({ message: "Product deleted successfully" });
          });
        });
      });
    });
  });
});

app.get("/users", (req, res) => {
  const query =
    "SELECT User_Name, User_Email, User_Password, User_Role FROM USERS";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err.message);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.status(200).json(results);
  });
});

//################  Delete user ######################
app.delete("/users/:email", (req, res) => {
  const userEmail = req.params.email;
  const query = "DELETE FROM USERS WHERE User_Email = ?";
  db.query(query, [userEmail], (err, result) => {
    if (err) {
      console.error("Error deleting user:", err.message);
      return res.status(500).json({ message: "Server error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  });
});

// ################ UPDATE USER #############################
app.put("/users/:email", (req, res) => {
  const userEmail = req.params.email;
  const { User_Name, User_Password, User_Role } = req.body;
  if (!User_Name || !User_Role) {
    return res.status(400).json({ error: "Name and role are required" });
  }
  const query =
    "UPDATE USERS SET User_Name = ?, User_Password = COALESCE(?, User_Password), User_Role = ? WHERE User_Email = ?";
  db.query(
    query,
    [User_Name, User_Password, User_Role, userEmail],
    (err, result) => {
      if (err) {
        console.error("Error updating user:", err.message);
        return res.status(500).json({ error: "Failed to update user" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(200).json({ message: "User updated successfully" });
    }
  );
});

// ####################  SEND OTP ########################

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  db.query(
    "SELECT * FROM USERS WHERE User_Email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Email not found in database" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
      otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

      const mailOptions = {
        from: "hafizmuhammadrizwan359@gmail.com",
        to: email,
        subject: "Your OTP Code",
        html: `
          <h2>Your OTP Code</h2>
          <p>Your One-Time Password (OTP) is <strong>${otp}</strong>.</p>
          <p>This code is valid for 5 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP for ${email}: ${otp}`);
        res.json({ success: true, message: "OTP sent to your email" });
      } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
      }
    }
  );
});

// ####################  OTP  Verification ########################

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP are required" });
  }

  const stored = otpStore[email];
  if (!stored) {
    return res
      .status(400)
      .json({ success: false, message: "No OTP found for this email" });
  }

  if (stored.expires < Date.now()) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: "OTP has expired" });
  }

  if (stored.otp !== parseInt(otp)) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }
  otpStore[email] = { verified: true };
  res.json({ success: true, message: "OTP verified successfully" });
});

// ################# RESET Passwork ########################
app.post("/reset-password", (req, res) => {
  const { email, password, confirmPassword } = req.body;
  if (!email || !password || !confirmPassword) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Email, password, and confirm password are required",
      });
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Passwords do not match" });
  }

  const stored = otpStore[email];
  if (!stored || !stored.verified) {
    return res
      .status(400)
      .json({ success: false, message: "Email not verified or OTP not found" });
  }

  db.query(
    "UPDATE USERS SET User_Password = ? WHERE User_Email = ?",
    [password, email],
    (err, result) => {
      if (err) {
        console.error("Error updating password:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
    }
  );

  delete otpStore[email]; // Clear OTP data after password reset

  res.json({ success: true, message: "Password reset successfully" });
});

// ######################  Purchase History #########################
app.post("/purchase", (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Expecting "Bearer <token>"
  const { items } = req.body;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Items array is required and cannot be empty",
      });
  }

  // Verify JWT token
  jwt.verify(token, "your_jwt_secret", (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const userId = decoded.userId;

    // Start a database transaction
    db.beginTransaction((err) => {
      if (err) {
        console.error("Transaction error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database transaction error" });
      }

      // Prepare query to insert multiple items into Purchase_History
      const purchaseQuery =
        "INSERT INTO Purchase_History (User_Id, Item_Name, Amount) VALUES ?";
      const purchaseValues = items.map((item) => [
        userId,
        item.itemName,
        item.amount,
      ]);

      // Execute purchase history insertion
      db.query(purchaseQuery, [purchaseValues], (err, purchaseResults) => {
        if (err) {
          return db.rollback(() => {
            console.error("Purchase database error:", err);
            res
              .status(500)
              .json({
                success: false,
                message: "Database error during purchase",
              });
          });
        }

        // Aggregate quantities for each product (in case of duplicates)
        const cart =
          req.body.cart || JSON.parse(localStorage.getItem("cart")) || [];
        const quantityMap = {};
        cart.forEach((cartItem) => {
          if (quantityMap[cartItem.name]) {
            quantityMap[cartItem.name] += cartItem.quantity;
          } else {
            quantityMap[cartItem.name] = cartItem.quantity;
          }
        });

        // Process inventory updates
        const inventoryUpdates = Object.keys(quantityMap).map((itemName) => {
          return new Promise((resolve, reject) => {
            // Get Product_Id from Products table using itemName
            const productQuery =
              "SELECT ID FROM Products WHERE Product_Name = ?";
            db.query(productQuery, [itemName], (err, productResults) => {
              if (err || productResults.length === 0) {
                return reject(
                  new Error(`Product not found for item: ${itemName}`)
                );
              }

              const productId = productResults[0].ID;
              const quantityToSubtract = quantityMap[itemName];

              // Check if sufficient inventory exists
              const checkInventoryQuery =
                "SELECT Quantity FROM Inventory WHERE Product_Id = ?";
              db.query(
                checkInventoryQuery,
                [productId],
                (err, inventoryResults) => {
                  if (err || inventoryResults.length === 0) {
                    return reject(
                      new Error(`No inventory found for product: ${itemName}`)
                    );
                  }

                  const currentQuantity = inventoryResults[0].Quantity;
                  if (currentQuantity < quantityToSubtract) {
                    return reject(
                      new Error(
                        `Insufficient inventory for product: ${itemName}`
                      )
                    );
                  }

                  // Update Inventory table
                  const inventoryQuery =
                    "UPDATE Inventory SET Quantity = Quantity - ? WHERE Product_Id = ?";
                  db.query(
                    inventoryQuery,
                    [quantityToSubtract, productId],
                    (err, inventoryResults) => {
                      if (err) {
                        return reject(
                          new Error(
                            `Inventory update failed for item: ${itemName}`
                          )
                        );
                      }
                      resolve();
                    }
                  );
                }
              );
            });
          });
        });

        // Execute all inventory updates
        Promise.all(inventoryUpdates)
          .then(() => {
            // Commit transaction
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  console.error("Commit error:", err);
                  res
                    .status(500)
                    .json({ success: false, message: "Database commit error" });
                });
              }
              res.json({
                success: true,
                message: "Purchase recorded and inventory updated successfully",
                purchaseCount: purchaseResults.affectedRows,
              });
            });
          })
          .catch((error) => {
            // Rollback transaction on error
            db.rollback(() => {
              console.error("Inventory error:", error);
              res.status(500).json({ success: false, message: error.message });
            });
          });
      });
    });
  });
});

// #################### SHOW PURCASE HISTORY ##########################
// API to fetch purchase history with optional filters
app.get("/Purchase-History", async (req, res) => {
  try {
    const { startDate, endDate, gameTitle, userEmail, searchTerm } = req.query;

    let query = `
            SELECT 
                p.Purchase_Id,
                p.Item_Name,
                p.Amount,
                p.Purchase_Date,
                u.User_Name,
                u.User_Email
            FROM Purchase_History p
            LEFT JOIN Users u ON p.User_Id = u.User_Id
            WHERE 1=1
        `;
    const queryParams = [];

    // Apply date range filter
    if (startDate) {
      query += " AND p.Purchase_Date >= ?";
      queryParams.push(startDate);
    }
    if (endDate) {
      query += " AND p.Purchase_Date <= ?";
      queryParams.push(endDate + " 23:59:59");
    }

    // Apply game title filter
    if (gameTitle) {
      query += " AND p.Item_Name LIKE ?";
      queryParams.push(`%${gameTitle}%`);
    }

    // Apply user email filter
    if (userEmail) {
      query += " AND u.User_Email LIKE ?";
      queryParams.push(`%${userEmail}%`);
    }

    // Apply search term (searches game title or user email)
    if (searchTerm) {
      query += " AND (p.Item_Name LIKE ? OR u.User_Email LIKE ?)";
      queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    // Order by purchase date descending
    query += " ORDER BY p.Purchase_Date DESC";

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error("Error fetching purchase history:", err);
        return res
          .status(500)
          .json({ message: "Error fetching purchase history" });
      }
      res.json(results);
    });
  } catch (error) {
    console.error("Error in purchase-history endpoint:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


