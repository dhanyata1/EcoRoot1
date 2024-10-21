// const express = require('express');
// const { Pool } = require('pg');
// const bcrypt = require('bcryptjs');
// const cors = require('cors');
// const bodyParser = require('body-parser');

// const app = express();
// const port = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // PostgreSQL connection
// const pool = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'EcoRoot',
//     password: 'd@r@p@',
//     port: 5432,
// });

// // Check PostgreSQL connection and start server
// pool.connect((err, client, release) => {
//     if (err) {
//         return console.error('Error acquiring client:', err.stack);
//     }
//     console.log('Connected to PostgreSQL database successfully');

//     // Start the server after successful connection
//     app.listen(port, () => {
//         console.log(`Server running on ${port}`);
//     });

//     release(); // Release the client back to the pool
// });

// // Signup endpoint
// app.post('/signup', async (req, res) => {
//     const { full_name, email, password } = req.body;

//     try {
//         // Check if the email already exists in the database
//         const existingUser = await pool.query(
//             'SELECT * FROM signup_data WHERE email = $1',
//             [email]
//         );

//         if (existingUser.rows.length > 0) {
//             return res.status(400).json({ error: 'Email already exists. Please login.' });
//         }

//         // Hash the password
//         const password_hash = await bcrypt.hash(password, 10);

//         const result = await pool.query(
//             'INSERT INTO signup_data (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
//             [full_name, email, password_hash]
//         );

//         res.status(201).json({
//             message: 'User created successfully',
//             user: result.rows[0],
//         });
//     } catch (error) {
//         console.error('Error creating user:', error);
//         res.status(500).json({ error: 'Error creating user' });
//     }
// });


// // Login endpoint
// app.post('/login', async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // Check if the user exists in the signup_data table
//         const result = await pool.query(
//             'SELECT * FROM signup_data WHERE email = $1',
//             [email]
//         );

//         if (result.rows.length === 0) {
//             return res.status(401).json({ error: 'Invalid email or password' });
//         }

//         const user = result.rows[0];

//         // Compare the provided password with the stored hashed password
//         const isPasswordValid = await bcrypt.compare(password, user.password_hash);

//         if (!isPasswordValid) {
//             return res.status(401).json({ error: 'Invalid email or password' });
//         }

//         // Exclude password_hash from user info
//         const { password_hash, ...userInfo } = user;

//         // Log the successful login attempt in the users table
//         await pool.query(
//             'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
//             [user.full_name, user.email, user.password_hash]
//         );

//         res.status(200).json({ message: 'Login successful', user: userInfo });
//     } catch (error) {
//         console.error('Error logging in:', error);
//         res.status(500).json({ error: 'Error logging in' });
//     }
// });



const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // Hashing library for passwords

// Initialize Express app
const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads

// PostgreSQL connection setup
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'EcoRoot',
    password: 'd@r@p@',
    port: 5432,
});

// Verify PostgreSQL connection
pool.connect((err) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err.stack);
        process.exit(1);
    }
    console.log('Connected to PostgreSQL');
});

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
    destination: './uploads', // Directory to save uploaded images
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// ... previous imports and setup

// API Endpoint for product upload
app.post('/upload-product', upload.single('productImage'), async (req, res) => {
    const { productName, description, price, additionalInfo } = req.body;
    const productImage = req.file; // File is attached to req.file by multer

    if (!productImage) {
        return res.status(400).json({ error: 'Product image is required' });
    }

    try {
        // Insert product data into PostgreSQL database
        const result = await pool.query(
            'INSERT INTO products (product_name, description, price, image_url, additional_info) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [productName, description, price, `/uploads/${productImage.filename}`, additionalInfo || null]
        );

        res.status(201).json({
            message: 'Product uploaded successfully',
            product: result.rows[0]
        });
    } catch (error) {
        console.error('Error uploading product:', error);
        res.status(500).json({ error: 'Error uploading product' });
    }
});

// ... other endpoints

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});


// API for signup
app.post('/signup', async (req, res) => {
    const { full_name, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM signup_data WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists. Please login.' });
        }

        // Hash the password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert new user into the database
        const result = await pool.query(
            'INSERT INTO signup_data (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
            [full_name, email, password_hash]
        );

        res.status(201).json({
            message: 'User created successfully',
            user: { id: result.rows[0].id, full_name, email }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
});

// API for login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM signup_data WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const { password_hash, ...userInfo } = user; // Exclude password_hash from the response

        res.status(200).json({ message: 'Login successful', user: userInfo });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
