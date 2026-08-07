"""
pdf_generator.py
Generates a comprehensive, clinically-styled A4 PDF report for a child's
neuro-cognitive assessment.  Light palette, warm tone.
"""
from __future__ import annotations

import json
import logging
import os
import time
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.flowables import Flowable

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# PALETTE  – light, clinical, warm
# ═══════════════════════════════════════════════════════════════════════════
class P:
    # Blues (page structure)
    NAVY         = colors.HexColor("#1C3D5A")
    STEEL        = colors.HexColor("#2E6DA4")
    SKY_LIGHT    = colors.HexColor("#EAF4FB")
    ICE          = colors.HexColor("#F4F9FD")
    # Accents
    TEAL         = colors.HexColor("#1A7F6E")
    TEAL_LIGHT   = colors.HexColor("#E6F5F2")
    LAVENDER     = colors.HexColor("#6C5B9E")
    LAVENDER_LT  = colors.HexColor("#F0EDF9")
    AMBER        = colors.HexColor("#C47A1E")
    AMBER_LIGHT  = colors.HexColor("#FEF6E7")
    # Status colours
    DANGER       = colors.HexColor("#C0392B")
    DANGER_LT    = colors.HexColor("#FDEDEC")
    WARNING      = colors.HexColor("#D35400")
    WARNING_LT   = colors.HexColor("#FEF9E7")
    SUCCESS      = colors.HexColor("#1E8449")
    SUCCESS_LT   = colors.HexColor("#EAFAF1")
    LOW_RISK     = colors.HexColor("#2471A3")
    LOW_RISK_LT  = colors.HexColor("#EBF5FB")
    # Neutrals
    TEXT         = colors.HexColor("#1C2833")
    TEXT_MID     = colors.HexColor("#424949")
    TEXT_SOFT    = colors.HexColor("#717D7E")
    BORDER       = colors.HexColor("#BFC9CA")
    RULE         = colors.HexColor("#D0D3D4")
    WHITE        = colors.white
    # Row stripes
    ROW_A        = colors.white
    ROW_B        = colors.HexColor("#F4F8FB")


# ═══════════════════════════════════════════════════════════════════════════
# CUSTOM FLOWABLES
# ═══════════════════════════════════════════════════════════════════════════
class SectionBanner(Flowable):
    """Full-width rounded banner used for section headings."""
    def __init__(self, text, bg=P.NAVY, fg=colors.white, height=24, font_size=10):
        super().__init__()
        self.text       = text
        self.bg         = bg
        self.fg         = fg
        self.bheight    = height
        self.font_size  = font_size
        self.width      = 0

    def wrap(self, aW, aH):
        self.width = aW
        return aW, self.bheight + 8

    def draw(self):
        c = self.canv
        c.setFillColor(self.bg)
        c.roundRect(0, 2, self.width, self.bheight, 4, fill=1, stroke=0)
        c.setFillColor(self.fg)
        c.setFont("Helvetica-Bold", self.font_size)
        c.drawString(12, 8, self.text)


class ThinRule(Flowable):
    """Thin horizontal accent rule."""
    def __init__(self, color=P.RULE, thickness=0.6, frac=1.0):
        super().__init__()
        self.color     = color
        self.thickness = thickness
        self.frac      = frac
        self._avail    = 0

    def wrap(self, aW, aH):
        self._avail = aW
        return aW, self.thickness + 5

    def draw(self):
        c = self.canv
        c.setStrokeColor(self.color)
        c.setLineWidth(self.thickness)
        c.line(0, 2, self._avail * self.frac, 2)


