from __future__ import annotations

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"
SIM_ROOT = ROOT / "simulation"

QUESTIONS_FILE = ROOT / "interview" / "questions.json"
COURSE_FILE = SIM_ROOT / "course.json"

FORBIDDEN_IDES = {"eclipse", "vscode"}
MAX_LESSONS_PER_CHAPTER = 5

SEED_POM = """<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.16</version>
  </parent>

  <groupId>com.aerotopo</groupId>
  <artifactId>aerotopo</artifactId>
  <version>0.1.0-SNAPSHOT</version>

  <properties>
    <java.version>21</java.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>
"""

SEED_APP = """package com.aerotopo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AeroTopoApplication {
    public static void main(String[] args) {
        SpringApplication.run(AeroTopoApplication.class, args);
    }
}
"""


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def language_for(path: str) -> str:
    ext = Path(path).suffix.lower()
    return {
        ".java": "java",
        ".xml": "xml",
        ".yml": "yaml",
        ".yaml": "yaml",
        ".properties": "properties",
        ".json": "json",
        ".md": "markdown",
        ".sql": "sql",
        ".js": "javascript",
        ".css": "css",
        ".html": "html",
        ".py": "python",
        ".ps1": "powershell",
        ".csv": "text",
    }.get(ext, "text")


def build_tree(files: dict[str, dict]) -> list[dict]:
    root: list[dict] = []

    for path in sorted(files):
        parts = path.replace("\\", "/").split("/")
        nodes = root
        acc: list[str] = []

        for index, part in enumerate(parts):
            acc.append(part)
            current_path = "/".join(acc)
            last = index == len(parts) - 1

            existing = next((node for node in nodes if node.get("path") == current_path), None)
            if existing is None:
                existing = {
                    "name": part,
                    "path": current_path,
                    "type": "file" if last else "folder",
                }
                if last:
                    existing["language"] = files[path]["language"]
                else:
                    existing["open"] = len(acc) <= 3
                    existing["children"] = []
                nodes.append(existing)

            if not last:
                nodes = existing["children"]

    return root


def load_lessons() -> tuple[dict, list[dict]]:
    questions_doc = read_json(QUESTIONS_FILE)
    by_id = {int(item["id"]): item for item in questions_doc["questions"]}
    course_cfg = read_json(COURSE_FILE)
    configured_max = int(course_cfg.get("max_lessons_per_chapter", MAX_LESSONS_PER_CHAPTER))
    if configured_max != MAX_LESSONS_PER_CHAPTER:
        raise SystemExit(f"max_lessons_per_chapter must remain {MAX_LESSONS_PER_CHAPTER}")
    for chapter in course_cfg["chapters"]:
        lesson_count = len(chapter.get("lessons", []))
        if lesson_count > MAX_LESSONS_PER_CHAPTER:
            raise SystemExit(
                f"{chapter.get('id', 'chapter')} has {lesson_count} lessons; maximum is {MAX_LESSONS_PER_CHAPTER}"
            )

    stages = []
    seen_question_ids: set[int] = set()
    seen_step_questions: set[str] = set()

    for chapter in course_cfg["chapters"]:
        stage_steps = []

        for lesson_rel in chapter["lessons"]:
            lesson_path = SIM_ROOT / lesson_rel
            lesson = read_json(lesson_path)
            question_id = int(lesson["question_id"])

            if question_id in seen_question_ids:
                raise SystemExit(f"Duplicate simulation question_id: {question_id}")
            seen_question_ids.add(question_id)

            source = by_id.get(question_id)
            if source is None:
                raise SystemExit(f"Question {question_id} is missing from interview/questions.json")

            question = source["question"]
            info_language = str(lesson.get("info_language") or "").strip()
            if info_language != "te-Latn":
                raise SystemExit(f"Question {question_id} must use info_language=te-Latn for the explanation box")
            lesson_answer = str(lesson.get("answer") or "").strip()
            if not lesson_answer:
                raise SystemExit(f"Question {question_id} is missing the full lesson answer")
            lesson_label = f"Lesson {lesson['lesson_number']} · {question}"

            for step_index, raw_step in enumerate(lesson["steps"]):
                is_last_step = step_index == len(lesson["steps"]) - 1
                step_question = str(raw_step.get("question") or "").strip()
                step_why_te = str(raw_step.get("why_te") or "").strip()
                if not step_question:
                    raise SystemExit(
                        f"Question {question_id}, step {step_index + 1} is missing its unique English #Q1 question"
                    )
                if not step_why_te:
                    raise SystemExit(
                        f"Question {question_id}, step {step_index + 1} is missing Telugu-in-English-font explanation text"
                    )
                normalized_step_question = " ".join(step_question.casefold().split())
                if normalized_step_question in seen_step_questions:
                    raise SystemExit(
                        f"Duplicate step question detected at question {question_id}, step {step_index + 1}: {step_question}"
                    )
                seen_step_questions.add(normalized_step_question)

                software = raw_step.get("software", "intellij")
                if software in FORBIDDEN_IDES:
                    raise SystemExit(
                        f"IDE policy violation in question {question_id}: {software} is forbidden; use IntelliJ."
                    )

                action = raw_step.get("action") or {}
                if not action.get("action"):
                    raise SystemExit(f"Question {question_id} has a step without an action")

                stage_steps.append(
                    {
                        "lesson": lesson_label,
                        "questionId": question_id,
                        "lessonMode": lesson["mode"],
                        "projectImpact": lesson["project_impact"],
                        "title": raw_step["title"],
                        "why": f"Question\n{step_question}\n\n{step_why_te}",
                        "answer": lesson_answer if is_last_step else "",
                        "answerBox": is_last_step,
                        "infoLanguage": info_language,
                        "software": software,
                        "required_capability": raw_step.get("required_capability"),
                        "feature_available": raw_step.get("feature_available", True),
                        "action": action,
                    }
                )

        stages.append(
            {
                "id": chapter["id"],
                "title": chapter["title"],
                "subtitle": chapter.get("subtitle", ""),
                "stepLabel": "steps",
                "steps": stage_steps,
            }
        )

    browser_course = {
        "title": course_cfg["title"],
        "subtitle": course_cfg["subtitle"],
        "books": course_cfg["books"],
        "stepLabel": "steps",
        "package": {
            "apps": {
                "intellij_idea": build_seed_package(),
            }
        },
        "stages": stages,
    }
    return browser_course, list(by_id.values())


