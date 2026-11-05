# -*- coding: utf-8 -*-
"""Сортировка тетрадей по папкам предметов (notebooks index / notebooks.json).

Используется sync_notebooks_to_app.py и publish_notebooks.py.
Если у item нет поля folder — выводим из id / subject, чтобы sync
не сбрасывал всё в «Прочее».
"""

from __future__ import annotations

from typing import Any

# Порядок папок на главной notebooks
FOLDERS: list[dict[str, str]] = [
    {
        "id": "matan",
        "title": "Математический анализ",
        "icon": "matan.png",
        "color": "#6ba3f0",
    },
    {
        "id": "algebra",
        "title": "Алгебра",
        "icon": "algebra.png",
        "color": "#8b9cf0",
    },
    {
        "id": "geometry",
        "title": "Геометрия и топология",
        "icon": "geometry.png",
        "color": "#6bc5d8",
    },
    {
        "id": "discrete",
        "title": "Дискретная математика",
        "icon": "discrete.png",
        "color": "#7ab8e8",
    },
    {
        "id": "algorithms",
        "title": "Алгоритмы",
        "icon": "algorithms.png",
        "color": "#7c8ce0",
    },
    {
        "id": "informatics",
        "title": "Информатика",
        "icon": "informatics.png",
        "color": "#5a9fd4",
    },
    {
        "id": "cpp",
        "title": "C++",
        "icon": "cpp.png",
        "color": "#6bb8a8",
    },
    {
        "id": "english",
        "title": "Английский",
        "icon": "english.png",
        "color": "#9aa5e8",
    },
]

# Явный map id тетради → папка
FOLDER_BY_ID: dict[str, str] = {
    "matan-theory": "matan",
    "matan-practice": "matan",
    "matan-kr1": "matan",
    "algebra-theory": "algebra",
    "algebra-practice": "algebra",
    "algebra-colloquium": "algebra",
    "algebra-colloquium-checklist": "algebra",
    "geometry-theory": "geometry",
    "geometry-practice": "geometry",
    "discrete-theory": "discrete",
    "discrete": "discrete",
    "algorithms": "algorithms",
    "informatics": "informatics",
    "cpp": "cpp",
    "english": "english",
}

# Fallback по подстроке в subject (нижний регистр)
_SUBJECT_RULES: list[tuple[str, str]] = [
    ("математ", "matan"),
    ("матан", "matan"),
    ("алгебр", "algebra"),
    ("геометр", "geometry"),
    ("тополог", "geometry"),
    ("дискрет", "discrete"),
    ("алгоритм", "algorithms"),
    ("информат", "informatics"),
    ("c++", "cpp"),
    ("программир", "cpp"),
    ("англий", "english"),
]

# Fallback по префиксу id / имени файла
_ID_PREFIXES: list[tuple[str, str]] = [
    ("matan", "matan"),
    ("algebra", "algebra"),
    ("geometry", "geometry"),
    ("discrete", "discrete"),
    ("algorithms", "algorithms"),
    ("informatics", "informatics"),
    ("cpp", "cpp"),
    ("english", "english"),
]


def infer_folder(item: dict[str, Any]) -> str:
    """Вернуть id папки для item; пустая строка → «Прочее»."""
    explicit = str(item.get("folder") or "").strip()
    if explicit:
        return explicit

    nid = str(item.get("id") or "").strip()
    if nid in FOLDER_BY_ID:
        return FOLDER_BY_ID[nid]

    file_stem = str(item.get("file") or item.get("href") or "")
    if "/" in file_stem or "\\" in file_stem:
        file_stem = file_stem.replace("\\", "/").rsplit("/", 1)[-1]
    if file_stem.endswith(".html"):
        file_stem = file_stem[:-5]
    if file_stem in FOLDER_BY_ID:
        return FOLDER_BY_ID[file_stem]

    blob = f"{nid} {file_stem}".lower()
    for prefix, folder in _ID_PREFIXES:
        if blob.startswith(prefix) or f"-{prefix}" in blob:
            return folder

    subj = str(item.get("subject") or "").lower()
    for needle, folder in _SUBJECT_RULES:
        if needle in subj:
            return folder

    return ""


def assign_folders(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Проставить folder у каждого item (копия списка словарей)."""
    out: list[dict[str, Any]] = []
    for it in items:
        row = dict(it)
        row["folder"] = infer_folder(row)
        out.append(row)
    return out


def catalog_payload(items: list[dict[str, Any]]) -> dict[str, Any]:
    """Готовый объект для notebooks.json."""
    assigned = assign_folders(items)
    return {
        "updatedAt": None,
        "folders": FOLDERS,
        "items": assigned,
    }