class LeftBorderBox(Flowable):
    """Draws a box with a thick coloured left accent border."""
    def __init__(self, inner_flowable, border_color=P.STEEL,
                 bg=P.ICE, border_w=4, pad=8):
        super().__init__()
        self._inner  = inner_flowable
        self.bcolor  = border_color
        self.bg      = bg
        self.bw      = border_w
        self.pad     = pad

    def wrap(self, aW, aH):
        iw, ih = self._inner.wrap(aW - self.bw - self.pad * 2, aH)
        self._ih = ih
        self._iw = iw
        self._aW = aW
        return aW, ih + self.pad * 2

    def draw(self):
        c = self.canv
        total_h = self._ih + self.pad * 2
        # Background
        c.setFillColor(self.bg)
        c.rect(0, 0, self._aW, total_h, fill=1, stroke=0)
        # Left bar
        c.setFillColor(self.bcolor)
        c.rect(0, 0, self.bw, total_h, fill=1, stroke=0)
        # Render inner
        c.saveState()
        c.translate(self.bw + self.pad, self.pad)
        self._inner.drawOn(c, 0, 0)
        c.restoreState()


# ═══════════════════════════════════════════════════════════════════════════
# STYLE FACTORY
# ═══════════════════════════════════════════════════════════════════════════
def _s(name, base="Normal", **kw):
    """Create a ParagraphStyle from keyword args."""
    return ParagraphStyle(name, parent=getSampleStyleSheet()[base], **kw)


# Pre-built shared styles
S = {
    "title":         _s("RPTitle",    fontSize=20, textColor=colors.white,
                         fontName="Helvetica-Bold", leading=24, spaceAfter=0),
    "subtitle":      _s("RPSub",      fontSize=8.5, textColor=colors.HexColor("#A9CCE3"),
                         leading=12),
    "section":       _s("RPSec",      fontSize=9, textColor=P.NAVY,
                         fontName="Helvetica-Bold", leading=13),
    "normal":        _s("RPNorm",     fontSize=9, textColor=P.TEXT, leading=13),
    "small":         _s("RPSmall",    fontSize=8.5, textColor=P.TEXT_MID, leading=12),
    "bold":          _s("RPBold",     fontSize=9, fontName="Helvetica-Bold",
                         textColor=P.TEXT, leading=13),
    "label":         _s("RPLbl",      fontSize=7.5, fontName="Helvetica-Bold",
                         textColor=P.TEXT_SOFT, leading=10, spaceAfter=1),
    "value":         _s("RPVal",      fontSize=9.5, textColor=P.TEXT, leading=13),
    "tbl_hdr":       _s("RPTblH",     fontSize=8.5, fontName="Helvetica-Bold",
                         textColor=colors.white, leading=12),
    "activity_name": _s("RPActN",     fontSize=10, fontName="Helvetica-Bold",
                         textColor=P.NAVY, leading=14),
    "note":          _s("RPNote",     fontSize=9, textColor=P.TEXT_MID,
                         leading=14, leftIndent=0),
    "interest":      _s("RPInt",      fontSize=9, textColor=P.LAVENDER,
                         fontName="Helvetica-Bold", leading=13),
    "footer":        _s("RPFoot",     fontSize=7, textColor=P.TEXT_SOFT, leading=10),
    "step":          _s("RPStep",     fontSize=8.5, textColor=P.TEXT_MID, leading=13),
    "tag":           _s("RPTag",      fontSize=8, fontName="Helvetica-Bold",
                         textColor=P.STEEL, leading=11),
}


# ═══════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════
W = 7.17 * inch  # usable width


def _spacer(n=8):
    return Spacer(1, n)


def _risk_colors(status: str):
    """Return (text_color, bg_color) for a risk level string."""
    s = status.lower()
    if "high" in s:    return P.DANGER, P.DANGER_LT
    if "medium" in s:  return P.WARNING, P.WARNING_LT
    if "low" in s:     return P.LOW_RISK, P.LOW_RISK_LT
    return P.SUCCESS, P.SUCCESS_LT


