
/**
 * NOTE: This file is a reference for how you would structure your MongoDB schemas 
 * in a real Node.js backend using Mongoose. 
 * 
 * Since this is a browser-only demo, this file is not directly executed, 
 * but provides the code you requested for "including MongoDB".
 */

 import mongoose from 'mongoose'; // Uncomment in Node.js environment

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['FACULTY', 'STUDENT'], required: true },
  email: { type: String, required: true },
  password: { type: String, required: true } // In production, hash this!
});

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  unit: { type: String, required: true },
  content: { type: String }, // Metadata or summary
  uploadedAt: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  type: { type: String, enum: ['PDF', 'DOCX', 'PPT', 'TXT'], required: true },
  fileData: { type: String }, // Base64 encoded string
  fileName: { type: String },
  mimeType: { type: String }
});

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

export const UserModel = mongoose.model('User', UserSchema);
export const NoteModel = mongoose.model('Note', NoteSchema);
export const SubjectModel = mongoose.model('Subject', SubjectSchema);
*/

export const MONGODB_URI = "MONGO_URI=mongodb+srv://hermianata_db_user:kbT6MGogujD7tfR7@cluster0.fuksfb8.mongodb.net/edunote?retryWrites=true&w=majority";