def build_seed_package() -> dict:
    files = {
        "pom.xml": {"language": "xml", "content": SEED_POM},
        "src/main/java/com/aerotopo/AeroTopoApplication.java": {
            "language": "java",
            "content": SEED_APP,
        },
    }

    return {
        "project": {
            "name": "AeroTopo",
            "sdk": "Java 21",
            "languageLevel": "21",
        },
        "tree": build_tree(files),
        "files": files,
        "problems": [],
        "breakpoints": [],
        "runConfigurations": [],
        "maven": {
            "dependencies": [
                {"groupId": "org.springframework.boot", "artifactId": "spring-boot-starter-web"},
                {"groupId": "org.springframework.boot", "artifactId": "spring-boot-starter-validation"},
                {"groupId": "org.springframework.boot", "artifactId": "spring-boot-starter-test"},
            ]
        },
        "spring": {},
        "jpa": {},
        "git": {"branch": "main", "changes": [], "history": []},
        "database": {},
        "tests": {},
        "terminal": "",
        "console": "",
        "visibleFeatures": [],
        "initialFile": "pom.xml",
    }


def collect_full_project_files() -> dict[str, dict]:
    files: dict[str, dict] = {}
    roots = ["src", "deploy", "docs", "labs", "samples"]
    root_files = [
        "pom.xml",
        "Dockerfile",
        "compose.yml",
        "Jenkinsfile",
        "README.md",
        "CONTRIBUTING.md",
        "PROJECT_CONTEXT.md",
    ]

    for folder in roots:
        base = ROOT / folder
        if not base.exists():
            continue

        for path in sorted(base.rglob("*")):
            if not path.is_file():
                continue
            if any(part in {"target", ".git", ".cache", "__pycache__", "data"} for part in path.parts):
                continue
            try:
                content = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue

            rel = path.relative_to(ROOT).as_posix()
            files[rel] = {"language": language_for(rel), "content": content}

    for name in root_files:
        path = ROOT / name
        if path.exists():
            files[name] = {"language": language_for(name), "content": path.read_text(encoding="utf-8")}

    return files


def write_full_project_data() -> None:
    out = SITE / "project-data"
    out.mkdir(parents=True, exist_ok=True)

    files = collect_full_project_files()
    items = list(sorted(files.items()))
    bucket_count = 8
    buckets = [dict() for _ in range(bucket_count)]

    for index, (path, meta) in enumerate(items):
        buckets[index % bucket_count][path] = meta

    for index, bucket in enumerate(buckets, start=1):
        payload = json.dumps(bucket, ensure_ascii=False, separators=(",", ":"))
        (out / f"part-{index:02d}.js").write_text(
            "window.FULL_PROJECT_PARTS=window.FULL_PROJECT_PARTS||[];"
            f"window.FULL_PROJECT_PARTS.push({payload});\n",
            encoding="utf-8",
        )

    meta = {
        "project": {"name": "AeroTopo", "sdk": "Java 21", "languageLevel": "21"},
        "tree": build_tree(files),
        "initialFile": "src/main/java/com/aerotopo/AeroTopoApplication.java",
        "problems": [],
        "breakpoints": [],
        "runConfigurations": [],
        "maven": {},
        "spring": {},
        "jpa": {},
        "git": {"branch": "main", "changes": [], "history": []},
        "database": {},
        "tests": {},
        "terminal": "",
        "console": "",
        "visibleFeatures": [],
    }

    meta_json = json.dumps(meta, ensure_ascii=False, separators=(",", ":"))
    (out / "index.js").write_text(
        f"window.FULL_PROJECT_META={meta_json};\n"
        "window.buildFullProjectPackage=function(){"
        "const files=Object.assign({},...(window.FULL_PROJECT_PARTS||[]));"
        "return {apps:{intellij_idea:{...window.FULL_PROJECT_META,files}}};"
        "};\n",
        encoding="utf-8",
    )


def main() -> None:
    if not SITE.exists():
        raise SystemExit("_site does not exist; copy the master runtime before running this adapter")

    course, questions = load_lessons()

    published_step_count = sum(len(stage["steps"]) for stage in course["stages"])
    if published_step_count < 1:
        raise SystemExit("No simulator steps were generated")
    course_cfg = read_json(COURSE_FILE)
    published_lesson_count = sum(len(chapter.get("lessons", [])) for chapter in course_cfg["chapters"])

    lessons_js = "window.COURSE = " + json.dumps(course, ensure_ascii=False, indent=2) + ";\n"
    (SITE / "lessons.js").write_text(lessons_js, encoding="utf-8")
    write_full_project_data()

    summary = {
        "source_question_count": len(questions),
        "published_lesson_count": published_lesson_count,
        "published_step_count": published_step_count,
        "ide_policy": "IntelliJ only; Eclipse and VS Code forbidden",
        "max_lessons_per_chapter": MAX_LESSONS_PER_CHAPTER,
    }
    (SITE / "simulation-summary.json").write_text(
        json.dumps(summary, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(summary))


if __name__ == "__main__":
    main()