def _tbl_style(extra=None):
    base = [
        ("GRID",         (0, 0), (-1, -1), 0.35, P.RULE),
        ("BOX",          (0, 0), (-1, -1), 0.7,  P.BORDER),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",   (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
        ("LEFTPADDING",  (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]
    if extra:
        base += extra
    return TableStyle(base)


def _page_header_mini(patient_name, session_id):
    """Compact page 2+ header."""
    t = Table([[
        Paragraph(f"<b>NeuroBloom</b> — Child Cognitive Assessment",
                  _s("MH", fontSize=9.5, fontName="Helvetica-Bold", textColor=colors.white)),
        Paragraph(f"Patient: {patient_name}  |  Session: {session_id}  |  {time.strftime('%d %b %Y')}",
                  _s("MS", fontSize=8, textColor=colors.HexColor("#A9CCE3"), alignment=2)),
    ]], colWidths=[3.8 * inch, 3.37 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), P.NAVY),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (0, 0),  12),
        ("RIGHTPADDING",  (-1, 0), (-1, 0), 12),
    ]))
    return t


# ═══════════════════════════════════════════════════════════════════════════
# SECTION BUILDERS
# ═══════════════════════════════════════════════════════════════════════════

def _build_cover(story, full_json, llm_data, session_id):
    """Page 1: header, demographics, risk matrix."""

    patient_name = full_json.get("patient_name", "Child")

    # ── Main header ────────────────────────────────────────────────────────
    header = Table([[
        Table([
            [Paragraph("NeuroBloom", S["title"])],
            [Paragraph("Neuro-Cognitive Developmental Assessment Report", S["subtitle"])],
        ], colWidths=[4.4 * inch]),
        Table([
            [Paragraph("CONFIDENTIAL",
                       _s("Cf", fontSize=7, fontName="Helvetica-Bold",
                          textColor=colors.HexColor("#E74C3C"), alignment=2))],
            [Paragraph(f"Date: {time.strftime('%B %d, %Y')}",
                       _s("RD", fontSize=8, textColor=colors.HexColor("#A9CCE3"), alignment=2))],
            [Paragraph(f"ID: {session_id}",
                       _s("DID", fontSize=7.5, textColor=colors.HexColor("#85929E"), alignment=2))],
        ], colWidths=[2.6 * inch]),
    ]], colWidths=[4.4 * inch, 2.77 * inch])
    header.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), P.NAVY),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
        ("LEFTPADDING",   (0, 0), (0, 0),  16),
        ("RIGHTPADDING",  (-1, 0), (-1, 0), 14),
    ]))
    story.append(header)
    story.append(ThinRule(color=P.TEAL, thickness=3))
    story.append(_spacer(10))

    # ── Demographics strip ─────────────────────────────────────────────────
    def _dem(label, val):
        return Table([[Paragraph(label, S["label"])], [Paragraph(val, S["value"])]],
                     colWidths=[1.72 * inch])

    demo = Table([[
        _dem("PATIENT NAME", patient_name),
        _dem("SESSION ID",   session_id),
        _dem("REPORT DATE",  time.strftime("%d %b %Y")),
        _dem("ASSESSED BY",  "NeuroBloom AI Engine"),
    ]], colWidths=[1.79 * inch] * 4)
    demo.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), P.ICE),
        ("BOX",          (0, 0), (-1, -1), 0.7, P.STEEL),
        ("LINEAFTER",    (0, 0), (2, 0), 0.4, P.BORDER),
        ("TOPPADDING",   (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 9),
        ("LEFTPADDING",  (0, 0), (-1, -1), 10),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(demo)
    story.append(_spacer(14))

    # ── Risk screening matrix ──────────────────────────────────────────────
    story.append(SectionBanner("I.  CLINICAL RISK SCREENING MATRIX", P.NAVY))
    story.append(_spacer(8))

    screenings = llm_data.get("screenings", [])
    if screenings:
        rows = [[
            Paragraph("CONDITION",         S["tbl_hdr"]),
            Paragraph("RISK LEVEL",        S["tbl_hdr"]),
            Paragraph("CLINICAL FINDING",  S["tbl_hdr"]),
            Paragraph("NEUROLOGICAL BASIS",S["tbl_hdr"]),
        ]]
        for item in screenings:
            status = item.get("status", "Not Detected")
            tc, bc  = _risk_colors(status)
            badge = Table([[Paragraph(
                f"<b>{status}</b>",
                _s("B", fontSize=8, fontName="Helvetica-Bold",
                   textColor=tc, alignment=1, leading=11)
            )]])
            badge.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, -1), bc),
                ("BOX",           (0, 0), (-1, -1), 0.6, tc),
                ("TOPPADDING",    (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING",   (0, 0), (-1, -1), 4),
            ]))
            rows.append([
                Paragraph(f"<b>{item.get('disability', '')}</b>", S["normal"]),
                badge,
                Paragraph(item.get("finding", ""), S["small"]),
                Paragraph(item.get("biological_cause", ""), S["small"]),
            ])
        t = Table(rows, colWidths=[1.3*inch, 1.0*inch, 2.7*inch, 2.17*inch])
        t.setStyle(_tbl_style([
            ("BACKGROUND",    (0, 0), (-1, 0), P.NAVY),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [P.ROW_A, P.ROW_B]),
        ]))
        story.append(t)

    # ── Risk summary pill ─────────────────────────────────────────────────
    rs = llm_data.get("risk_summary", {})
    if rs:
        story.append(_spacer(8))
        rl    = rs.get("overall_risk_level", "")
        tc, bc = _risk_colors(rl)
        summary_row = Table([[
            Paragraph("OVERALL RISK LEVEL", S["label"]),
            Paragraph(f"<b>{rl}</b>", _s("ORL", fontSize=9.5, fontName="Helvetica-Bold",
                                          textColor=tc, leading=13)),
            Paragraph(rs.get("positive_outlook", ""), S["small"]),
        ]], colWidths=[1.3*inch, 1.0*inch, 4.87*inch])
        summary_row.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), bc),
            ("BOX",           (0, 0), (-1, -1), 0.6, tc),
            ("TOPPADDING",    (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ("LEFTPADDING",   (0, 0), (-1, -1), 10),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(summary_row)

    # Priority areas
    priority = rs.get("priority_areas", [])
    if priority:
        story.append(_spacer(5))
        ptext = "  ·  ".join(f"<b>{p}</b>" for p in priority)
        story.append(Paragraph(
            f"<font color='#2471A3'><b>Priority Focus Areas:</b></font>  {ptext}",
            S["small"],
        ))


def _build_interest_profile(story, llm_data):
    """Interest profile section."""
    profile = llm_data.get("child_interest_profile", {})
    if not profile:
        return

    story.append(_spacer(14))
    story.append(SectionBanner("II.  CHILD INTEREST & APTITUDE PROFILE",
                               colors.HexColor("#4A235A")))
    story.append(_spacer(8))

    interests = profile.get("areas_of_natural_interest", [])
    if interests:
        cols = min(len(interests), 4)
        col_w = W / cols
        cells = []
        for item in interests:
            cell_inner = Table([
                [Paragraph(item.get("interest", ""), S["interest"])],
                [Paragraph(item.get("data_cue", ""), S["step"])],
            ], colWidths=[col_w - 16])
            cell_inner.setStyle(TableStyle([
                ("TOPPADDING",    (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LEFTPADDING",   (0, 0), (-1, -1), 0),
            ]))
            cells.append(Table([
                [Paragraph("◆", _s("Dot", fontSize=14, textColor=P.LAVENDER, leading=16))],
                [cell_inner],
            ], colWidths=[col_w - 14]))
        row_table = Table(
            [cells],
            colWidths=[col_w] * cols,
        )
        row_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), P.LAVENDER_LT),
            ("BOX",           (0, 0), (-1, -1), 0.5, colors.HexColor("#C39BD3")),
            ("LINEAFTER",     (0, 0), (-2, -1), 0.3, colors.HexColor("#C39BD3")),
            ("TOPPADDING",    (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING",   (0, 0), (-1, -1), 10),
            ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(row_table)

    note = profile.get("interest_note", "")
    if note:
        story.append(_spacer(8))
        story.append(Paragraph(f"<i>{note}</i>",
                               _s("IN", fontSize=9, textColor=P.TEXT_MID,
                                  leading=14, leftIndent=6)))


def _build_developmental_profile(story, llm_data):
    """Strengths, areas for growth, and special note."""
    story.append(_spacer(14))
    story.append(SectionBanner("III.  DEVELOPMENTAL PROFILE — STRENGTHS & GROWTH AREAS", P.NAVY))
    story.append(_spacer(10))

    cp = llm_data.get("child_profile", {})
    strengths = cp.get("strengths", [])
    growth    = cp.get("areas_for_growth", [])

    def _strength_row(item):
        return [
            Paragraph(f"<b>{item.get('area', '')}</b>", S["section"]),
            Table([
                [Paragraph(item.get("detail", ""),    S["small"])],
                [Paragraph(f"<font color='#1E8449'><b>Excels in:</b></font> "
                           f"{item.get('excels_in', '')}", S["step"])],
            ], colWidths=[5.07 * inch]),
        ]

    def _growth_row(item):
        return [
            Paragraph(f"<b>{item.get('area', '')}</b>",
                      _s("GR", fontSize=9, fontName="Helvetica-Bold",
                         textColor=P.DANGER, leading=13)),
            Table([
                [Paragraph(item.get("detail", ""),    S["small"])],
                [Paragraph(f"<font color='#C0392B'><b>Lags behind:</b></font> "
                           f"{item.get('lags_behind', '')}", S["step"])],
            ], colWidths=[5.07 * inch]),
        ]

    # Strengths table
    if strengths:
        str_hdr = [[
            Paragraph("▲  COGNITIVE STRENGTHS",
                      _s("SH", fontSize=9, fontName="Helvetica-Bold",
                         textColor=P.SUCCESS, leading=13)),
            Paragraph("DETAIL & REAL-WORLD IMPLICATION",
                      _s("SD", fontSize=8.5, fontName="Helvetica-Bold",
                         textColor=P.TEXT_SOFT, leading=12)),
        ]]
        str_rows = str_hdr + [_strength_row(i) for i in strengths]
        str_tbl = Table(str_rows, colWidths=[1.9 * inch, 5.27 * inch])
        str_tbl.setStyle(_tbl_style([
            ("BACKGROUND",    (0, 0), (-1, 0), P.SUCCESS_LT),
            ("LINEBELOW",     (0, 0), (-1, 0), 0.8, P.TEAL),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [P.ROW_A, P.SUCCESS_LT]),
            ("LINELEFT",      (0, 0), (0, -1), 3, P.TEAL),
        ]))
        story.append(str_tbl)
        story.append(_spacer(10))

    # Growth table
    if growth:
        gr_hdr = [[
            Paragraph("▼  AREAS FOR GROWTH",
                      _s("GH", fontSize=9, fontName="Helvetica-Bold",
                         textColor=P.DANGER, leading=13)),
            Paragraph("DETAIL & OBSERVED IMPACT",
                      _s("GD", fontSize=8.5, fontName="Helvetica-Bold",
                         textColor=P.TEXT_SOFT, leading=12)),
        ]]
        gr_rows = gr_hdr + [_growth_row(i) for i in growth]
        gr_tbl = Table(gr_rows, colWidths=[1.9 * inch, 5.27 * inch])
        gr_tbl.setStyle(_tbl_style([
            ("BACKGROUND",    (0, 0), (-1, 0), P.DANGER_LT),
            ("LINEBELOW",     (0, 0), (-1, 0), 0.8, P.DANGER),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [P.ROW_A, P.DANGER_LT]),
            ("LINELEFT",      (0, 0), (0, -1), 3, P.DANGER),
        ]))
        story.append(gr_tbl)

    # Special note
    special = cp.get("special_note", "")
    if special:
        story.append(_spacer(12))
        note_inner = Paragraph(
            f"<b>✦ A Note on This Child</b><br/><br/>{special}",
            _s("SN", fontSize=9, textColor=P.TEXT_MID, leading=14),
        )
        # Simple boxed note
        note_tbl = Table([[note_inner]], colWidths=[W - 20])
        note_tbl.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), P.AMBER_LIGHT),
            ("BOX",           (0, 0), (-1, -1), 1.2, P.AMBER),
            ("LINELEFT",      (0, 0), (0, -1),  4, P.AMBER),
            ("TOPPADDING",    (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("LEFTPADDING",   (0, 0), (-1, -1), 14),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
        ]))
        story.append(note_tbl)


