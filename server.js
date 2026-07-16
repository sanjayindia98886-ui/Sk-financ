const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: ['https://sk-financ-app.netlify.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

connectDB();

const { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateCompanyName,
    getPendingUsers,
    approveOrBlockUser
} = require('./controllers/authController');

app.post('/api/register', registerUser);
app.post('/api/login', loginUser);
app.get('/api/profile', getUserProfile);
app.put('/api/update-company', updateCompanyName);

app.get('/api/admin/pending', getPendingUsers);
app.post('/api/admin/action', approveOrBlockUser);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
});