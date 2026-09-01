with open('src/components/History.jsx', 'r') as f:
    history = f.read()
    
# Let's count braces in History.jsx to see if it's missing a closing brace
open_braces = history.count('{')
close_braces = history.count('}')

print("History braces:", open_braces, close_braces)
if open_braces > close_braces:
    # Append the missing brace before export
    history = history.replace('export default History', '}\nexport default History')
    with open('src/components/History.jsx', 'w') as f:
        f.write(history)

# Fix Privacy
with open('src/components/Privacy.jsx', 'r') as f:
    privacy = f.read()

import re
privacy = re.sub(r'<main[^>]*>', '''<div className="page-container">
      <header className="header">
        <h1>Transcendence</h1>
        <div className="actions">
          <button className="btn-secondary" onClick={() => navigate(-1)}>Voltar</button>
        </div>
      </header>
      <div className="centered-layout" style={{ minHeight: 'auto', paddingTop: '0', width: '100%', maxWidth: '800px' }}>
        <div className="card">''', privacy)
privacy = privacy.replace('</main>', '</div></div></div>')
if "import { useNavigate }" not in privacy:
    privacy = privacy.replace("import { useState }", "import { useState }\nimport { useNavigate } from 'react-router-dom'")
    if "import { useNavigate }" not in privacy:
        privacy = "import { useNavigate } from 'react-router-dom'\n" + privacy

if "const navigate = useNavigate()" not in privacy:
    privacy = privacy.replace('return (', 'const navigate = useNavigate()\n  return (')

with open('src/components/Privacy.jsx', 'w') as f:
    f.write(privacy)

# Fix Terms
with open('src/components/Terms.jsx', 'r') as f:
    terms = f.read()

terms = re.sub(r'<main[^>]*>', '''<div className="page-container">
      <header className="header">
        <h1>Transcendence</h1>
        <div className="actions">
          <button className="btn-secondary" onClick={() => navigate(-1)}>Voltar</button>
        </div>
      </header>
      <div className="centered-layout" style={{ minHeight: 'auto', paddingTop: '0', width: '100%', maxWidth: '800px' }}>
        <div className="card">''', terms)
terms = terms.replace('</main>', '</div></div></div>')
if "import { useNavigate }" not in terms:
    terms = terms.replace("import { useState }", "import { useState }\nimport { useNavigate } from 'react-router-dom'")
    if "import { useNavigate }" not in terms:
        terms = "import { useNavigate } from 'react-router-dom'\n" + terms

if "const navigate = useNavigate()" not in terms:
    terms = terms.replace('return (', 'const navigate = useNavigate()\n  return (')

with open('src/components/Terms.jsx', 'w') as f:
    f.write(terms)

