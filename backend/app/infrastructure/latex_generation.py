import os
from uuid import UUID
from typing import List

from app.domain.services import LaTeXGenerationService
from app.domain.schemas import Profile, Education, WorkExperience, Project, Hackathon, AtomicFact

def latex_escape(text: str) -> str:
    """
    Safely escapes LaTeX special reserved characters to ensure the document 
    compiles without errors.
    """
    if not text:
        return ""
    replacements = {
        "\\": "\\textbackslash{}",
        "&": "\\&",
        "%": "\\%",
        "$": "\\$",
        "_": "\\_",
        "#": "\\#",
        "{": "\\{",
        "}": "\\}",
        "~": "\\textasciitilde{}",
        "^": "\\textasciicircum{}",
    }
    escaped = ""
    for char in text:
        if char in replacements:
            escaped += replacements[char]
        else:
            escaped += char
    return escaped

class SimpleLaTeXGenerationService(LaTeXGenerationService):
    """
    Concrete implementation of LaTeXGenerationService formatting candidate profile, 
    education, relational experiences, and prioritized skills into Jake's Resume style.
    """

    def __init__(self, template_path: str = None):
        if template_path is None:
            current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            template_path = os.path.join(current_dir, "core", "templates", "jakes_resume.tex")
        self.template_path = template_path

    def _load_template(self) -> str:
        """Loads raw LaTeX template code from disk."""
        with open(self.template_path, "r", encoding="utf-8") as f:
            return f.read()

    def generate_latex_resume(
        self,
        profile: Profile,
        education_list: List[Education],
        experiences: List[WorkExperience],
        projects: List[Project],
        hackathons: List[Hackathon],
        selected_facts: List[AtomicFact],
        synthesized_bullets: dict[UUID, str],
        prioritized_skills: dict[str, List[str]]
    ) -> str:
        """
        Injects demographics, academic background, experiences, and technical skills 
        into placeholders in the Jake's Resume LaTeX template.
        """
        template_content = self._load_template()

        # 1. Format Header Demographics
        name_escaped = latex_escape(profile.name)
        email_escaped = latex_escape(profile.email)
        phone_escaped = latex_escape(profile.phone)
        
        links_parts = []
        if profile.website:
            web_esc = latex_escape(profile.website)
            web_disp = web_esc.replace("https://", "").replace("http://", "").strip()
            links_parts.append(f"\\href{{{web_esc}}}{{{web_disp}}}")
        if profile.linkedin:
            li_esc = latex_escape(profile.linkedin)
            li_disp = li_esc.replace("https://", "").replace("http://", "").replace("www.linkedin.com/in/", "").replace("linkedin.com/in/", "").strip()
            links_parts.append(f"\\href{{{li_esc}}}{{linkedin.com/in/{li_disp}}}")
        if profile.github:
            gh_esc = latex_escape(profile.github)
            gh_disp = gh_esc.replace("https://", "").replace("http://", "").replace("github.com/", "").strip()
            links_parts.append(f"\\href{{{gh_esc}}}{{github.com/{gh_disp}}}")

        links_str = ""
        if links_parts:
            links_str = " $|$ " + " $|$ ".join(links_parts)

        template_content = template_content.replace("<<NAME>>", name_escaped)
        template_content = template_content.replace("<<EMAIL>>", email_escaped)
        template_content = template_content.replace("<<PHONE>>", phone_escaped)
        template_content = template_content.replace("<<LINKS>>", links_str)

        # 2. Format Education Section
        edu_blocks = []
        for edu in education_list:
            inst = latex_escape(edu.institution)
            loc = latex_escape(edu.location)
            deg = latex_escape(edu.degree)
            major = latex_escape(edu.major)
            dates = latex_escape(f"{edu.start_date} -- {edu.graduation_date}")
            gpa_str = ""
            if edu.gpa:
                gpa_str = f" (GPA: {latex_escape(edu.gpa)})"
            
            edu_blocks.append(
                f"    \\resumeSubheading\n"
                f"      {{{inst}}}{{{loc}}}\n"
                f"      {{{deg} in {major}{gpa_str}}}{{{dates}}}"
            )
        template_content = template_content.replace("<<EDUCATION_ITEMS>>", "\n".join(edu_blocks))

        # 3. Format Experience Section
        fact_by_id = {f.id: f for f in selected_facts}
        exp_items = []
        for exp in experiences:
            bullets = []
            for fid, bullet_text in synthesized_bullets.items():
                fact = fact_by_id.get(fid)
                if fact and fact.work_experience_id == exp.id:
                    bullets.append(bullet_text)
            
            if bullets:
                employer = latex_escape(exp.employer)
                loc = latex_escape(exp.location)
                role = latex_escape(exp.role)
                dates = latex_escape(f"{exp.start_date} -- {exp.end_date}")
                
                bullets_latex = "\n".join([f"        \\resumeItem{{{latex_escape(b)}}}" for b in bullets])
                
                exp_items.append(
                    f"    \\resumeSubheading\n"
                    f"      {{{employer}}}{{{loc}}}\n"
                    f"      {{{role}}}{{{dates}}}\n"
                    f"      \\resumeItemListStart\n"
                    f"{bullets_latex}\n"
                    f"      \\resumeItemListEnd"
                )

        if exp_items:
            exp_section = (
                f"\\section{{Experience}}\n"
                f"  \\resumeSubHeadingListStart\n"
                + "\n".join(exp_items) + "\n"
                f"  \\resumeSubHeadingListEnd"
            )
        else:
            exp_section = ""
        template_content = template_content.replace("<<EXPERIENCE_SECTION>>", exp_section)

        # 4. Format Projects Section
        proj_items = []
        for proj in projects:
            bullets = []
            proj_skills = set()
            for fid, bullet_text in synthesized_bullets.items():
                fact = fact_by_id.get(fid)
                if fact and fact.project_id == proj.id:
                    bullets.append(bullet_text)
                    if fact.skills:
                        proj_skills.update(fact.skills)
            
            if bullets:
                name = latex_escape(proj.name)
                dates = latex_escape(f"{proj.start_date} -- {proj.end_date}")
                skills_escaped = ", ".join([latex_escape(s) for s in sorted(proj_skills)])
                skills_str = f" $|$ \\emph{{{skills_escaped}}}" if skills_escaped else ""
                
                bullets_latex = "\n".join([f"        \\resumeItem{{{latex_escape(b)}}}" for b in bullets])
                
                proj_items.append(
                    f"    \\resumeProjectHeading\n"
                    f"      {{\\textbf{{{name}}}{skills_str}}}{{{dates}}}\n"
                    f"      \\resumeItemListStart\n"
                    f"{bullets_latex}\n"
                    f"      \\resumeItemListEnd"
                )

        if proj_items:
            proj_section = (
                f"\\section{{Projects}}\n"
                f"  \\resumeSubHeadingListStart\n"
                + "\n".join(proj_items) + "\n"
                f"  \\resumeSubHeadingListEnd"
            )
        else:
            proj_section = ""
        template_content = template_content.replace("<<PROJECTS_SECTION>>", proj_section)

        # 5. Format Hackathons Section
        hack_items = []
        for hack in hackathons:
            bullets = []
            for fid, bullet_text in synthesized_bullets.items():
                fact = fact_by_id.get(fid)
                if fact and fact.hackathon_id == hack.id:
                    bullets.append(bullet_text)
            
            if bullets:
                name = latex_escape(hack.name)
                org = latex_escape(hack.organization)
                placement = latex_escape(hack.role_placement)
                date = latex_escape(hack.date)
                
                bullets_latex = "\n".join([f"        \\resumeItem{{{latex_escape(b)}}}" for b in bullets])
                
                hack_items.append(
                    f"    \\resumeProjectHeading\n"
                    f"      {{\\textbf{{{name}}} $|$ \\emph{{{placement} ({org})}}}}{{{date}}}\n"
                    f"      \\resumeItemListStart\n"
                    f"{bullets_latex}\n"
                    f"      \\resumeItemListEnd"
                )

        if hack_items:
            hack_section = (
                f"\\section{{Hackathons \\& Awards}}\n"
                f"  \\resumeSubHeadingListStart\n"
                + "\n".join(hack_items) + "\n"
                f"  \\resumeSubHeadingListEnd"
            )
        else:
            hack_section = ""
        template_content = template_content.replace("<<HACKATHONS_SECTION>>", hack_section)

        # 6. Format Programming Skills Section
        if prioritized_skills:
            skills_lines = []
            for cat, skills in prioritized_skills.items():
                if skills:
                    cat_esc = latex_escape(cat)
                    skills_esc = ", ".join([latex_escape(s) for s in skills])
                    skills_lines.append(f"     \\textbf{{{cat_esc}}}{{: {skills_esc}}} \\\\")
            
            skills_section = (
                f"\\section{{Technical Skills}}\n"
                f" \\begin{{itemize}}[leftmargin=0.15in, label={{}}]\n"
                f"    \\small{{\\item{{\n"
                + "\n".join(skills_lines) + "\n"
                f"    }}}}\n"
                f" \\end{{itemize}}"
              )
        else:
            skills_section = ""
        template_content = template_content.replace("<<SKILLS_SECTION>>", skills_section)

        return template_content