def _build_parental_guidance(story, llm_data):
    """Parental instructions and environmental adjustments."""
    story.append(_spacer(14))
    story.append(SectionBanner("IV.  GUIDANCE FOR PARENTS & CAREGIVERS",
                               colors.HexColor("#1A5276")))
    story.append(_spacer(8))

    pg = llm_data.get("parental_guidance", {})

    # Instructions
    instructions = pg.get("parent_instructions", [])
    if instructions:
        rows = [[
            Paragraph("INSTRUCTION", S["tbl_hdr"]),
            Paragraph("WHY THIS HELPS", S["tbl_hdr"]),
        ]]
        for item in instructions:
            rows.append([
                Paragraph(f"→  {item.get('instruction', '')}", S["bold"]),
                Paragraph(item.get("because", ""), S["small"]),
            ])
        t = Table(rows, colWidths=[3.2 * inch, 3.97 * inch])
        t.setStyle(_tbl_style([
            ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#1A5276")),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [P.SKY_LIGHT, P.ROW_A]),
            ("LINELEFT",      (0, 0), (0, -1), 3, P.STEEL),
        ]))
        story.append(t)

    # Environmental adjustments
    env = pg.get("environmental_adjustments", [])
    if env:
        story.append(_spacer(10))
        story.append(SectionBanner("  ENVIRONMENTAL ADJUSTMENTS FOR HOME & SCHOOL",
                                   P.TEAL, height=20, font_size=9))
        story.append(_spacer(6))
        env_rows = [[Paragraph(f"◉  {e}", S["normal"])] for e in env]
        env_tbl = Table(env_rows, colWidths=[W])
        env_tbl.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), P.TEAL_LIGHT),
            ("BOX",           (0, 0), (-1, -1), 0.6, P.TEAL),
            ("LINELEFT",      (0, 0), (0, -1),  3, P.TEAL),
            ("TOPPADDING",    (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ]))
        story.append(env_tbl)


