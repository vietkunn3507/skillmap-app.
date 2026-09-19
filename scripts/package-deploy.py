"""Package explicit application files, excluding all personal data and secrets."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
files = []
for name in ("src", "public", "scripts", "deploy", "tests"):
    files.extend(p for p in (root / name).rglob("*") if p.is_file()
                 and "__pycache__" not in p.parts and not p.name.startswith(".env"))
for name in ("package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "next.config.ts", "next-env.d.ts", "tsconfig.json",
             "postcss.config.mjs", "Dockerfile", ".dockerignore", ".gitignore", "render.yaml", "README.md", "Start-SkillMAP.cmd"):
    if (root / name).exists():
        files.append(root / name)
for name in ("huong-dan-dua-skillmap-len-web.md", "idea-feature-audit.md", "kich-ban-demo-phat-trien-nguon-nhan-luc.md"):
    files.append(root / "outputs" / name)
destination = root / "outputs" / "skillmap-deploy.zip"
with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
    for path in files:
        relative = path.relative_to(root)
        assert ".data" not in relative.parts and not path.name.startswith(".env")
        archive.write(path, relative.as_posix())
with zipfile.ZipFile(destination) as archive:
    for required in ("src/data/demo-cv.pdf", "deploy/backend/skillshift.db", "deploy/backend/intelligence.py",
                     "render.yaml", "src/app/(app)/organization/page.tsx", "src/app/api/transformation/route.ts"):
        assert required in archive.namelist(), required
    print(f"Deployment archive verified: {len(archive.namelist())} files; demo CV included; personal database excluded.")
