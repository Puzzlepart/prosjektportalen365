#!/usr/bin/env python3
"""Parses smoke test YAML issue templates and generates structured issue bodies.

Reads each YAML template from .github/ISSUE_TEMPLATE/, converts the body
(markdown sections + checkboxes) to a plain-markdown string suitable for
programmatic issue creation, and outputs a JSON array to stdout.

Environment variables:
  VERSION      Version being smoke-tested (e.g. "1.13.0")
  ENVIRONMENT  Test environment string (e.g. "Ny installasjon")
  GITHUB_WORKSPACE  Root of the checked-out repository (set by GitHub Actions)
"""

import json
import os
import sys
from pathlib import Path

import yaml


SMOKE_TEST_FILES = [
    ("smoketest-portfolioextensions.yml", "PortfolioExtensions"),
    ("smoketest-portfoliowebparts.yml", "PortfolioWebParts"),
    ("smoketest-programwebparts.yml", "ProgramWebParts"),
    ("smoketest-projectextensions.yml", "ProjectExtensions"),
    ("smoketest-projectwebparts.yml", "ProjectWebParts"),
    ("smoketest-sharepoint-sider.yml", "SharePoint-sider"),
    ("smoketest-dokumentasjon.yml", "Dokumentasjon"),
]

# Form field types that should be skipped when building the issue body
# (version, environment, tester, browser and tenant URL are supplied
#  as a header block instead)
SKIP_TYPES = {"input", "dropdown"}


def template_to_markdown(template_path: Path, version: str, environment: str) -> str:
    """Convert a YAML issue-form template to a markdown string.

    Skips ``input`` and ``dropdown`` form fields (the header block at the top
    of the issue body already contains version and environment information).
    Markdown sections and checkbox groups are rendered verbatim.
    """
    with open(template_path, encoding="utf-8") as fh:
        template = yaml.safe_load(fh)

    parts: list[str] = []

    # Metadata header
    parts.append(
        f"**Versjon:** {version}  \n"
        f"**Miljø:** {environment}\n"
    )

    for item in template.get("body", []):
        item_type = item.get("type", "")
        attrs = item.get("attributes", {})

        if item_type in SKIP_TYPES:
            continue

        if item_type == "markdown":
            value = (attrs.get("value") or "").rstrip()
            if value:
                parts.append(value)

        elif item_type == "checkboxes":
            label = attrs.get("label", "")
            description = (attrs.get("description") or "").strip()
            options = attrs.get("options") or []

            parts.append(f"\n### {label}")
            if description:
                parts.append(f"\n_{description}_\n")
            for option in options:
                parts.append(f"- [ ] {option['label']}")

        elif item_type == "textarea":
            label = attrs.get("label", "")
            parts.append(f"\n### {label}\n\n_(legg til kommentarer her)_")

    return "\n".join(parts)


def main() -> None:
    version = os.environ.get("VERSION", "X.X.X")
    environment = os.environ.get("ENVIRONMENT", "Ny installasjon")

    workspace = Path(os.environ.get("GITHUB_WORKSPACE", "."))
    templates_dir = workspace / ".github" / "ISSUE_TEMPLATE"

    issues: list[dict] = []
    for filename, package_name in SMOKE_TEST_FILES:
        template_path = templates_dir / filename
        if not template_path.exists():
            print(f"Warning: template not found: {template_path}", file=sys.stderr)
            continue

        with open(template_path, encoding="utf-8") as fh:
            template = yaml.safe_load(fh)

        template_name: str = template.get("name", filename)
        labels = template.get("labels", ["smoke-test"])
        if isinstance(labels, str):
            labels = [labels]
        labels = [str(lbl) for lbl in labels]

        body = template_to_markdown(template_path, version, environment)

        issues.append(
            {
                "title": f"{template_name} — v{version}",
                "body": body,
                "labels": labels,
                "package": package_name,
            }
        )

    json.dump(issues, sys.stdout, ensure_ascii=False, indent=2)
    print()  # trailing newline


if __name__ == "__main__":
    main()
