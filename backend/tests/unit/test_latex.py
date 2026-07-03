from uuid import uuid4
from app.infrastructure.latex_generation import SimpleLaTeXGenerationService, latex_escape
from app.domain.schemas import Profile, Education, WorkExperience, Project, Hackathon, AtomicFact

def test_latex_escaping():
    """Verify that LaTeX special characters are safely escaped."""
    text = "Python & C++ $100%_saving_#1 {test} ~ ^ \\"
    escaped = latex_escape(text)
    assert escaped == "Python \\& C++ \\$100\\%\\_saving\\_\\#1 \\{test\\} \\textasciitilde{} \\textasciicircum{} \\textbackslash{}"

def test_latex_generator_flow():
    """Verify that LaTeX generation service formats the document correctly and drops empty sections."""
    profile_id = uuid4()
    prof = Profile(
        id=profile_id,
        name="Rushikesh",
        email="rush@example.com",
        phone="+1-555-0199",
        location="San Francisco, CA",
        website="https://rushikesh.dev",
        linkedin="https://linkedin.com/in/rushikesh",
        github="https://github.com/rushikesh"
    )
    
    edu = Education(
        id=uuid4(),
        profile_id=profile_id,
        institution="MIT",
        location="Cambridge, MA",
        degree="M.S.",
        major="Computer Science",
        start_date="2022-09",
        graduation_date="2024-05",
        gpa="4.0/4.0"
    )

    exp = WorkExperience(
        id=uuid4(),
        profile_id=profile_id,
        employer="Google & YouTube",
        role="Staff Software Engineer",
        location="Mountain View, CA",
        start_date="2024-06",
        end_date="Present",
        description="Raw experience description."
    )

    fact_id = uuid4()
    fact = AtomicFact(
        id=fact_id,
        work_experience_id=exp.id,
        action="Designed distributed pipeline for video processing",
        metric_result="improving efficiency by 25%",
        skills=["Python", "FastAPI"]
    )

    service = SimpleLaTeXGenerationService()
    latex_code = service.generate_latex_resume(
        profile=prof,
        education_list=[edu],
        experiences=[exp],
        projects=[],
        hackathons=[],
        selected_facts=[fact],
        synthesized_bullets={fact_id: "Designed distributed pipeline improving efficiency by 25%"},
        prioritized_skills={"Languages": ["Python", "C++"]}
    )

    # Assert demographics render correctly
    assert "Rushikesh" in latex_code
    assert "rush@example.com" in latex_code
    assert "rushikesh.dev" in latex_code
    
    # Assert education section matches
    assert "MIT" in latex_code
    assert "Computer Science" in latex_code
    assert "GPA: 4.0/4.0" in latex_code
    
    # Assert experience matches and '&' and '%' are escaped
    assert "Google \\& YouTube" in latex_code
    assert "Designed distributed pipeline improving efficiency by 25\\%" in latex_code
    
    # Assert skills match
    assert "Technical Skills" in latex_code
    assert "Languages" in latex_code
    assert "Python, C++" in latex_code
    
    # Assert unused segments (projects, hackathons) are omitted to conserve space
    assert "Projects" not in latex_code
    assert "Hackathons \\& Awards" not in latex_code
