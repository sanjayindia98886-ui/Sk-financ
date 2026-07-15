const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// env फाइल लोड करने के लिए
dotenv.config();

const app = express();

// मिडिलवेयर
app.use(cors());
app.use(express.json());

// चेक करने के लिए एक सिंपल रूट
app.get('/', (req, res) => {
    res.send('बैकएंड सर्वर लाइव है और बढ़िया काम कर रहा है!');
});

// मोंगोडीबी एटलस (MongoDB Atlas) कनेक्शन
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('मोंगोडीबी एटलस (MongoDB Atlas) से कनेक्शन सफल रहा! 🎉'))
    .catch((err) => console.error('डेटाबेस कनेक्शन में एरर आया:', err));

// सर्वर पोर्ट सेट करना
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`सर्वर पोर्ट ${PORT} पर चालू हो गया है।`);
});