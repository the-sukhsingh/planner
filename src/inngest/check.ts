import { GoogleGenAI, Type } from '@google/genai';


const checkAnswer = async ({ question, answer, userAnswer}:{
    question: string;
    answer: string;
    userAnswer: string;
}) => {
    const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

    let prompt = `Question: ${question}`;
    prompt += `\nAnswer: ${answer}`;
    prompt += `\nUser Answer: ${userAnswer}`;
    prompt += `\nIs the user answer correct?`;


    const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [{
            role: "user",
            parts: [{
                text: prompt
            }
        ]}
    ]
    });

    const response = result.text;

    return response;

};

export default checkAnswer;