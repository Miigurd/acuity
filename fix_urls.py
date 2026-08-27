import os
import re

def fix_urls(directory, env_var):
    pattern_single = r"'http://(?:localhost|127\.0\.0\.1):5000(.*?)'"
    pattern_double = r'"http://(?:localhost|127\.0\.0\.1):5000(.*?)"'
    pattern_backtick = r"`http://(?:localhost|127\.0\.0\.1):5000(.*?)`"
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    orig = content
                    
                    if env_var == 'VITE_API_URL':
                        env_str = f"import.meta.env.VITE_API_URL || 'http://localhost:5000'"
                    else:
                        env_str = f"process.env.REACT_APP_API_URL || 'http://localhost:5000'"
                        
                    content = re.sub(pattern_single, rf"({env_str}) + '\1'", content)
                    content = re.sub(pattern_double, rf'({env_str}) + "\1"', content)
                    content = re.sub(pattern_backtick, rf"`${{{env_str}}}\1`", content)
                    
                    if content != orig:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"Updated {filepath}")
                except Exception as e:
                    print(f"Failed {filepath}: {e}")

fix_urls(os.path.abspath('acuity-frontend/src'), 'REACT_APP_API_URL')
fix_urls(os.path.abspath('acuity-admin/src'), 'VITE_API_URL')
