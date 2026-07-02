"""Deterministic converter: strict-format development-roadmap.md -> <ProjectName>-roadmap.json.

The strict format contract lives in ~/.claude/SDLC.md ("Roadmap.md Strict Format").
Any deviation fails the conversion with a line number. Fix the markdown, never the JSON.

Usage: python roadmap_md_to_json.py <path/to/development-roadmap.md> [-o output.json]
"""

import argparse
import json
import re
import sys
from pathlib import Path

COLOUR_TAGS = {
    "inception", "architecture", "backend", "frontend",
    "testing", "devops", "release", "security",
}
CE_DRIVERS = {
    "/ce-work", "/ce-optimize", "/ce-debug", "/ce-code-review", "/ce-commit",
    "/ce-simplify-code", "/ce-strategy", "/ce-ideate", "/ce-brainstorm",
    "/ce-plan", "/lfg",
}
STATUSES = {"PENDING", "IN PROGRESS", "DONE"}
SECTION_ORDER = [
    "Project State", "Project", "Tech Stack", "Brainstorm",
    "Plan", "Phases", "V2 Backlog", "Decision Log",
]
PROJECT_FIELDS = [
    "Name", "Description", "Tagline", "Core Principle",
    "V1 Scope Boundary", "Architecture Overview", "Success Metric V1",
]
BRAINSTORM_FIELDS = [
    "Problem", "Pain Intensity", "Evidence", "User",
    "Current Alternative", "Insight", "Core Loop", "What This Is Not",
]

errors: list[str] = []


def fail(line_no: int, msg: str) -> None:
    errors.append(f"  line {line_no}: {msg}")


def clean(cell: str) -> str:
    cell = cell.strip()
    if cell.startswith("`") and cell.endswith("`") and len(cell) > 1:
        cell = cell[1:-1].strip()
    if cell.startswith("**") and cell.endswith("**") and len(cell) > 4:
        cell = cell[2:-2].strip()
    return "" if cell in {"—", "-", ""} else cell


def split_list(cell: str) -> list[str]:
    cell = clean(cell)
    return [clean(p) for p in cell.split(",") if clean(p)] if cell else []


def parse_table(lines: list[str], start: int) -> tuple[list[str], list[tuple[int, list[str]]], int]:
    """Parse a markdown table starting at or after `start`. Returns (headers, [(line_no, cells)], next_index)."""
    i = start
    while i < len(lines) and not lines[i].strip().startswith("|"):
        if lines[i].strip().startswith("#"):
            return [], [], start
        i += 1
    if i >= len(lines):
        return [], [], start
    headers = [h.strip() for h in lines[i].strip().strip("|").split("|")]
    i += 1
    if i >= len(lines) or not re.match(r"^\|[\s\-:|]+\|$", lines[i].strip()):
        fail(i + 1, "table is missing its |---| separator row")
        return headers, [], i
    i += 1
    rows = []
    while i < len(lines) and lines[i].strip().startswith("|"):
        cells = [c for c in lines[i].strip().strip("|").split("|")]
        if len(cells) != len(headers):
            fail(i + 1, f"row has {len(cells)} cells, header has {len(headers)} — pipes inside cells are forbidden")
        rows.append((i + 1, [c.strip() for c in cells]))
        i += 1
    return headers, rows, i


def find_sections(lines: list[str]) -> dict[str, tuple[int, int]]:
    """Map each ## heading to its (start, end) line range and enforce section order."""
    marks = [(i, lines[i].strip()[3:].strip()) for i in range(len(lines))
             if lines[i].strip().startswith("## ")]
    sections: dict[str, tuple[int, int]] = {}
    for idx, (i, name) in enumerate(marks):
        end = marks[idx + 1][0] if idx + 1 < len(marks) else len(lines)
        sections[name] = (i, end)
    seen = [name for _, name in marks if name in SECTION_ORDER]
    if seen != SECTION_ORDER:
        missing = [s for s in SECTION_ORDER if s not in seen]
        if missing:
            fail(1, f"missing required section(s): {', '.join(missing)}")
        elif seen != [s for s in SECTION_ORDER if s in seen]:
            fail(1, f"sections out of order — required: {' -> '.join(SECTION_ORDER)}, found: {' -> '.join(seen)}")
        else:
            fail(1, f"required sections out of order: found {' -> '.join(seen)}")
    first_extra = next((i for i, name in marks if name not in SECTION_ORDER), None)
    last_required = max((i for i, name in marks if name in SECTION_ORDER), default=0)
    if first_extra is not None and first_extra < last_required:
        fail(first_extra + 1, "extra ## sections may appear only after Decision Log")
    return sections


