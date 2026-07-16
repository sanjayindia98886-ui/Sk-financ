const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// डेटाबेस कनेक्शन
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// अपने 'authController' को यहाँ जोड़ें (Path चेक कर लें)
// अगर authController.js और server.js एक ही फोल्डर में हैं, तो './' का इस्तेमाल करें
const { registerUser, loginUser } = require('./authController'); 

app.post('/api/register', registerUser);
app.post('/api/login', loginUser);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});