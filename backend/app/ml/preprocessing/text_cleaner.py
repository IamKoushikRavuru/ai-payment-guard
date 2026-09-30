"""
Text Preprocessing & Normalization Pipeline for Prompt Security.
"""

from __future__ import annotations

import re
import unicodedata


class TextPreprocessor:
    def __init__(self) -> None:
        # Regex to strip invisible unicode control chars, zero-width spaces, and homoglyphs
        self.control_char_regex = re.compile(r"[\u200B-\u200D\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F]")
        self.whitespace_regex = re.compile(r"\s+")

    def clean_text(self, text: str) -> str:
        """Normalizes unicode, strips zero-width/control characters, and normalizes whitespace."""
        if not isinstance(text, str):
            return ""

        # Normalize NFKC to decompose strange ligature/homoglyph characters
        normalized = unicodedata.normalize("NFKC", text)

        # Remove zero-width & invisible control characters
        cleaned = self.control_char_regex.sub("", normalized)

        # Normalize multiple spaces/newlines
        cleaned = self.whitespace_regex.sub(" ", cleaned).strip()

        return cleaned

    def extract_syntactic_security_features(self, text: str) -> dict:
        """
        Extracts rule-based structural threat signals from raw prompt.
        Delimiters, markdown overrides, authority keywords, role resets.
        """
        t_lower = text.lower()

        features = {
            "has_system_delimiter": bool(re.search(r"(\[system\]|<\|im_start\|>|###\s*instruction|```system)", t_lower)),
            "has_role_override": bool(re.search(r"(you are now|ignore (?:all )?(?:previous|above)|disregard (?:all )?instructions|act as)", t_lower)),
            "has_financial_override": bool(re.search(r"(override|bypass|disable|ignore).*(?:limit|compliance|check|rate|sanction|threshold)", t_lower)),
            "has_base64_or_hex": bool(re.search(r"(?:[A-Za-z0-9+/]{30,}={0,2}|0x[0-9a-fA-F]{16,})", text)),
            "length": len(text),
        }
        return features


preprocessor = TextPreprocessor()
