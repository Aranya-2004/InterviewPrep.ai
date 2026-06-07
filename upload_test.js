import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

(async () => {
  try {
    const filePath = './sample_resume.txt';
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, 'sample');
    const form = new FormData();
    form.append('resume', fs.createReadStream(filePath));
    form.append('jobRole', 'software_engineer');

    const res = await fetch('http://localhost:5001/api/resume', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
  } catch (e) {
    console.error('Upload test failed:', e.message || e);
  }
})();
