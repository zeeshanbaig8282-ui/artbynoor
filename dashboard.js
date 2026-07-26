let savedPasscode = 'Am@ma143';

function tryUnlock() {
  const passcode = document.getElementById('passcodeInput').value.trim();
  const lockErr = document.getElementById('lockErr');

  if (!passcode) {
    lockErr.textContent = 'Please enter a passcode.';
    return;
  }

  // Store the passcode to send with requests
  savedPasscode = passcode;

  // Attempt to load gallery manager to verify passcode with API
  fetch('/api/images')
    .then(() => {
      document.getElementById('lockScreen').style.display = 'none';
      document.getElementById('dashContent').style.display = 'block';
      loadExistingImages();
    })
    .catch((err) => {
      lockErr.textContent = 'Error connecting to server.';
    });
}

// Preview image when selected
document.getElementById('uploadFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  const preview = document.getElementById('uploadPreview');
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
});

async function uploadImage() {
  const btn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('uploadFile');
  const category = document.getElementById('uploadCategory').value;
  const title = document.getElementById('uploadTitle').value.trim();

  if (!fileInput.files || fileInput.files.length === 0) {
    alert('Please select a picture to upload.');
    return;
  }

  const file = fileInput.files[0];

  // Client-side image size check (4 MB limit)
  if (file.size > 4 * 1024 * 1024) {
    alert('Image is too large! Please select an image smaller than 4MB.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Uploading...';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('title', title);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'x-passcode': savedPasscode, // Sends passcode to Vercel API
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || 'Upload failed');
    }

    alert('Picture uploaded successfully!');
    fileInput.value = '';
    document.getElementById('uploadTitle').value = '';
    document.getElementById('uploadPreview').style.display = 'none';
    
    // Refresh gallery manager grid
    loadExistingImages();
  } catch (err) {
    alert('Upload error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Upload Picture';
  }
}