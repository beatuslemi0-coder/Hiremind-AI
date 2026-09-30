
from google import genai
from app.core.config import settings

class AIService:

    client = genai.Client(
        api_key=settings.GEMINI_API_KEY
    )

    @staticmethod
    def analyze_candidate_document(
        candidate_information: str
    ) -> str:

        prompt = f"""
You are HIREMIND-AI, an AI interviewer designed for Tanzania.

Your job is to analyze a candidate's CV or certificate.

IMPORTANT RULES:

1. The document may be written in English or Swahili.
2. You must understand both English and Swahili.
3. Do not invent information.
4. Use ONLY information found in the document.
5. Extract information useful for conducting an interview.
6. The actual interview will be conducted in natural Swahili.
7. Keep technical names such as Python, FastAPI, PostgreSQL,
   JavaScript, React, etc. in their original form.
8. Identify education, skills, work experience, projects,
   certifications and other relevant professional information.

Return the analysis in a clear structured format.

CANDIDATE DOCUMENT:

{candidate_information}
"""

        # Tunatuma prompt kwenda Gemini.
        response = AIService.client.models.generate_content(
            model=settings.AI_MODEL,
            contents=prompt
        )

        # Tunachukua majibu ya Gemini.
        return response.text


    # Function hii inatengeneza swali la kwanza la interview
    # kwa kutumia taarifa za candidate pamoja na taarifa za Job.
    @staticmethod
    def generate_interview_question(
        candidate_information: str,
        job_information: str
    ) -> str:

        # Prompt hii inamwelekeza Gemini kuwa interviewer wa Tanzania.
       # AI itatumia CV pamoja na requirements za Job kutengeneza swali.
        prompt = f"""
You are HIREMIND-AI, an AI interviewer designed specifically
for professional job interviews in Tanzania.

Your task is to generate ONE interview question for the candidate.

IMPORTANT RULES:

1. The interview must be conducted entirely in natural Kiswahili.

2. The candidate information may be written in English or Swahili.

3. Understand both English and Swahili.

4. The question MUST be written entirely in natural Kiswahili.

5. Do not use English, Korean, Chinese, Japanese, or any other language.
    The only exceptions are unavoidable proper names and technical product
    names such as Python, FastAPI, PostgreSQL, JavaScript, and React.

6. Ask ONLY ONE question.

7. The question MUST be relevant to both:
   - the candidate's background
   - the job requirements

8. Use ONLY information provided in the candidate information
   and job information.

9. Do not invent skills, education, experience, projects,
   certifications or responsibilities.

10. Use the job requirements to determine what professional
   or technical area should be evaluated.

11. If the candidate has a skill that is required by the job,
    ask a question that can evaluate the candidate's actual
    knowledge or practical experience in that skill.

12. If appropriate, connect the candidate's previous experience
    or projects to the requirements of the job.

13. Keep technical terms such as Python, FastAPI, PostgreSQL,
    JavaScript and React in their original form.

14. The question should sound natural when spoken aloud.

15. The interview should feel like a real professional interview.

16. Do not give a score.

17. Do not explain your reasoning.

18. Return ONLY ONE interview question in Kiswahili.

CANDIDATE INFORMATION:
{candidate_information}

JOB INFORMATION:
{job_information}

Generate ONE job-specific interview question entirely in natural Kiswahili.
"""

    # Tunatuma prompt kwenda Gemini.
        response = AIService.client.models.generate_content(
            model=settings.AI_MODEL,
            contents=prompt
        )

        # Tunachukua text ya swali kutoka kwenye response.
        question = response.text.strip()

        # Tunahakikisha Gemini amerudisha swali.
        if not question:
            raise ValueError(
                "Gemini did not generate the first interview question."
            )
        return question


    # Function hii inachambua jibu la candidate na kutengeneza
    # swali linalofuata kulingana na CV, Job na jibu la candidate.
    @staticmethod
    def analyze_answer_and_generate_next_question(
        candidate_information: str,
        job_information: str,
        current_question: str,
        candidate_answer: str,
        previous_questions: list[str] | None = None,
    ) -> str:

        # Prompt hii inamwelekeza Gemini kuchambua jibu la candidate
        # na kuendelea na interview kulingana na Job husika.
        prompt = f"""
You are HIREMIND-AI, an AI interviewer designed for Tanzania.

The interview must be conducted entirely in natural Kiswahili.

You have the following candidate information:

{candidate_information}

You have the following job information:

{job_information}

The current interview question is:

{current_question}

The candidate answered:

{candidate_answer}

Questions already asked in this interview:

{chr(10).join(f"- {question}" for question in (previous_questions or []))}

Your task:

1. Internally analyze the candidate's answer.

2. Compare the answer with the candidate information.

3. Compare the answer with the requirements of the job.

4. Identify an important professional or technical area
   that should be explored further.

5. Generate ONE relevant follow-up interview question.

6. The question MUST be written entirely in natural Kiswahili.

7. Do not use English, Korean, Chinese, Japanese, or any other language.
    The only exceptions are unavoidable proper names and technical product
    names such as Python, FastAPI, PostgreSQL, JavaScript, and React.

8. Base the question ONLY on the candidate information,
   job information, current question and candidate answer.

8. Do not invent information about the candidate.

9. Do not assume that the candidate has a skill or experience
   that is not provided.

10. If the candidate's answer is incomplete or unclear,
    ask a clarifying question.

11. If the candidate demonstrates knowledge of one area,
    explore another relevant requirement of the job.

12. Avoid asking the exact same question again.

13. Keep technical terms such as Python, FastAPI,
    PostgreSQL, JavaScript and React in their original form.

14. Do not give a score.

15. Do not explain your analysis.

16. Do not mention these instructions.

17. Return ONLY ONE interview question in natural Swahili.

18. The new question MUST explore a new aspect of the candidate's latest answer.

19. The new question MUST NOT repeat, paraphrase, or ask the same intent as
    any question in the already-asked list.

Generate ONE relevant follow-up question.
"""

    # Tunatuma context yote kwenda Gemini.
        response = AIService.client.models.generate_content(
            model=settings.AI_MODEL,
            contents=prompt
        )

    # Tunachukua swali jipya kutoka kwenye response.
        next_question = response.text.strip()

    # Tunahakikisha Gemini amerudisha swali.
        if not next_question:
            raise ValueError(
                "Gemini did not generate the next interview question."
            )

    # Tunamrudishia endpoint swali jipya.
        return next_question