def parse_kv_table(lines: list[str], rng: tuple[int, int], required: list[str], where: str) -> dict[str, str]:
    headers, rows, _ = parse_table(lines, rng[0] + 1)
    if headers and headers != ["Field", "Value"]:
        fail(rng[0] + 1, f"{where} table columns must be | Field | Value | — found | {' | '.join(headers)} |")
    got = {}
    for line_no, cells in rows:
        if len(cells) >= 2:
            got[clean(cells[0])] = clean(cells[1])
    for field in required:
        if field not in got:
            fail(rng[0] + 1, f"{where} table is missing required field: {field}")
        elif not got[field]:
            fail(rng[0] + 1, f"{where} field '{field}' is empty")
    extra = [k for k in got if k not in required]
    if extra:
        fail(rng[0] + 1, f"{where} table has unknown field(s): {', '.join(extra)}")
    return got


def parse_bullets(lines: list[str], start: int, end: int) -> list[str]:
    items = []
    for i in range(start, end):
        s = lines[i].strip()
        if s.startswith("#"):
            break
        if s.startswith("- "):
            items.append(s[2:].strip())
    return items


def gate(done: bool, confirmed_at: str | None) -> dict:
    return {
        "tasks_complete": done, "done_criterion_met": done,
        "code_review_passed": done, "commit_done": done,
        "confirmed_at": confirmed_at,
    }