def _build_activity_plan(story, llm_data):
    """Real-life gamified activities and therapy recommendations."""
    story.append(PageBreak())

    # ── Mini page header ───────────────────────────────────────────────────
    # (caller inserts it before calling this – handled in create_pdf)

    story.append(SectionBanner("V.  REAL-LIFE ACTIVITY PLAN FOR THE CHILD", P.NAVY))
    story.append(_spacer(8))
    story.append(Paragraph(
        "The following activities are designed to strengthen specific cognitive skills "
        "through play and routine. No special equipment is needed — just 10–20 minutes "
        "of quality time each day.",
        S["small"],
    ))
    story.append(_spacer(10))

    activities = llm_data.get("intervention_plan", {}).get("daily_activities", [])
    for idx, act in enumerate(activities, 1):
        steps = act.get("instructions", [])
        if isinstance(steps, str):
            # Fallback: single string — split on period/newline
            steps = [s.strip() for s in steps.replace("\n", ". ").split(". ") if s.strip()]

        step_items = []
        for si, step in enumerate(steps, 1):
            step_items.append([Paragraph(f"<b>{si}.</b>  {step}", S["step"])])

        steps_tbl = Table(step_items, colWidths=[5.57 * inch])
        steps_tbl.setStyle(TableStyle([
            ("TOPPADDING",    (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ]))

        act_block = Table([
            # Title row
            [
                Paragraph(f"<b>#{idx:02d}</b>",
                          _s("AN", fontSize=8, fontName="Helvetica-Bold",
                             textColor=P.STEEL, leading=11)),
                Paragraph(act.get("fun_name", act.get("name", "Activity")),
                          S["activity_name"]),
                Paragraph(f"<b>Frequency:</b> {act.get('frequency', '')}",
                          _s("Freq", fontSize=8, textColor=P.TEAL,
                             fontName="Helvetica-Bold", leading=11, alignment=2)),
            ],
            # Goal / target row
            [
                Paragraph("GOAL", S["label"]),
                Paragraph(act.get("goal", ""), S["small"]),
                Paragraph(f"<b>Targets:</b> {act.get('targets_deficit', '')}",
                          _s("TD", fontSize=8, textColor=P.TEXT_SOFT, leading=11, alignment=2)),
            ],
            # Steps row
            [
                Paragraph("HOW TO", S["label"]),
                steps_tbl,
                Paragraph(""),
            ],
            # Benefit row
            [
                Paragraph("BENEFIT", S["label"]),
                Paragraph(act.get("expected_benefit", ""), S["small"]),
                Paragraph(""),
            ],
        ], colWidths=[0.7 * inch, 5.57 * inch, 0.9 * inch])

        act_block.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), P.ICE),
            ("BACKGROUND",    (0, 0), (-1, 0), P.SKY_LIGHT),
            ("LINELEFT",      (0, 0), (0, -1), 4, P.STEEL),
            ("LINEBELOW",     (0, 0), (-1, 0), 0.5, P.RULE),
            ("LINEBELOW",     (0, 1), (-1, 1), 0.5, P.RULE),
            ("LINEBELOW",     (0, 2), (-1, 2), 0.5, P.RULE),
            ("BOX",           (0, 0), (-1, -1), 0.6, P.BORDER),
            ("VALIGN",        (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING",   (0, 0), (0, -1), 8),
            ("LEFTPADDING",   (1, 0), (1, -1), 10),
            ("RIGHTPADDING",  (2, 0), (2, -1), 10),
            ("SPAN",          (1, 2), (2, 2)),
            ("SPAN",          (1, 3), (2, 3)),
        ]))
        story.append(KeepTogether([act_block, _spacer(8)]))


