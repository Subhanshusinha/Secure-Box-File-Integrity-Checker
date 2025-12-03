document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const hashOutput = document.getElementById('hashOutput');
    const resultSection = document.getElementById('resultSection');
    const originalHashInput = document.getElementById('originalHash');
    const compareBtn = document.getElementById('compareBtn');
    const compareResult = document.getElementById('compareResult');
    const copyBtn = document.querySelector('.copy-btn');

    let currentHash = '';

    // Copy to clipboard functionality
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (currentHash) {
                navigator.clipboard.writeText(currentHash).then(() => {
                    const originalIcon = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalIcon;
                    }, 2000);
                });
            }
        });
    }

    uploadBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const originalBtnContent = uploadBtn.innerHTML;

        try {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Hashing...';

            const response = await fetch('/api/hash', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            currentHash = data.hash;

            hashOutput.textContent = currentHash;
            resultSection.classList.remove('d-none');
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while processing the file.');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = originalBtnContent;
        }
    });

    compareBtn.addEventListener('click', () => {
        const originalHash = originalHashInput.value.trim();

        if (!currentHash) {
            alert('Please upload and hash a file first.');
            return;
        }

        if (!originalHash) {
            alert('Please enter an original hash to compare.');
            return;
        }

        if (currentHash.toLowerCase() === originalHash.toLowerCase()) {
            compareResult.innerHTML = `
                <div class="alert alert-success d-flex align-items-center" role="alert">
                    <i class="fas fa-check-circle me-2 fa-lg"></i>
                    <div>
                        <strong>Match!</strong> The file integrity is verified.
                    </div>
                </div>
            `;
        } else {
            compareResult.innerHTML = `
                <div class="alert alert-danger d-flex align-items-center" role="alert">
                    <i class="fas fa-exclamation-triangle me-2 fa-lg"></i>
                    <div>
                        <strong>Mismatch!</strong> The file hashes do not match.
                    </div>
                </div>
            `;
        }
    });
});
