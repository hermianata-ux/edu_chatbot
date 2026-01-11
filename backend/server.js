
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for file uploads

// --- MongoDB Connection ---
// Credentials taken from your provided screenshot.
// NOTE: Ensure the cluster address (cluster0.mongodb.net) matches your actual Atlas cluster address.

const MANGO_URI= "mongodb+srv://hermianata_db_user:<db_password>@cluster0.fuksfb8.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    console.log('HINT: If you see "bad auth", check your password. If you see "ENOTFOUND", check your cluster address.');
  });

// --- Schemas ---

const userSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['FACULTY', 'STUDENT'], required: true },
  password: { type: String, required: true }
});
// Composite unique index to allow same ID for different roles if needed, or strictly unique ID
userSchema.index({ id: 1, role: 1 }, { unique: true });

const noteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Keeping string ID for frontend compatibility
  title: String,
  subject: String,
  unit: String,
  content: String,
  uploadedAt: String,
  views: { type: Number, default: 0 },
  type: String,
  fileData: String, // Base64
  fileName: String,
  mimeType: String
});

const subjectSchema = new mongoose.Schema({
  name: { type: String, unique: true }
});

const User = mongoose.model('User', userSchema);
const Note = mongoose.model('Note', noteSchema);
const Subject = mongoose.model('Subject', subjectSchema);

// --- Routes ---

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { id, password, role } = req.body;
    const user = await User.findOne({ id, role, password }); // In production, use bcrypt for password comparison
    
    if (user) {
      const { password, ...safeUser } = user.toObject();
      res.json(safeUser);
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Auth: Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { id, name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ id, role });
    if (existingUser) {
      return res.status(400).json({ message: 'User ID already exists for this role.' });
    }

    const newUser = new User({ id, name, email, password, role });
    await newUser.save();

    const { password: _, ...safeUser } = newUser.toObject();
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Auth: Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, role, newPassword } = req.body;
    const user = await User.findOne({ email, role });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email and role.' });
    }

    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Notes: Get All
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.find().sort({ uploadedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Notes: Add
app.post('/api/notes', async (req, res) => {
  try {
    const noteData = req.body;
    const newNote = new Note(noteData);
    await newNote.save();
    res.json(newNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Notes: Delete
app.delete('/api/notes/:id', async (req, res) => {
  try {
    await Note.deleteOne({ id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Subjects: Get All
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects.map(s => s.name));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Subjects: Add
app.post('/api/subjects', async (req, res) => {
  try {
    const { name } = req.body;
    const existing = await Subject.findOne({ name });
    if (!existing) {
      const newSubject = new Subject({ name });
      await newSubject.save();
    }
    res.json({ name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