def _build_therapy_recommendations(story, llm_data):
    """Professional therapy recommendations."""
    therapies = llm_data.get("intervention_plan", {}).get("therapeutic_recommendations", [])
    if not therapies:
        return

    story.append(_spacer(10))
    story.append(SectionBanner("VI.  RECOMMENDED PROFESSIONAL THERAPIES", P.TEAL))
    story.append(_spacer(8))

    rows = [[
        Paragraph("THERAPY",           S["tbl_hdr"]),
        Paragraph("FREQUENCY",         S["tbl_hdr"]),
        Paragraph("CLINICAL RATIONALE",S["tbl_hdr"]),
        Paragraph("WHAT TO TELL YOUR THERAPIST", S["tbl_hdr"]),
    ]]
    for th in therapies:
        rows.append([
            Paragraph(f"<b>{th.get('therapy', '')}</b>", S["bold"]),
            Paragraph(th.get("session_frequency", ""),    S["small"]),
            Paragraph(th.get("reason", ""),               S["small"]),
            Paragraph(th.get("what_to_tell_therapist", ""), S["small"]),
        ])
    t = Table(rows, colWidths=[1.4*inch, 0.9*inch, 2.6*inch, 2.27*inch])
    t.setStyle(_tbl_style([
        ("BACKGROUND",    (0, 0), (-1, 0), P.TEAL),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [P.TEAL_LIGHT, P.ROW_A]),
    ]))
    story.append(t)


