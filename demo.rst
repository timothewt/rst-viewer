===============================
🚀 RST Viewer Chrome Extension
===============================

**Transform raw reStructuredText files into beautiful, readable documents instantly!**

✨ **Key Features:** Professional syntax highlighting • Beautiful typography • Math equations • Zero configuration

Python Development
==================

.. code-block:: python

    import asyncio
    from dataclasses import dataclass
    from typing import List, Optional

    @dataclass
    class DocumentProcessor:
        """Process RST documents with syntax highlighting."""
        theme: str = "github-dark"
        languages: List[str] = None
        
        async def process(self, content: str) -> dict:
            """Process RST content asynchronously."""
            result = await self.compile_rst(content)
            return {
                "html": result.body,
                "success": True,
                "language_count": len(self.languages or [])
            }

JavaScript & APIs
=================

.. code-block:: javascript

    class RstViewer {
        constructor(options = {}) {
            this.theme = options.theme || 'github-dark';
            this.prismConfig = {
                themes: ['tomorrow-night', 'oceanic-next'],
                languages: this.getSupportedLanguages()
            };
        }
        
        async processDocument(content) {
            const compiler = new RstToHtmlCompiler();
            const html = await compiler.compile(content);
            
            return {
                success: true,
                html: html.body,
                metadata: this.extractMetadata(html.header)
            };
        }
    }

Database Queries
================

.. code-block:: sql

    -- Document analytics with syntax highlighting
    SELECT 
        d.language,
        COUNT(*) as total_docs,
        AVG(LENGTH(d.content)) as avg_size,
        COUNT(cb.id) as code_blocks
    FROM rst_documents d
    LEFT JOIN code_blocks cb ON d.id = cb.document_id
    WHERE d.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY d.language
    ORDER BY total_docs DESC;

Configuration & DevOps
======================

.. code-block:: yaml

    # GitHub Actions CI/CD Pipeline
    name: RST Viewer Build
    on: [push, pull_request]
    
    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with:
              node-version: '18'
              cache: 'npm'
          - run: npm ci && npm test

.. code-block:: json

    {
      "name": "rst-viewer-extension",
      "version": "2.1.0",
      "description": "Beautiful RST viewer with syntax highlighting",
      "permissions": ["activeTab", "storage"],
      "content_scripts": [{
        "matches": ["file://*.rst"],
        "js": ["content.js"],
        "css": ["rst-styles.css", "prism.css"]
      }]
    }

📊 Feature Support
==================

======================  ================
Feature                 Status
======================  ================
Syntax Highlighting     ✅ **Perfect**
Math Equations          ✅ **Perfect**
Tables & Lists          ✅ **Perfect**
Admonitions             ✅ **Perfect**
======================  ================

🎯 Smart Admonitions
====================

.. note::
   **Pro Tip**: Works automatically with any `.rst` file. Zero configuration required!

.. tip::
   **Performance**: Fast processing with optimized JavaScript compilation.

.. warning::
   **Compatibility**: Supports all standard RST directives and syntax highlighting.

🧮 Mathematical Excellence
==========================

Einstein's equation: :math:`E = mc^2`

Complex integrals render beautifully:

.. math::

    \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}

.. math::

    \sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}

🚀 Installation
===============

1. **Install from Chrome Web Store** - One-click setup
2. **Open any `.rst` file** - Automatic transformation  
3. **Enjoy beautiful formatting** - No configuration needed!

**Perfect for developers, technical writers, and documentation enthusiasts.**

---

**Ready to transform your RST experience?** Install today! 🎉
