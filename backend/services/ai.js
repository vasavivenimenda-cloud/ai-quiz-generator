const TYPES = {
  mcq: 'single-answer multiple choice with exactly 4 options',
  tf: 'True/False with options ["True","False"]',
  multi: 'multiple select with 4-5 options and 2 or more correct answers',
  mixed: 'a mix of mcq, tf and multi types'
};

const bad = (m, s = 502) => Object.assign(new Error(m), { status: s });

function validate(d, count) {
  if (!d || !Array.isArray(d.questions)) throw bad('AI returned an invalid quiz. Please try again.');
  const qs = d.questions.filter(q => q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length >= 2 &&
    q.options.every(o => typeof o === 'string') && Array.isArray(q.correct) && q.correct.length &&
    q.correct.every(i => Number.isInteger(i) && i >= 0 && i < q.options.length))
    .map(q => {
      const type = ['mcq', 'tf', 'multi'].includes(q.type) ? q.type : q.correct.length > 1 ? 'multi' : 'mcq';
      return {
        question: q.question.trim(),
        type,
        options: q.options,
        correct: type === 'multi' ? [...new Set(q.correct)] : [q.correct[0]],
        explanation: String(q.explanation || ''),
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium'
      };
    }).slice(0, count);

  if (!qs.length) throw bad('AI returned no usable questions. Please try again.');
  return { title: String(d.title || 'Generated Quiz').slice(0, 120), questions: qs };
}

function generateMockQuiz({ topic, content, count, difficulty, type }) {
  const subject = topic?.trim() || (content ? content.slice(0, 35).replace(/\s+/g, ' ').trim() : 'General Study');
  const questions = [];
  const diff = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';

  const sampleTemplates = [
    {
      q: `What is a primary principle or fundamental mechanism in ${subject}?`,
      type: 'mcq',
      options: [
        `Core foundational process that governs the system in ${subject}`,
        `Secondary legacy mechanism that is generally inactive`,
        `Random variable having no structured influence`,
        `External transient metric without analytical significance`
      ],
      correct: [0],
      explanation: `The foundational process is essential to understanding the operational theory of ${subject}.`
    },
    {
      q: `Key theories and concepts in ${subject} remain consistently testable under standard conditions.`,
      type: 'tf',
      options: ['True', 'False'],
      correct: [0],
      explanation: `Standard empirical and theoretical models in ${subject} are formulated to produce reproducible outcomes.`
    },
    {
      q: `Which of the following factors or components are actively relevant to ${subject}?`,
      type: 'multi',
      options: [
        `Primary structural component of ${subject}`,
        `Analytical metrics and observed parameters`,
        `Completely unrelated peripheral noise`,
        `Essential governing principle and application`
      ],
      correct: [0, 1, 3],
      explanation: `Options A, B, and D describe direct elements of ${subject}, whereas option C is extraneous.`
    },
    {
      q: `When optimizing or analyzing performance in ${subject}, what is the best recommended approach?`,
      type: 'mcq',
      options: [
        `Identify bottlenecks through structured observation and testing`,
        `Ignore core dependencies and proceed with arbitrary estimates`,
        `Avoid recording any operational metrics or baseline data`,
        `Terminate the operation without examining the underlying causes`
      ],
      correct: [0],
      explanation: `Structured observation and testing allow systematic identification and resolution of issues in ${subject}.`
    },
    {
      q: `In the context of ${subject}, complex tasks can usually be broken down into modular steps.`,
      type: 'tf',
      options: ['True', 'False'],
      correct: [0],
      explanation: `Modularity improves conceptual clarity, debugging, and systematic execution in ${subject}.`
    }
  ];

  for (let idx = 0; idx < count; idx++) {
    const tmpl = sampleTemplates[idx % sampleTemplates.length];
    let qType = type === 'mixed' ? tmpl.type : type;
    let item;

    if (qType === 'tf') {
      const isTrue = idx % 2 === 0;
      item = {
        question: `Question ${idx + 1}: In the study of ${subject}, foundational rules remain consistent across core applications.`,
        type: 'tf',
        options: ['True', 'False'],
        correct: [isTrue ? 0 : 1],
        explanation: `This statement is considered ${isTrue ? 'True' : 'False'} based on standard principles of ${subject}.`,
        difficulty: diff
      };
    } else if (qType === 'multi') {
      item = {
        question: `Question ${idx + 1}: Which of the following elements are directly associated with ${subject}?`,
        type: 'multi',
        options: [
          `Key parameter A of ${subject}`,
          `Observable behavior B in ${subject}`,
          `Unrelated anomalous factor`,
          `Essential requirement C for ${subject}`
        ],
        correct: [0, 1, 3],
        explanation: `Items A, B, and D represent legitimate properties of ${subject}.`,
        difficulty: diff
      };
    } else {
      item = {
        question: `Question ${idx + 1}: ${tmpl.q}`,
        type: 'mcq',
        options: tmpl.options,
        correct: [0],
        explanation: tmpl.explanation,
        difficulty: diff
      };
    }
    questions.push(item);
  }

  return {
    title: `${subject} Quiz`,
    questions
  };
}

exports.generate = async ({ topic, content, count, difficulty, type, hint }) => {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  const isMock = !apiKey || apiKey === 'sk-your-key-here' || apiKey === 'mock' || apiKey.startsWith('sk-your-');

  if (isMock) {
    console.log('[AI Service] Notice: Running in demo/offline mock mode (no active OPENAI_API_KEY detected).');
    const mock = generateMockQuiz({ topic, content, count, difficulty, type });
    return validate(mock, count);
  }

  const prompt = `Create a quiz of exactly ${count} questions. Difficulty: ${difficulty}. Question type: ${TYPES[type] || TYPES.mixed}. ${hint || ''}
${content ? 'Use ONLY this study material:\n' + content.slice(0, 12000) : 'Topic: ' + topic}
Return JSON: {"title":string,"questions":[{"question":string,"type":"mcq"|"tf"|"multi","options":[string],"correct":[zero-based option indexes],"explanation":string,"difficulty":"easy"|"medium"|"hard"}]}`;

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are an expert teacher. Reply with valid JSON only.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.warn(`[AI Service] OpenAI API error (${r.status}):`, errText);

      // If OpenAI quota exceeded or unauthorized, provide clear feedback or fallback
      if (process.env.ALLOW_AI_FALLBACK === 'true' || r.status === 429 || r.status === 401) {
        console.log('[AI Service] Falling back to demo mock generation due to OpenAI API status:', r.status);
        const mock = generateMockQuiz({ topic, content, count, difficulty, type });
        return validate(mock, count);
      }
      throw bad(`AI service error (${r.status}). Check your OpenAI API key and billing quota in backend/.env.`);
    }

    const json = await r.json();
    let data;
    try {
      data = JSON.parse(json.choices[0].message.content);
    } catch {
      throw bad('AI response could not be parsed into valid quiz JSON.');
    }
    return validate(data, count);
  } catch (err) {
    if (err.status) throw err;
    console.warn('[AI Service] Network error connecting to OpenAI:', err.message);
    if (process.env.ALLOW_AI_FALLBACK === 'true' || !apiKey) {
      console.log('[AI Service] Using mock generator fallback.');
      return validate(generateMockQuiz({ topic, content, count, difficulty, type }), count);
    }
    throw bad('Failed to connect to AI service. Please check your internet connection or backend/.env configuration.');
  }
};

