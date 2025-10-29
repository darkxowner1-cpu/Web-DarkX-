const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
});

// Store images in memory (for demo)
let imageDatabase = [];

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Tafuta chagua picha kwanza!'
            });
        }

        const imageInfo = {
            id: Date.now().toString(),
            filename: req.file.filename,
            originalName: req.file.originalname,
            uploadDate: new Date(),
            url: `/uploads/${req.file.filename}`
        };

        imageDatabase.push(imageInfo);

        const shareableLink = `${req.protocol}://${req.get('host')}/image/${imageInfo.id}`;
        
        res.json({
            success: true,
            message: 'Picha imepakiwa kikamilifu! 🎉',
            link: shareableLink,
            filename: imageInfo.originalName
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Hitilafu imetokea wakati wa kupakia picha'
        });
    }
});

app.get('/image/:id', (req, res) => {
    try {
        const image = imageDatabase.find(img => img.id === req.params.id);
        if (!image) {
            return res.status(404).send('Picha haipatikani');
        }
        
        res.sendFile(path.join(__dirname, 'public/uploads', image.filename));
    } catch (error) {
        res.status(500).send('Hitilafu imetokea');
    }
});

app.get('/uploads/:filename', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/uploads', req.params.filename));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Nijengee App inaendesha kwenye port ${PORT}`);
    console.log(`📍 Ungana nayo: http://localhost:${PORT}`);
});
