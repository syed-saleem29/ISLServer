import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Setup file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware setup
app.use(express.json({ limit: '1mb' }));
app.use(cors({
    origin: '*', // Allow requests from all origins. Update if needed for security.
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Serve static files
app.use(express.static(join(__dirname, 'public')));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyCXqaZ8IlXRjBY2XXV1clbhi8lmCuFozuE');

// Load Excel data
const workbook = XLSX.readFile(join(__dirname, 'teachers.xlsx'));
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const teachersData = XLSX.utils.sheet_to_json(worksheet);

// Prepare AI context
const dataContext = teachersData.map(teacher => {
    return `Teacher: ${teacher["Teachers's Name"]}
Contact: ${teacher["Contact Number"]}
Room: ${teacher["Room Number"]}
Specialization: ${teacher["Specialization"]}
Subjects Taught: ${teacher["Subjects taught"]}
Schedule:
Period 1 (${teacher["Period 1 Time"]}): ${teacher["Period 1 Room"]}
Period 2 (${teacher["Period 2 Time"]}): ${teacher["Period 2 Room"]}
Period 3 (${teacher["Period 3 Time"]}): ${teacher["Period 3 Room"]}
Period 4 (${teacher["Period 4 Time"]}): ${teacher["Period 4 Room"]}
Period 5 (${teacher["Period 5 Time"]}): ${teacher["Period 5 Room"]}
Period 6 (${teacher["Period 6 Time"]}): ${teacher["Period 6 Room"]}
Period 7 (${teacher["Period 7 Time"]}): ${teacher["Period 7 Room"]}
Period 8 (${teacher["Period 8 Time"]}): ${teacher["Period 8 Room"]}
`;
}).join('\n\n');

// Chat endpoint
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ response: 'Please provide a message.' });
        }

        const prompt = `You are a helpful and friendly CampusConnect assistant. You have access to teacher information including their schedules, contact numbers, and room numbers. 

Your responses should be:
1. Natural and conversational
2. Concise but complete
3. Focused on answering the specific question
4. Only based on the provided teacher data

The teacher data is:
${dataContext}

User question: ${userMessage}

Please provide a friendly and helpful response based only on the above data.`;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        res.json({ response });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            response: 'Sorry, I encountered an error. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Server port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
