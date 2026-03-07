const { generateSummary } = require('./server/src/services/geminiService');

async function test() {
    console.log('Testing Gemini API...');
    try {
        const res = await generateSummary(80, [{ name: "inverter_power", value: 1.5 }]);
        console.log('Gemini Result:', res);
    } catch (err) {
        console.error('Gemini Error:', err);
    }
}
test();
