const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db.js');
const authRoutes = require('./routes/authRoutes.js');

// 1. Load environment variables and connect to database
dotenv.config();
connectDB();

// 2. Initialize Express application
const app = express();

// 3. Set up Middlewares
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://sk-financ.onrender.com'
];

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json()); 

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', require('./routes/clientRoutes.js'));

// 5. Test Route to check server status
app.get('/', (req, res) => {
    res.send('Sanjay, your finance backend server is running perfectly!');
});

// 6. Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('Server is running on port ' + PORT + '!');
});