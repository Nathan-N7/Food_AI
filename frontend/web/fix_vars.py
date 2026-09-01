variables = '''$bg-color: #0f172a;
$card-bg: #1e293b;
$text-primary: #f8fafc;
$text-secondary: #94a3b8;
$primary-color: #3b82f6;
$primary-hover: #2563eb;
$danger-color: #ef4444;
$danger-hover: #dc2626;
$success-color: #10b981;
$border-radius: 12px;
$transition-speed: 0.3s;
$font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
'''
with open('src/styles/_variables.scss', 'w') as f:
    f.write(variables)
