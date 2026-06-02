"""
Converts Markdown → HTML → PDF using pandoc for the HTML step
and the macOS built-in `cupsfilter` or a simple webbrowser+print approach.

Since we don't have LaTeX or weasyprint, we'll output a styled HTML file
that can be opened in a browser and printed/saved as PDF.

Usage:
  python3 md_to_pdf.py <input.md> <output.html>

Then open the HTML file in a browser and use Cmd+P → Save as PDF.
"""

import sys
import subprocess
import os

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 md_to_pdf.py <input.md> [output.html]")
        sys.exit(1)

    input_md = sys.argv[1]
    output_html = sys.argv[2] if len(sys.argv) > 2 else input_md.replace('.md', '.html')

    if not os.path.exists(input_md):
        print(f"Error: {input_md} not found")
        sys.exit(1)

    # Use pandoc to convert MD → standalone HTML with Thai-friendly styling
    css = """
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');

  * { box-sizing: border-box; }

  body {
    font-family: 'Sarabun', 'Helvetica Neue', sans-serif;
    font-size: 14px;
    line-height: 1.8;
    color: #1a1a2e;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 30px;
    background: #fff;
  }

  h1 {
    font-size: 22px;
    font-weight: 700;
    color: #0f3460;
    border-bottom: 3px solid #0f3460;
    padding-bottom: 10px;
    margin-top: 40px;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 18px;
    font-weight: 700;
    color: #16213e;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 8px;
    margin-top: 32px;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a2e;
    margin-top: 24px;
    margin-bottom: 12px;
  }

  p { margin: 10px 0; }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 13px;
  }

  th, td {
    border: 1px solid #ccc;
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background: #0f3460;
    color: #fff;
    font-weight: 600;
  }

  tr:nth-child(even) { background: #f8f9fa; }

  code {
    font-family: 'SF Mono', 'Fira Code', monospace;
    background: #f0f0f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px;
  }

  pre {
    background: #1a1a2e;
    color: #e8e8e8;
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.6;
  }

  pre code {
    background: none;
    padding: 0;
    color: #e8e8e8;
  }

  blockquote {
    border-left: 4px solid #e94560;
    margin: 16px 0;
    padding: 8px 16px;
    background: #fff5f5;
    color: #c0392b;
    font-weight: 600;
  }

  ul, ol {
    padding-left: 24px;
    margin: 10px 0;
  }

  li { margin: 4px 0; }

  strong { color: #0f3460; }

  hr {
    border: none;
    border-top: 2px solid #e0e0e0;
    margin: 32px 0;
  }

  @media print {
    body {
      max-width: 100%;
      padding: 20px;
      font-size: 11px;
    }
    pre { font-size: 10px; }
    h1 { font-size: 18px; }
    h2 { font-size: 15px; }
    h3 { font-size: 13px; }
  }
</style>
"""

    try:
        result = subprocess.run(
            [
                'pandoc',
                input_md,
                '-f', 'markdown',
                '-t', 'html5',
                '--standalone',
                '--metadata', 'title=ParkinScan Project Workflow',
                '-H', '/dev/stdin',
            ],
            input=css,
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            print(f"pandoc error: {result.stderr}")
            sys.exit(1)

        with open(output_html, 'w', encoding='utf-8') as f:
            f.write(result.stdout)

        print(f"✅ HTML created: {output_html}")
        print(f"   → Open in browser and use Cmd+P → 'Save as PDF' to create PDF")

    except FileNotFoundError:
        print("Error: pandoc not found. Please install pandoc first.")
        sys.exit(1)

if __name__ == '__main__':
    main()
