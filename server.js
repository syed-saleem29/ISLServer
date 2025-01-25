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

When providing schedule information:
- In case of the professor being free, answer by saying you can meet him at Room Number as well as the his contact details
- Format the response in an easy-to-read way
- If a teacher is not found in the data, kindly respond by saying that I didn't find any information about that professor
- If a time period says free say that he is free during that period...
- be always precise

The type of questions you can expect and how to answer them:
- If asked about the faculties that take a particular subject list the names of those teachers
- If asked about the contact details of a professor answer it politely
- If asked about the room number of a professor answer it politely
- If asked about the specialization of a professor answer it politely
- If asked where is the professor during a time tell them the room number where you can find them politely
- In case of the professor being free, answer by saying you can meet him at Room Number as well as the his contact details


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
