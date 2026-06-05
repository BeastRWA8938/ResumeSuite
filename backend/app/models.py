from pydantic import BaseModel, Field
from typing import List, Optional

class SkillGap(BaseModel):
    category: str = Field(description="Category of skills, e.g., 'Programming Languages', 'Tools', 'Soft Skills'")
    missing_skills: List[str] = Field(description="List of skills/keywords that are in the job description but missing in the resume")
    matched_skills: List[str] = Field(description="List of skills/keywords that are successfully matched in the resume")

class ATSAnalysisResult(BaseModel):
    score: int = Field(description="Overall ATS match score from 0 to 100 based on keyword match, experience relevance, and requirements.")
    summary: str = Field(description="A concise summary (3-4 sentences) evaluating the candidate's fit for the role.")
    matched_keywords: List[str] = Field(description="Keywords and skills present in the resume that match the job description.")
    missing_keywords: List[str] = Field(description="Important keywords and skills present in the job description but missing in the resume.")
    skill_gap_analysis: List[SkillGap] = Field(description="Detailed analysis of skill gaps categorized by technical, soft skills, or domain expertise.")
    strengths: List[str] = Field(description="List of 3-5 key strengths or strong alignments identified in the resume for this position.")
    weaknesses: List[str] = Field(description="List of 3-5 key gaps or areas of improvement to make the resume match better.")
    formatting_feedback: List[str] = Field(description="Feedback on resume structure, readability, action verbs, or formatting issues.")

class AnalysisResponse(BaseModel):
    id: int
    filename: str
    job_title: str
    created_at: str
    result: ATSAnalysisResult