def _build_footer(story, session_id):
    """Signature block and disclaimer."""
    story.append(Spacer(1, 28))
    story.append(ThinRule(color=P.RULE, thickness=0.5))
    story.append(_spacer(10))

    sig = Table([[
        Table([
            [Paragraph("_________________________________", S["small"])],
            [Paragraph("<b>Certified Clinical Reviewer</b>", S["bold"])],
            [Paragraph("NeuroBloom Diagnostic Centre",       S["small"])],
            [Paragraph(f"Date: {time.strftime('%d/%m/%Y')}", S["small"])],
        ], colWidths=[3.0 * inch]),
        Table([
            [Paragraph("<b>DISCLAIMER</b>",
                       _s("DL", fontSize=7.5, fontName="Helvetica-Bold",
                          textColor=P.DANGER))],
            [Paragraph(
                "This report is generated to assist qualified clinicians and educators and "
                "is not a standalone diagnostic instrument. All findings must be interpreted "
                "by a licensed healthcare professional in conjunction with a comprehensive "
                "clinical evaluation. Scores are derived from digital behavioural signals and "
                "should be treated as indicative, not definitive.",
                _s("DC", fontSize=7.5, textColor=P.TEXT_SOFT, leading=11),
            )],
        ], colWidths=[4.0 * inch]),
    ]], colWidths=[3.1 * inch, 4.07 * inch])
    sig.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",   (1, 0), (1, 0),  18),
        ("BACKGROUND",    (1, 0), (1, 0),  P.AMBER_LIGHT),
        ("BOX",           (1, 0), (1, 0),  0.5, P.AMBER),
        ("TOPPADDING",    (1, 0), (1, 0),  10),
        ("BOTTOMPADDING", (1, 0), (1, 0),  10),
        ("RIGHTPADDING",  (1, 0), (1, 0),  12),
    ]))
    story.append(sig)