def convert(md_path: Path) -> dict | None:
    lines = md_path.read_text(encoding="utf-8").splitlines()

    h1 = next(((i, s.strip()) for i, s in enumerate(lines) if s.strip().startswith("# ")), None)
    if not h1:
        fail(1, "missing H1 title")
        return None
    m = re.match(r"^# (.+?) — Development Roadmap$", h1[1])
    if not m:
        fail(h1[0] + 1, "H1 must be exactly '# <ProjectName> — Development Roadmap'")
        return None
    project_name = m.group(1).strip()

    sections = find_sections(lines)
    if errors:
        return None

    # Project State — single source of truth for status
    headers, rows, _ = parse_table(lines, sections["Project State"][0] + 1)
    if headers != ["Phase", "Status", "Completed", "Notes"]:
        fail(sections["Project State"][0] + 1, "Project State columns must be | Phase | Status | Completed | Notes |")
    state: dict[int, dict] = {}
    for line_no, cells in rows:
        pm = re.match(r"^Phase\s+(-?\d+)\s+(.*)$", clean(cells[0]))
        if not pm:
            fail(line_no, f"Phase cell must start 'Phase <n> <name>' — found '{clean(cells[0])}'")
            continue
        number, name = int(pm.group(1)), pm.group(2).strip()
        status, completed = clean(cells[1]), clean(cells[2])
        if status not in STATUSES:
            fail(line_no, f"status must be PENDING, IN PROGRESS, or DONE — found '{status}'")
        if status == "DONE" and not re.match(r"^\d{4}-\d{2}-\d{2}$", completed):
            fail(line_no, "DONE phase requires a YYYY-MM-DD date in Completed")
        if number in state:
            fail(line_no, f"duplicate Phase {number} in Project State")
        state[number] = {"name": name, "status": status, "completed": completed,
                         "notes": clean(cells[3]), "line": line_no}

    project_kv = parse_kv_table(lines, sections["Project"], PROJECT_FIELDS, "Project")
    if project_kv.get("Name") and project_kv["Name"] != project_name:
        fail(sections["Project"][0] + 1, f"Project Name '{project_kv['Name']}' must equal H1 name '{project_name}'")

    headers, rows, _ = parse_table(lines, sections["Tech Stack"][0] + 1)
    if headers != ["Layer", "Choice", "Why"]:
        fail(sections["Tech Stack"][0] + 1, "Tech Stack columns must be | Layer | Choice | Why |")
    tech_stack = [{"layer": clean(c[0]), "choice": clean(c[1]), "why": clean(c[2])}
                  for _, c in rows if len(c) >= 3]

    brainstorm_kv = parse_kv_table(lines, sections["Brainstorm"], BRAINSTORM_FIELDS, "Brainstorm")

    plan_start, plan_end = sections["Plan"]
    features, constraints = [], []
    for i in range(plan_start, plan_end):
        s = lines[i].strip()
        if s == "### Key Features V1":
            features = parse_bullets(lines, i + 1, plan_end)
        elif s == "### Key Constraints":
            constraints = parse_bullets(lines, i + 1, plan_end)
    if not features:
        fail(plan_start + 1, "Plan must contain '### Key Features V1' with at least one bullet")
    if not constraints:
        fail(plan_start + 1, "Plan must contain '### Key Constraints' with at least one bullet")

    # Phases
    ph_start, ph_end = sections["Phases"]
    phase_marks = []
    for i in range(ph_start, ph_end):
        s = lines[i].strip()
        if s.startswith("### "):
            pm = re.match(r"^### Phase (-?\d+) — (.+) \[([a-z]+)\]$", s)
            if not pm:
                fail(i + 1, "phase heading must be '### Phase <n> — <Name> [<colour_tag>]'")
                continue
            phase_marks.append((i, int(pm.group(1)), pm.group(2).strip(), pm.group(3)))

    phases = []
    for idx, (i, number, name, tag) in enumerate(phase_marks):
        end = phase_marks[idx + 1][0] if idx + 1 < len(phase_marks) else ph_end
        if tag not in COLOUR_TAGS:
            fail(i + 1, f"colour tag '{tag}' not in {sorted(COLOUR_TAGS)}")
        if number not in state:
            fail(i + 1, f"Phase {number} has a section but no Project State row")
            st = {"status": "PENDING", "completed": "", "notes": "", "name": name}
        else:
            st = state[number]
            if st["name"] != name:
                fail(i + 1, f"phase name '{name}' does not match Project State name '{st['name']}'")

        mission = done_when = notes_line = ""
        for j in range(i + 1, end):
            s = lines[j].strip()
            if s.startswith("**Mission:**"):
                mission = s[len("**Mission:**"):].strip()
            elif s.startswith("**Done when:**"):
                done_when = s[len("**Done when:**"):].strip()
            elif s.startswith("**Notes:**"):
                notes_line = s[len("**Notes:**"):].strip()
            elif s.startswith("**Status"):
                fail(j + 1, "phase sections must not repeat status — Project State is the single source of truth")
            elif s.startswith("|"):
                break
        if not mission:
            fail(i + 1, f"Phase {number} is missing '**Mission:**'")
        if not done_when:
            fail(i + 1, f"Phase {number} is missing '**Done when:**'")

        headers, rows, after_tasks = parse_table(lines, i + 1)
        if headers != ["#", "Task", "CE Driver", "Context Skills", "Sub-op Plugins", "Treatment"]:
            fail(i + 1, f"Phase {number} task table columns must be | # | Task | CE Driver | Context Skills | Sub-op Plugins | Treatment |")
            rows = []
        is_done = st["status"] == "DONE"
        tasks = []
        for line_no, cells in rows:
            if len(cells) < 6:
                continue
            task_id = clean(cells[0])
            if not task_id.isdigit() or int(task_id) != len(tasks) + 1:
                fail(line_no, f"task # must be sequential from 1 — expected {len(tasks) + 1}, found '{task_id}'")
            driver = clean(cells[2])
            if driver and driver not in CE_DRIVERS:
                fail(line_no, f"CE Driver '{driver}' not in {sorted(CE_DRIVERS)}")
            tasks.append({
                "id": len(tasks) + 1,
                "description": clean(cells[1]),
                "ce_driver": driver,
                "context_skills": split_list(cells[3]),
                "sub_op_plugins": split_list(cells[4]),
                "one_line_treatment": clean(cells[5]),
                "done": is_done,
                "sub_steps": [],
            })
        if not tasks:
            fail(i + 1, f"Phase {number} has no tasks")

        for j in range(after_tasks, end):
            if lines[j].strip() == "#### Sub-steps":
                sh, srows, _ = parse_table(lines, j + 1)
                if sh != ["Task", "ID", "Sub-step", "Expected Output"]:
                    fail(j + 1, "Sub-steps columns must be | Task | ID | Sub-step | Expected Output |")
                    break
                for line_no, cells in srows:
                    if len(cells) < 4:
                        continue
                    ref = clean(cells[0])
                    sid = clean(cells[1])
                    if not ref.isdigit() or int(ref) < 1 or int(ref) > len(tasks):
                        fail(line_no, f"sub-step Task '{ref}' does not exist in Phase {number}'s task table")
                        continue
                    if not re.match(rf"^{ref}[a-z]$", sid):
                        fail(line_no, f"sub-step ID must be task number + letter (e.g. {ref}a) — found '{sid}'")
                    tasks[int(ref) - 1]["sub_steps"].append({
                        "id": sid, "description": clean(cells[2]),
                        "expected_output": clean(cells[3]), "done": is_done,
                    })
                break

        phases.append({
            "number": number,
            "name": name,
            "colour_tag": tag,
            "one_line_mission": mission,
            "status": "DONE" if is_done else "PENDING",
            "completed_date": st["completed"] if is_done else None,
            "notes": notes_line or st["notes"],
            "done_criterion": done_when,
            "tasks": tasks,
            "phase_gate": gate(is_done, f"{st['completed']}T00:00:00Z" if is_done else None),
        })

    for number, st in state.items():
        if number not in {p[1] for p in phase_marks}:
            fail(st["line"], f"Project State lists Phase {number} but there is no matching '### Phase {number}' section")

    headers, rows, _ = parse_table(lines, sections["V2 Backlog"][0] + 1)
    if headers and headers != ["Date", "Idea", "Why Deferred"]:
        fail(sections["V2 Backlog"][0] + 1, "V2 Backlog columns must be | Date | Idea | Why Deferred |")
    backlog = [{"date": clean(c[0]), "idea": clean(c[1]), "why_deferred": clean(c[2])}
               for _, c in rows if len(c) >= 3]

    headers, rows, _ = parse_table(lines, sections["Decision Log"][0] + 1)
    if headers and headers != ["Date", "Decision", "Reason", "Phase"]:
        fail(sections["Decision Log"][0] + 1, "Decision Log columns must be | Date | Decision | Reason | Phase |")
    decisions = [{"date": clean(c[0]), "decision": clean(c[1]), "reason": clean(c[2]), "phase": clean(c[3])}
                 for _, c in rows if len(c) >= 4]

    if errors:
        return None
    return {
        "project": {
            "name": project_name,
            "description": project_kv["Description"],
            "tagline": project_kv["Tagline"],
            "core_principle": project_kv["Core Principle"],
            "v1_scope_boundary": project_kv["V1 Scope Boundary"],
            "tech_stack": tech_stack,
            "architecture_overview": project_kv["Architecture Overview"],
            "success_metric_v1": project_kv["Success Metric V1"],
        },
        "brainstorm": {
            "problem": brainstorm_kv["Problem"],
            "pain_intensity": brainstorm_kv["Pain Intensity"],
            "evidence": brainstorm_kv["Evidence"],
            "user": brainstorm_kv["User"],
            "current_alternative": brainstorm_kv["Current Alternative"],
            "insight": brainstorm_kv["Insight"],
            "core_loop": brainstorm_kv["Core Loop"],
            "what_this_is_not": brainstorm_kv["What This Is Not"],
        },
        "plan": {"key_features_v1": features, "key_constraints": constraints},
        "phases": phases,
        "v2_backlog": backlog,
        "decision_log": decisions,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert strict-format roadmap.md to SDLC Tracker JSON")
    parser.add_argument("markdown", type=Path, help="path to development-roadmap.md")
    parser.add_argument("-o", "--output", type=Path, help="output JSON path (default: <ProjectName>-roadmap.json in cwd)")
    args = parser.parse_args()

    if not args.markdown.is_file():
        print(f"error: {args.markdown} not found", file=sys.stderr)
        return 1

    roadmap = convert(args.markdown)
    if roadmap is None:
        print(f"CONVERSION FAILED — {args.markdown} violates the strict format ({len(errors)} error(s)):", file=sys.stderr)
        for e in errors:
            print(e, file=sys.stderr)
        print("Fix the markdown, never the JSON. Contract: ~/.claude/SDLC.md — 'Roadmap.md Strict Format'.", file=sys.stderr)
        return 1

    out = args.output or Path.cwd() / f"{roadmap['project']['name']}-roadmap.json"
    out.write_text(json.dumps(roadmap, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total_tasks = sum(len(p["tasks"]) for p in roadmap["phases"])
    print(f"OK: {out} — {len(roadmap['phases'])} phases, {total_tasks} tasks")
    return 0


if __name__ == "__main__":
    sys.exit(main())
