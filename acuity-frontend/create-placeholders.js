const fs = require('fs');
const path = require('path');
const pages = [
    'ResidentDashboard', 'SearchResults', 'BusinessProfileView', 'ResidentProfile',
    'OwnerDashboard', 'EditBusinessProfile', 'OwnerAnalytics', 'MapPage'
];

const dir = path.join(__dirname, 'src', 'pages');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

pages.forEach(page => {
    const content = `import React from 'react';

const ${page} = () => {
  return (
    <div className="container py-4">
      <h2>${page}</h2>
      <p>Content for ${page}</p>
    </div>
  );
};

export default ${page};
`;
    fs.writeFileSync(path.join(dir, `${page}.jsx`), content);
    console.log(`Created ${page}.jsx`);
});