# ═══════════════════════════════════════════════════════════════════════════
# PUBLIC ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════
def create_pdf(full_json: dict, llm_response) -> str | None:
    """
    Build the full assessment PDF and return the file path.

    Args:
        full_json    : Aggregated assessment data dict (from /predict/full_report)
        llm_response : Either a dict (parsed) or JSON string from Groq

    Returns:
        Path to the generated PDF, or None on failure.
    """
    # Parse LLM response
    try:
        if isinstance(llm_response, str):
            clean = llm_response.strip()
            if clean.startswith("```"):
                clean = clean.split("```", 2)[-1].replace("json", "", 1).rstrip("`").strip()
            llm_data = json.loads(clean)
        elif isinstance(llm_response, dict):
            llm_data = llm_response
        else:
            raise ValueError(f"Unexpected llm_response type: {type(llm_response)}")
    except Exception as exc:
        logger.error("Failed to parse LLM response: %s", exc)
        return None

    os.makedirs("reports", exist_ok=True)
    session_id = str(full_json.get("session_id", f"report_{int(time.time())}"))
    filename   = f"reports/{session_id}.pdf"

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=36, leftMargin=36,
        topMargin=36,   bottomMargin=48,
    )

    patient_name = full_json.get("patient_name", "Child")
    story: list = []

    # Page 1
    _build_cover(story, full_json, llm_data, session_id)
    _build_interest_profile(story, llm_data)
    _build_developmental_profile(story, llm_data)
    _build_parental_guidance(story, llm_data)

    # Page 2 — mini header then activities
    story.append(PageBreak())
    story.append(_page_header_mini(patient_name, session_id))
    story.append(ThinRule(color=P.TEAL, thickness=2))
    story.append(_spacer(10))

    # Re-use the activity plan builder (it adds its own SectionBanner)
    act_story: list = []
    _build_activity_plan(act_story, llm_data)
    # Remove the leading PageBreak that _build_activity_plan inserts (we already broke)
    if act_story and isinstance(act_story[0], PageBreak):
        act_story.pop(0)
    story.extend(act_story)

    _build_therapy_recommendations(story, llm_data)
    _build_footer(story, session_id)

    try:
        doc.build(story)
        logger.info("PDF generated: %s", filename)
        return filename
    except Exception as exc:
        logger.error("PDF build failed: %s", exc)
        return None